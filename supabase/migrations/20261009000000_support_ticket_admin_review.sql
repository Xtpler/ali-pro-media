-- ===== Admin ticket approvals: robust staff checks + atomic review RPC =====
--
-- Why: admin approve/close/reopen/delete of support tickets silently did
-- nothing. The staff policies depend on public.is_staff(), whose definition
-- referenced public.profiles.role — a column that does not exist in this
-- schema — so the role check could fail and the UPDATE matched 0 rows without
-- raising an error (PostgREST returns success when RLS hides the row).

-- 1) Ensure the column is_staff() historically expected actually exists.
alter table public.profiles add column if not exists role text not null default 'user';

-- 2) Rebuild is_staff() without depending on optional columns and always treat
--    the hardcoded master admin as staff.
create or replace function public.is_staff(_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from public.user_roles
      where user_id = _uid and role::text in ('admin', 'super_admin')
    )
    or exists (
      select 1 from auth.users u
      where u.id = _uid and lower(u.email) = 'ha1900612@gmail.com'
    );
$$;

revoke all on function public.is_staff(uuid) from public, anon;
grant execute on function public.is_staff(uuid) to authenticated;

-- 3) Guarantee the master admin owns the admin role so policies pass.
do $$
declare master uuid;
begin
  select id into master from auth.users where lower(email) = 'ha1900612@gmail.com' limit 1;
  if master is not null then
    insert into public.user_roles (user_id, role) values (master, 'admin') on conflict do nothing;
  end if;
end $$;

-- 4) Ticket columns used by approve/close (idempotent).
alter table public.support_tickets add column if not exists approved_at timestamptz;
alter table public.support_tickets add column if not exists closed_at timestamptz;
alter table public.support_tickets add column if not exists updated_at timestamptz not null default now();

-- 5) Recreate staff policies so they exist regardless of earlier failures.
grant select, insert, update, delete on public.support_tickets to authenticated;
alter table public.support_tickets enable row level security;

drop policy if exists "tickets staff read" on public.support_tickets;
create policy "tickets staff read" on public.support_tickets for select to authenticated
  using (public.is_staff(auth.uid()));

drop policy if exists "tickets staff update" on public.support_tickets;
create policy "tickets staff update" on public.support_tickets for update to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

drop policy if exists "tickets staff delete" on public.support_tickets;
create policy "tickets staff delete" on public.support_tickets for delete to authenticated
  using (public.is_staff(auth.uid()));

-- 6) Atomic review function used by the admin dashboard.
create or replace function public.review_support_ticket(_ticket_id uuid, _action text)
returns public.support_tickets
language plpgsql
security definer
set search_path = public
as $$
declare result public.support_tickets;
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  if _action = 'delete' then
    delete from public.ticket_replies where ticket_id = _ticket_id;
    delete from public.support_tickets where id = _ticket_id;
    return null;
  elsif _action = 'close' then
    update public.support_tickets
       set status = 'closed', closed_at = now(), updated_at = now()
     where id = _ticket_id
     returning * into result;
  elsif _action in ('approve', 'reopen') then
    update public.support_tickets
       set status = 'open',
           approved_at = coalesce(approved_at, now()),
           closed_at = null,
           updated_at = now()
     where id = _ticket_id
     returning * into result;
  else
    raise exception 'bad action: %', _action using errcode = '22023';
  end if;

  if result.id is null then
    raise exception 'ticket not found' using errcode = 'P0002';
  end if;

  return result;
end;
$$;

revoke all on function public.review_support_ticket(uuid, text) from public, anon;
grant execute on function public.review_support_ticket(uuid, text) to authenticated;

notify pgrst, 'reload schema';
