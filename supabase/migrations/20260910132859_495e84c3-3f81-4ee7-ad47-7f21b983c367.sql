-- ============ roles ============
create type public.app_role as enum ('admin','moderator','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "admins read roles" on public.user_roles for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admins manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ============ profiles ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  phone text not null default '',
  wallet_balance_iqd numeric not null default 0,
  is_banned boolean not null default false,
  is_restricted boolean not null default false,
  avatar_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create policy "read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "admins read profiles" on public.profiles for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "admins update profiles" on public.profiles for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create trigger profiles_updated before update on public.profiles
for each row execute function public.set_updated_at();

-- wallet balance is only changed by trusted database functions
create or replace function public.guard_wallet_balance()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.wallet_balance_iqd is distinct from old.wallet_balance_iqd
     and not public.has_role(auth.uid(),'admin')
     and auth.uid() is not null then
    new.wallet_balance_iqd := old.wallet_balance_iqd;
  end if;
  return new;
end $$;

create trigger profiles_wallet_guard before update on public.profiles
for each row execute function public.guard_wallet_balance();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    coalesce(new.email,''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email,''),'@',1)),
    coalesce(new.raw_user_meta_data->>'phone', coalesce(new.phone,''))
  )
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  if lower(coalesce(new.email,'')) = 'ha1900612@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ============ products / banners ============
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  name_ar text not null default '',
  category text not null default 'digital_cards',
  price_iqd numeric not null default 0,
  description text not null default '',
  icon text not null default '',
  image_url text not null default '',
  available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "products public read" on public.products for select to anon, authenticated using (true);
create policy "products admin write" on public.products for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  subtitle text not null default '',
  image_url text not null default '',
  cta_text text not null default '',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.banners to anon;
grant select, insert, update, delete on public.banners to authenticated;
grant all on public.banners to service_role;
alter table public.banners enable row level security;
create policy "banners public read" on public.banners for select to anon, authenticated using (true);
create policy "banners admin write" on public.banners for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ============ announcements ============
create table public.announcements (
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
create policy "announcements admin write" on public.announcements for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ============ orders ============
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null default '',
  category text not null default 'digital_cards',
  kind text not null default 'service',
  target_link text not null default '',
  quantity int not null default 1,
  unit_price_iqd numeric not null default 0,
  price_iqd numeric not null default 0,
  buyer_name text not null default '',
  buyer_phone text not null default '',
  buyer_email text not null default '',
  payment_method text not null default 'wallet',
  code text not null default '',
  status text not null default 'pending',
  admin_note text not null default '',
  credentials text not null default '',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "orders own read" on public.orders for select to authenticated using (user_id = auth.uid());
create policy "orders admin read" on public.orders for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "orders own insert" on public.orders for insert to authenticated with check (user_id = auth.uid());
create policy "orders admin update" on public.orders for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ============ deposits ============
create table public.deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null default '',
  user_email text not null default '',
  user_phone text not null default '',
  gateway text not null default 'super_qi',
  gateway_label text not null default '',
  amount_iqd numeric not null default 0,
  receipt_url text not null default '',
  sender_note text not null default '',
  status text not null default 'pending',
  admin_note text not null default '',
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert on public.deposits to authenticated;
grant update on public.deposits to authenticated;
grant all on public.deposits to service_role;
alter table public.deposits enable row level security;
create policy "deposits own read" on public.deposits for select to authenticated using (user_id = auth.uid());
create policy "deposits admin read" on public.deposits for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "deposits own insert" on public.deposits for insert to authenticated with check (user_id = auth.uid());
create policy "deposits admin update" on public.deposits for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ============ wallet history ============
create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_iqd numeric not null,
  balance_after numeric not null default 0,
  reason text not null default '',
  created_at timestamptz not null default now()
);
grant select on public.wallet_transactions to authenticated;
grant all on public.wallet_transactions to service_role;
alter table public.wallet_transactions enable row level security;
create policy "wallet own read" on public.wallet_transactions for select to authenticated using (user_id = auth.uid());
create policy "wallet admin read" on public.wallet_transactions for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- ============ support ============
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null default '',
  message text not null default '',
  image_url text not null default '',
  user_name text not null default '',
  user_email text not null default '',
  user_phone text not null default '',
  user_avatar_url text not null default '',
  status text not null default 'open',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.support_tickets to authenticated;
grant all on public.support_tickets to service_role;
alter table public.support_tickets enable row level security;
create policy "tickets own read" on public.support_tickets for select to authenticated using (user_id = auth.uid());
create policy "tickets admin read" on public.support_tickets for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "tickets own insert" on public.support_tickets for insert to authenticated with check (user_id = auth.uid());
create policy "tickets own update" on public.support_tickets for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "tickets admin update" on public.support_tickets for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.ticket_replies (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null default '',
  image_url text not null default '',
  is_admin_reply boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert on public.ticket_replies to authenticated;
grant all on public.ticket_replies to service_role;
alter table public.ticket_replies enable row level security;
create policy "replies own read" on public.ticket_replies for select to authenticated
  using (exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid()));
create policy "replies admin read" on public.ticket_replies for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "replies insert" on public.ticket_replies for insert to authenticated
  with check (user_id = auth.uid() and (
    public.has_role(auth.uid(),'admin')
    or exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid())
  ));

-- ============ notifications ============
create table public.notifications (
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

-- ============ vouchers ============
create table public.vouchers (
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

-- ============ marketplace accounts ============
create table public.market_accounts (
  id uuid primary key default gen_random_uuid(),
  platform text not null default '',
  title text not null default '',
  description text not null default '',
  followers int not null default 0,
  price_iqd numeric not null default 0,
  image_url text not null default '',
  credentials text not null default '',
  sold boolean not null default false,
  sold_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.market_accounts to authenticated;
grant all on public.market_accounts to service_role;
alter table public.market_accounts enable row level security;
-- public listing view hides credentials via a dedicated view below
create policy "market admin all" on public.market_accounts for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "market buyer read" on public.market_accounts for select to authenticated using (sold_to = auth.uid());

create view public.market_accounts_public
with (security_invoker = off) as
  select id, platform, title, description, followers, price_iqd, image_url, sold, created_at
  from public.market_accounts;
grant select on public.market_accounts_public to anon, authenticated;

-- ============ push devices ============
create table public.push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, player_id)
);
grant select, insert, delete on public.push_devices to authenticated;
grant all on public.push_devices to service_role;
alter table public.push_devices enable row level security;
create policy "push own all" on public.push_devices for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "push admin read" on public.push_devices for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- ============ rate limiting ============
create table public.action_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);
create index action_logs_lookup on public.action_logs (user_id, action, created_at desc);
grant select, insert on public.action_logs to authenticated;
grant all on public.action_logs to service_role;
alter table public.action_logs enable row level security;
create policy "logs own" on public.action_logs for select to authenticated using (user_id = auth.uid());
create policy "logs own insert" on public.action_logs for insert to authenticated with check (user_id = auth.uid());

create or replace function public.check_rate_limit(_action text, _max int, _window_seconds int)
returns boolean language plpgsql security definer set search_path = public as $$
declare cnt int;
begin
  if auth.uid() is null then return false; end if;
  select count(*) into cnt from public.action_logs
   where user_id = auth.uid() and action = _action
     and created_at > now() - make_interval(secs => _window_seconds);
  if cnt >= _max then return false; end if;
  insert into public.action_logs (user_id, action) values (auth.uid(), _action);
  return true;
end $$;

-- ============ money functions ============
create or replace function public.credit_wallet(_user_id uuid, _amount numeric, _reason text)
returns numeric language plpgsql security definer set search_path = public as $$
declare next_balance numeric;
begin
  update public.profiles
     set wallet_balance_iqd = greatest(0, wallet_balance_iqd + _amount)
   where id = _user_id
  returning wallet_balance_iqd into next_balance;
  if next_balance is null then raise exception 'profile_not_found'; end if;
  insert into public.wallet_transactions (user_id, amount_iqd, balance_after, reason)
  values (_user_id, _amount, next_balance, coalesce(_reason,''));
  return next_balance;
end $$;

create or replace function public.review_deposit(_deposit_id uuid, _approve boolean, _note text default '')
returns numeric language plpgsql security definer set search_path = public as $$
declare d public.deposits; new_balance numeric;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'forbidden'; end if;
  select * into d from public.deposits where id = _deposit_id for update;
  if d.id is null then raise exception 'deposit_not_found'; end if;
  if d.status <> 'pending' then raise exception 'already_reviewed'; end if;
  update public.deposits
     set status = case when _approve then 'approved' else 'rejected' end,
         admin_note = coalesce(_note,''), reviewed_at = now()
   where id = _deposit_id;
  if _approve then
    new_balance := public.credit_wallet(d.user_id, d.amount_iqd, 'إيداع معتمد');
  else
    select wallet_balance_iqd into new_balance from public.profiles where id = d.user_id;
  end if;
  insert into public.notifications (user_id, audience, title, message, kind)
  values (d.user_id, 'user',
    case when _approve then 'تم قبول الإيداع' else 'تم رفض الإيداع' end,
    case when _approve then 'تمت إضافة ' || d.amount_iqd || ' د.ع إلى محفظتك' else coalesce(nullif(_note,''),'تم رفض طلب الإيداع') end,
    case when _approve then 'success' else 'error' end);
  return new_balance;
end $$;

create or replace function public.redeem_voucher(_code text)
returns numeric language plpgsql security definer set search_path = public as $$
declare v public.vouchers; new_balance numeric;
begin
  if auth.uid() is null then raise exception 'unauthorized'; end if;
  if not public.check_rate_limit('redeem_voucher', 5, 300) then raise exception 'rate_limited'; end if;
  select * into v from public.vouchers where upper(code) = upper(trim(_code)) for update;
  if v.id is null then raise exception 'invalid_code'; end if;
  if not v.active or v.used_by is not null then raise exception 'code_used'; end if;
  update public.vouchers set used_by = auth.uid(), used_at = now(), active = false where id = v.id;
  new_balance := public.credit_wallet(auth.uid(), v.amount_iqd, 'كود شحن');
  insert into public.notifications (user_id, audience, title, message, kind)
  values (auth.uid(), 'user', 'تم شحن الرصيد', 'تمت إضافة ' || v.amount_iqd || ' د.ع عبر كود الشحن', 'success');
  return new_balance;
end $$;

create or replace function public.purchase_with_wallet(
  _product_id uuid, _product_name text, _category text, _kind text,
  _target_link text, _quantity int, _unit_price numeric,
  _buyer_name text, _buyer_phone text, _buyer_email text,
  _market_account_id uuid default null
) returns public.orders language plpgsql security definer set search_path = public as $$
declare balance numeric; total numeric; qty int; unit numeric; new_order public.orders; acc public.market_accounts;
begin
  if auth.uid() is null then raise exception 'unauthorized'; end if;
  if not public.check_rate_limit('purchase', 8, 60) then raise exception 'rate_limited'; end if;
  qty := greatest(1, coalesce(_quantity,1));
  unit := greatest(0, coalesce(_unit_price,0));
  if _market_account_id is not null then
    select * into acc from public.market_accounts where id = _market_account_id for update;
    if acc.id is null then raise exception 'account_not_found'; end if;
    if acc.sold then raise exception 'account_sold'; end if;
    qty := 1; unit := acc.price_iqd;
  end if;
  total := unit * qty;
  select wallet_balance_iqd into balance from public.profiles where id = auth.uid() for update;
  if balance is null or balance < total then raise exception 'insufficient_funds'; end if;
  perform public.credit_wallet(auth.uid(), -total, 'شراء: ' || coalesce(_product_name,''));
  if _market_account_id is not null then
    update public.market_accounts set sold = true, sold_to = auth.uid() where id = _market_account_id;
  end if;
  insert into public.orders (user_id, product_id, product_name, category, kind, target_link,
    quantity, unit_price_iqd, price_iqd, buyer_name, buyer_phone, buyer_email, payment_method, status, credentials)
  values (auth.uid(), _product_id, coalesce(_product_name,''), coalesce(_category,'digital_cards'),
    coalesce(_kind,'service'), coalesce(_target_link,''), qty, unit, total,
    coalesce(_buyer_name,''), coalesce(_buyer_phone,''), coalesce(_buyer_email,''), 'wallet', 'pending',
    case when _market_account_id is not null then acc.credentials else '' end)
  returning * into new_order;
  insert into public.notifications (user_id, audience, title, message, kind)
  values (null, 'admin', 'طلب جديد', coalesce(_product_name,'') || ' بمبلغ ' || total || ' د.ع', 'info');
  return new_order;
end $$;

-- ============ seed ============
insert into public.announcements (message, active) values
  ('مرحباً بك في Ali Pro Media — شحن فوري وخدمات رقمية موثوقة على مدار الساعة', true);

insert into public.products (name, name_ar, category, price_iqd, description, icon, image_url, available, sort_order) values
  ('PUBG UC 60','شدات ببجي 60','digital_cards',1500,'شدات ببجي موبايل تُشحن فوراً','gamepad','',true,1),
  ('Google Play 10$','جوجل بلاي 10$','digital_cards',16000,'بطاقة جوجل بلاي رصيد 10 دولار','gift','',true,2),
  ('iTunes 10$','آيتونز 10$','digital_cards',16500,'بطاقة آيتونز أمريكية','apple','',true,3),
  ('Instagram Followers','متابعين انستغرام','social_media',25,'متابعين حقيقيين — السعر لكل متابع','instagram','',true,4),
  ('TikTok Followers','متابعين تيك توك','social_media',20,'متابعين تيك توك — السعر لكل متابع','tiktok','',true,5),
  ('Instagram Likes','لايكات انستغرام','social_media',10,'لايكات سريعة — السعر لكل لايك','heart','',true,6);

insert into public.banners (title, subtitle, image_url, cta_text, active, sort_order) values
  ('شحن فوري وآمن','بطاقات رقمية وخدمات سوشيال ميديا بأفضل الأسعار','','تسوّق الآن',true,1),
  ('سوق الحسابات','حسابات موثوقة مع تسليم بيانات فوري بعد الدفع','','استعرض الحسابات',true,2);

insert into public.market_accounts (platform, title, description, followers, price_iqd, image_url, credentials) values
  ('instagram','حساب انستغرام 10 آلاف متابع','حساب نشط بمتابعين عرب حقيقيين، بدون تحذيرات',10000,150000,'','user: demo_ig / pass: demo-pass-1'),
  ('tiktok','حساب تيك توك 25 ألف متابع','حساب ترفيهي بتفاعل عالي وأرشيف فيديوهات',25000,225000,'','user: demo_tt / pass: demo-pass-2');