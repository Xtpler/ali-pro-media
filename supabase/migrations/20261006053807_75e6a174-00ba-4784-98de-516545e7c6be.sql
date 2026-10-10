-- ============ announcements ============
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.announcements to anon;
grant select, insert, update, delete on public.announcements to authenticated;
grant all on public.announcements to service_role;
alter table public.announcements enable row level security;
create policy "announcements public read" on public.announcements for select to anon, authenticated using (true);
create policy "announcements admin write" on public.announcements for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ============ vouchers ============
create table if not exists public.vouchers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  amount_iqd numeric not null default 0,
  active boolean not null default true,
  used_by uuid references auth.users(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.vouchers to authenticated;
grant all on public.vouchers to service_role;
alter table public.vouchers enable row level security;
create policy "vouchers admin all" on public.vouchers for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "vouchers own used read" on public.vouchers for select to authenticated using (used_by = auth.uid());

-- ============ notifications ============
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  audience text not null default 'user',
  title text not null default '',
  message text not null default '',
  kind text not null default 'info',
  read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "notif own read" on public.notifications for select to authenticated
  using (user_id = auth.uid() or (audience = 'admin' and public.has_role(auth.uid(),'admin')));
create policy "notif insert" on public.notifications for insert to authenticated with check (true);
create policy "notif own update" on public.notifications for update to authenticated
  using (user_id = auth.uid() or (audience = 'admin' and public.has_role(auth.uid(),'admin')))
  with check (true);

-- seed a welcome announcement so the banner has content
insert into public.announcements (message, active)
select 'مرحباً بك في Ali Pro Media — شحن فوري وخدمات رقمية موثوقة على مدار الساعة', true
where not exists (select 1 from public.announcements);