-- Restrict grant/revoke of admin roles to the hardcoded Master Admin only.

create or replace function public.is_master_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce((
    select email from auth.users where id = auth.uid()
  ), '')) = 'ha1900612@gmail.com';
$$;

revoke all on function public.is_master_admin() from public, anon;
grant execute on function public.is_master_admin() to authenticated;

drop policy if exists "admins manage roles" on public.user_roles;

create policy "master manage roles" on public.user_roles
  for all to authenticated
  using (public.is_master_admin())
  with check (public.is_master_admin());

-- Ensure the master account always has admin, even if created before this policy.
create or replace function public.ensure_master_admin()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare uid uuid;
begin
  select id into uid from auth.users where lower(email) = 'ha1900612@gmail.com' limit 1;
  if uid is not null then
    insert into public.user_roles (user_id, role)
    values (uid, 'admin')
    on conflict (user_id, role) do nothing;
  end if;
end;
$$;

revoke all on function public.ensure_master_admin() from public, anon;
grant execute on function public.ensure_master_admin() to authenticated;
