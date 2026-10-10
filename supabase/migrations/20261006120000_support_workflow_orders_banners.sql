-- Banners: columns the admin form already writes (badge + CTA link)
alter table public.banners add column if not exists badge_text text not null default '';
alter table public.banners add column if not exists link_url text not null default '';

-- Support tickets: pending -> open (approved by admin) -> closed
alter table public.support_tickets alter column status set default 'pending';
alter table public.support_tickets add column if not exists approved_at timestamptz;
alter table public.support_tickets add column if not exists closed_at timestamptz;

drop policy if exists "tickets own insert" on public.support_tickets;
create policy "tickets own insert" on public.support_tickets for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');

-- Users may only close their own ticket (never self-approve)
drop policy if exists "tickets own update" on public.support_tickets;
create policy "tickets own update" on public.support_tickets for update to authenticated
  using (user_id = auth.uid() and status <> 'closed')
  with check (user_id = auth.uid() and status = 'closed');

-- Chat is only possible while the ticket is open (admins always allowed)
drop policy if exists "replies insert" on public.ticket_replies;
create policy "replies insert" on public.ticket_replies for insert to authenticated
  with check (user_id = auth.uid() and (
    public.has_role(auth.uid(),'admin')
    or exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid() and t.status = 'open')
  ));

-- Orders: expected duration + progress timestamps
alter table public.orders add column if not exists estimated_minutes int not null default 0;
alter table public.orders add column if not exists started_at timestamptz;
alter table public.orders add column if not exists completed_at timestamptz;
alter table public.products add column if not exists eta_minutes int not null default 0;

-- Realtime for live order tracking, chat, notifications and the ad board
do $$
declare t text;
begin
  foreach t in array array['orders','support_tickets','ticket_replies','notifications','banners'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
