-- ============================================================================
-- Ali Pro Media — مزامنة قاعدة البيانات الحية مع كود التطبيق
-- Reconcile the live Supabase schema with the app code
-- ----------------------------------------------------------------------------
-- طريقة التشغيل (Run):
--   Supabase Dashboard → SQL Editor → New query → الصق هذا المحتوى كاملاً → Run
--   (يحتاج صلاحيات مالك المشروع / service_role؛ أي يشغَّل من اللوحة وليس من التطبيق)
--
-- الجدول في السحابة الحية (xalqbvxzpfrmcttxcife) يختلف عن ما يتوقعه كود التطبيق:
--   • public.products              مفقود           → المنتجات 404
--   • public.unban_appeals         مفقود (يوجد unban_requests)   → طلبات فك الحظر 404
--   • public.market_accounts       مفقود           → سوق الحسابات 404
--   • banners.active / sort_order / link_url / cta_text  غير موجودة (العمود الفعلي is_active)
--   • orders / support_tickets / wallet_transactions  تنقصها عدة أعمدة
--   • دوال: purchase_with_wallet / check_rate_limit / redeem_voucher / review_support_ticket
--     / admin_review_unban / is_master_admin / ensure_master_admin  مفقودة
--
-- هذا الملف آمن للتشغيل أكثر من مرة (create ... if not exists / add column if not exists)
-- ولا يحذف أي بيانات موجودة. بعد نجاحه أعد تحميل التطبيق وستختفي أخطاء 404/400.
-- ============================================================================

-- ============================================================================
-- 1) إنشاء الجداول المفقودة (Create missing tables)
-- ============================================================================

create table if not exists public.products (
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
  eta_minutes int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.market_accounts (
  id uuid primary key default gen_random_uuid(),
  platform text not null default '',
  title text not null default '',
  description text not null default '',
  followers int not null default 0,
  price_iqd numeric not null default 0,
  image_url text not null default '',
  sold boolean not null default false,
  sold_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.market_account_secrets (
  account_id uuid primary key references public.market_accounts(id) on delete cascade,
  credentials text not null default ''
);

create table if not exists public.push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id text not null,
  created_at timestamptz not null default now(),
  unique (player_id)
);
-- التطبيق يستخدم upsert بـ onConflict: "player_id" — يجب أن يطابقه قيد التفرّد
create unique index if not exists push_devices_player_key on public.push_devices (player_id);

create table if not exists public.action_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);
create index if not exists action_logs_lookup on public.action_logs (user_id, action, created_at desc);

create table if not exists public.unban_appeals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null default '',
  contact_phone text not null default '',
  attachment_url text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_note text not null default '',
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.password_reset_otps (
  email text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 2) إضافة الأعمدة الناقصة إلى الجداول الموجودة (idempotent)
-- ============================================================================

-- profiles
alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles add column if not exists is_restricted boolean not null default false;
alter table public.profiles add column if not exists is_banned boolean not null default false;
alter table public.profiles add column if not exists avatar_url text not null default '';
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- banners (العمود الفعلي الحالي هو is_active)
alter table public.banners add column if not exists active boolean not null default true;
alter table public.banners add column if not exists sort_order int not null default 0;
alter table public.banners add column if not exists link_url text not null default '';
alter table public.banners add column if not exists cta_text text not null default '';
alter table public.banners add column if not exists badge_text text not null default '';
alter table public.banners add column if not exists is_active boolean not null default true;
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'banners' and column_name = 'is_active'
  ) then
    update public.banners set active = coalesce(is_active, true) where active is null;
  end if;
end $$;

-- orders (أعمدة سير الطلب + سجل الشراء)
alter table public.orders add column if not exists product_id uuid references public.products(id) on delete set null;
alter table public.orders add column if not exists product_name text not null default '';
alter table public.orders add column if not exists category text not null default 'digital_cards';
alter table public.orders add column if not exists kind text not null default 'service';
alter table public.orders add column if not exists quantity int not null default 1;
alter table public.orders add column if not exists unit_price_iqd numeric not null default 0;
alter table public.orders add column if not exists price_iqd numeric not null default 0;
alter table public.orders add column if not exists buyer_name text not null default '';
alter table public.orders add column if not exists buyer_phone text not null default '';
alter table public.orders add column if not exists buyer_email text not null default '';
alter table public.orders add column if not exists payment_method text not null default 'wallet';
alter table public.orders add column if not exists code text not null default '';
alter table public.orders add column if not exists admin_note text not null default '';
alter table public.orders add column if not exists credentials text not null default '';
alter table public.orders add column if not exists estimated_minutes int not null default 0;
alter table public.orders add column if not exists started_at timestamptz;
alter table public.orders add column if not exists completed_at timestamptz;
alter table public.orders add column if not exists order_type text not null default 'service';
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'order_type'
  ) then
    -- العمود القديم order_type قد يكون NOT NULL بدون default → يفشل الطلب بـ:
    --   null value in column "order_type" of relation "orders" violates not-null constraint
    -- نمنحه default = 'service' حتى لا يفشل أي كاتب.
    execute $x$ alter table public.orders alter column order_type set default 'service' $x$;
  end if;
end $$;

alter table public.orders add column if not exists total_price numeric not null default 0;
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'total_price'
  ) then
    -- العمود القديم total_price قد يكون NOT NULL بدون default → يفشل الطلب بـ:
    --   null value in column "total_price" of relation "orders" violates not-null constraint
    -- نمنحه default = 0 حتى لا يفشل أي كاتب (وكتبه purchase_with_wallet صراحةً كذلك).
    execute $x$ alter table public.orders alter column total_price set default 0 $x$;
  end if;
end $$;

-- support_tickets (دورة pending → open → closed)
alter table public.support_tickets add column if not exists approved_at timestamptz;
alter table public.support_tickets add column if not exists closed_at timestamptz;
alter table public.support_tickets add column if not exists updated_at timestamptz not null default now();
alter table public.support_tickets add column if not exists admin_note text not null default '';
alter table public.support_tickets add column if not exists image_url text not null default '';
alter table public.support_tickets add column if not exists user_avatar_url text not null default '';

-- ticket_replies (أعمدة الردود التي يكتبها التطبيق)
alter table public.ticket_replies add column if not exists image_url text not null default '';
alter table public.ticket_replies add column if not exists is_admin_reply boolean not null default false;

-- deposit_requests (حقول الحجز والمراجعة)
alter table public.deposit_requests add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.deposit_requests add column if not exists user_email text not null default '';
alter table public.deposit_requests add column if not exists user_phone text not null default '';
alter table public.deposit_requests add column if not exists gateway_label text not null default '';
alter table public.deposit_requests add column if not exists receipt_url text not null default '';
alter table public.deposit_requests add column if not exists admin_note text not null default '';
alter table public.deposit_requests add column if not exists notes text;
alter table public.deposit_requests add column if not exists reviewed_at timestamptz;
alter table public.deposit_requests add column if not exists updated_at timestamptz not null default now();

-- wallet_transactions (العمود الفعلي الحالي amount بدل amount_iqd)
alter table public.wallet_transactions add column if not exists amount_iqd numeric not null default 0;
alter table public.wallet_transactions add column if not exists balance_after numeric not null default 0;
alter table public.wallet_transactions add column if not exists reason text not null default '';
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'wallet_transactions' and column_name = 'amount'
  ) then
    -- العمود القديم amount قد يكون NOT NULL بدون default، بينما كود التطبيق يكتب amount_iqd.
    -- لذا يفشل شراء الرصيد/الطلب بـ:
    --   null value in column "amount" of relation "wallet_transactions" violates not-null constraint
    -- 1) نمنحه default = 0 حتى لا يفشل أي كاتب (يشمل أي trigger على public.orders).
    execute 'alter table public.wallet_transactions alter column amount set default 0';
    -- 2) نزامن القيم القديمة ثم نُبقي العمودين متزامنين عبر trigger (لكل الكتّاب).
    update public.wallet_transactions set amount_iqd = amount
     where amount_iqd = 0 and amount is not null and amount <> 0;
    execute '
      create or replace function public.sync_wallet_amount()
      returns trigger language plpgsql set search_path = public as $body$
      begin
        if coalesce(new.amount, 0) = 0 and coalesce(new.amount_iqd, 0) <> 0 then
          new.amount := new.amount_iqd;
        end if;
        if coalesce(new.amount_iqd, 0) = 0 and coalesce(new.amount, 0) <> 0 then
          new.amount_iqd := new.amount;
        end if;
        return new;
      end $body$';
    execute 'drop trigger if exists wallet_amount_sync on public.wallet_transactions';
    execute 'create trigger wallet_amount_sync before insert or update on public.wallet_transactions for each row execute function public.sync_wallet_amount()';
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'wallet_transactions' and column_name = 'transaction_type'
  ) then
    -- العمود القديم transaction_type قد يكون NOT NULL بدون default → يفشل شراء الرصيد/الطلب بـ:
    --   null value in column "transaction_type" of relation "wallet_transactions" violates not-null constraint
    -- نمنحه default = 'purchase' فيغطي كل الكتّاب (RPCs والـ triggers) دون الحاجة لتغيير استعلاماتهم.
    execute $x$ alter table public.wallet_transactions alter column transaction_type set default 'purchase' $x$;
  end if;
end $$;

-- vouchers
alter table public.vouchers add column if not exists used_by uuid references auth.users(id) on delete set null;
alter table public.vouchers add column if not exists used_at timestamptz;

-- card_categories (العمود الفعلي الحالي name بدل name_ar)
alter table public.card_categories add column if not exists name_ar text not null default '';
alter table public.card_categories add column if not exists sort_order int not null default 0;
alter table public.card_categories add column if not exists is_active boolean not null default true;
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'card_categories' and column_name = 'name'
  ) then
    update public.card_categories set name_ar = name where name_ar = '' and name is not null and name <> '';
  end if;
end $$;

-- electronic_cards
alter table public.electronic_cards add column if not exists name_ar text not null default '';
alter table public.electronic_cards add column if not exists description text;
alter table public.electronic_cards add column if not exists is_active boolean not null default true;
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'electronic_cards' and column_name = 'name'
  ) then
    update public.electronic_cards set name_ar = name where name_ar = '' and name is not null and name <> '';
  end if;
end $$;

-- ============================================================================
-- 3) الدوال المفقودة / المعاد بناؤها (functions the app calls)
-- ============================================================================

-- has_role موجود في السحابة ويعمل — لا نغيّره.

-- is_staff: يعيد بناءً على user_roles + profiles.role + البريد الرئيسي
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
      select 1 from public.profiles
      where id = _uid and role::text in ('admin', 'super_admin')
    )
    or exists (
      select 1 from auth.users u
      where u.id = _uid and lower(u.email) = 'ha1900612@gmail.com'
    );
$$;
revoke all on function public.is_staff(uuid) from public, anon;
grant execute on function public.is_staff(uuid) to authenticated;

-- is_master_admin
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

-- ensure_master_admin (يضمن admin + super_admin لصاحب البريد الرئيسي)
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
    insert into public.user_roles (user_id, role) values (uid, 'admin') on conflict do nothing;
    begin
      insert into public.user_roles (user_id, role) values (uid, 'super_admin') on conflict do nothing;
    exception when others then
      null; -- إن كان عمود الدور enum دون super_admin لا نفشل العملية
    end;
  end if;
end;
$$;
revoke all on function public.ensure_master_admin() from public, anon;
grant execute on function public.ensure_master_admin() to authenticated;

-- trigger helpers
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create or replace function public.guard_wallet_balance()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- يمنع تعديل الرصيد مباشرة من العميل غير الإداري.
  -- الدوال الآمنة (credit_wallet / purchase_with_wallet ...) تعمل بصلاحية
  -- صاحب الدالة current_user ≠ authenticated، فتمرّ بلا عودة؛ أما التحديثات
  -- القادمة من العميل (PostgREST: authenticated/anon) فتخضع للشرط أدناه.
  if new.wallet_balance_iqd is distinct from old.wallet_balance_iqd
     and current_user in ('authenticated', 'anon')
     and not public.has_role(auth.uid(),'admin')
     and auth.uid() is not null then
    new.wallet_balance_iqd := old.wallet_balance_iqd;
  end if;
  return new;
end $$;

-- إنشاء ملف التعريف تلقائياً عند التسجيل + دور المالك الرئيسي
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
    begin
      insert into public.user_roles (user_id, role) values (new.id, 'super_admin') on conflict do nothing;
    exception when others then
      null; -- إن كان عمود الدور enum دون super_admin لا يُعطَّل التسجيل
    end;
  end if;
  return new;
end $$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- rate limiting
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
revoke all on function public.check_rate_limit(text, int, int) from public, anon;
grant execute on function public.check_rate_limit(text, int, int) to authenticated;

-- credit_wallet (يحدّث الرصيد + يسجل الحركة)
create or replace function public.credit_wallet(_user_id uuid, _amount numeric, _reason text)
returns numeric language plpgsql security definer set search_path = public as $$
declare next_balance numeric;
begin
  update public.profiles
     set wallet_balance_iqd = greatest(0, wallet_balance_iqd + _amount)
   where id = _user_id
  returning wallet_balance_iqd into next_balance;
  if next_balance is null then raise exception 'profile_not_found'; end if;
  insert into public.wallet_transactions (user_id, amount, amount_iqd, balance_after, reason)
  values (_user_id, _amount, _amount, next_balance, coalesce(_reason,''));
  return next_balance;
end $$;
revoke all on function public.credit_wallet(uuid, numeric, text) from public, anon;

-- redeem_voucher
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
revoke all on function public.redeem_voucher(text) from public, anon;
grant execute on function public.redeem_voucher(text) to authenticated;

-- purchase_with_wallet (نسخة market_account_secrets — بيانات الحساب خارج الجدول العام)
create or replace function public.purchase_with_wallet(
  _product_id uuid, _product_name text, _category text, _kind text,
  _target_link text, _quantity int, _unit_price numeric,
  _buyer_name text, _buyer_phone text, _buyer_email text,
  _market_account_id uuid default null
) returns public.orders language plpgsql security definer set search_path = public as $$
declare balance numeric; total numeric; qty int; unit numeric; new_order public.orders; acc public.market_accounts; secret text := ''; otype text := 'service';
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
    select credentials into secret from public.market_account_secrets where account_id = _market_account_id;
  end if;
  total := unit * qty;
  select wallet_balance_iqd into balance from public.profiles where id = auth.uid() for update;
  if balance is null or balance < total then raise exception 'insufficient_funds'; end if;
  perform public.credit_wallet(auth.uid(), -total, 'شراء: ' || coalesce(_product_name,''));
  if _market_account_id is not null then
    update public.market_accounts set sold = true, sold_to = auth.uid() where id = _market_account_id;
  end if;
  otype := case when coalesce(_category,'digital_cards') = 'digital_cards' then 'card' else 'service' end;
  insert into public.orders (user_id, product_id, product_name, category, kind, target_link,
    quantity, unit_price_iqd, price_iqd, total_price, buyer_name, buyer_phone, buyer_email, payment_method, status, credentials, order_type)
  values (auth.uid(), _product_id, coalesce(_product_name,''), coalesce(_category,'digital_cards'),
    coalesce(_kind,'service'), coalesce(_target_link,''), qty, unit, total, total,
    coalesce(_buyer_name,''), coalesce(_buyer_phone,''), coalesce(_buyer_email,''), 'wallet', 'pending',
    coalesce(secret,''), otype)
  returning * into new_order;
  insert into public.notifications (user_id, audience, title, message, kind)
  values (null, 'admin', 'طلب جديد', coalesce(_product_name,'') || ' بمبلغ ' || total || ' د.ع', 'info');
  return new_order;
end $$;
revoke all on function public.purchase_with_wallet(uuid, text, text, text, text, int, numeric, text, text, text, uuid) from public, anon;
grant execute on function public.purchase_with_wallet(uuid, text, text, text, text, int, numeric, text, text, text, uuid) to authenticated;

-- admin_adjust_wallet (نسخة قياسية واحدة — إصلاح خطأ PostgREST PGRST203)
-- المشكلة: قد توجد أكثر من دالة بنفس اسم الوسائط وترتيب أنواع مختلف، مثل
--   public.admin_adjust_wallet(numeric, text, uuid)
--   public.admin_adjust_wallet(uuid, numeric, text)
-- فيحتار PostgREST بينها ويفشل بالرسالة:
--   "Could not choose the best candidate function between public.admin_adjust_wallet(...)"
-- الحل: حذف كل النسخ الموجودة بالاسم أولاً، ثم إنشاء نسخة واحدة فقط.
drop function if exists public.admin_adjust_wallet(numeric, text, uuid);
drop function if exists public.admin_adjust_wallet(uuid, numeric, text);
do $$
declare fn record;
begin
  for fn in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'admin_adjust_wallet'
  loop
    execute 'drop function if exists ' || fn.signature::text;
  end loop;
end $$;

-- النسخة القياسية: تُرجع الرصيد الجديد (عقد التطبيق) وتحمي العملية بسوبر أدمن.
create or replace function public.admin_adjust_wallet(_user_id uuid, _amount numeric, _reason text default 'تعديل إداري')
returns numeric language plpgsql security definer set search_path = public as $$
declare new_balance numeric;
begin
  -- مالك الموقع أو من يملك دور super_admin فقط (مقارنة نصية لتجنّب مشاكل enum)
  if not public.is_master_admin()
     and not exists (
       select 1 from public.user_roles
       where user_id = auth.uid() and role::text = 'super_admin'
     ) then
    raise exception 'forbidden';
  end if;
  new_balance := public.credit_wallet(_user_id, _amount, coalesce(_reason,'تعديل إداري'));
  insert into public.notifications (user_id, audience, title, message, kind)
  values (_user_id, 'user', 'تحديث الرصيد',
    case when _amount >= 0 then 'تمت إضافة ' || _amount || ' د.ع إلى محفظتك'
         else 'تم خصم ' || abs(_amount) || ' د.ع من محفظتك' end,
    'info');
  return new_balance;
end $$;
revoke all on function public.admin_adjust_wallet(uuid, numeric, text) from public, anon;
grant execute on function public.admin_adjust_wallet(uuid, numeric, text) to authenticated;

-- admin_review_unban (اعتماد / رفض طلبات فك الحظر)
create or replace function public.admin_review_unban(_appeal_id uuid, _approve boolean, _note text default '')
returns void language plpgsql security definer set search_path = public as $$
declare target uuid;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'forbidden'; end if;
  select user_id into target from public.unban_appeals where id = _appeal_id for update;
  if target is null then raise exception 'appeal_not_found'; end if;
  update public.unban_appeals
     set status = case when _approve then 'approved' else 'rejected' end,
         admin_note = coalesce(_note,''), reviewed_by = auth.uid(), reviewed_at = now()
   where id = _appeal_id;
  if _approve then
    update public.profiles set is_banned = false where id = target;
  end if;
  insert into public.notifications (user_id, audience, title, message, kind)
  values (target, 'user',
    case when _approve then 'تم فك الحظر' else 'تمت مراجعة طلب فك الحظر' end,
    case when _approve then 'تمت الموافقة على طلبك وإعادة تفعيل حسابك.' else coalesce(_note,'تم رفض طلب فك الحظر.') end,
    case when _approve then 'success' else 'error' end);
end $$;
revoke all on function public.admin_review_unban(uuid, boolean, text) from public, anon;
grant execute on function public.admin_review_unban(uuid, boolean, text) to authenticated;

-- review_support_ticket (فتح / إغلاق / حذف التذكرة ذرياً)
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

-- ============================================================================
-- 4) ربط الـ triggers (بلا تكرار)
-- ============================================================================
do $$
begin
  if not exists (
    select 1 from pg_trigger t join pg_proc p on p.oid = t.tgfoid
    where t.tgrelid = 'public.profiles'::regclass and p.proname = 'set_updated_at'
  ) then
    create trigger profiles_updated before update on public.profiles
      for each row execute function public.set_updated_at();
  end if;
  if not exists (
    select 1 from pg_trigger t join pg_proc p on p.oid = t.tgfoid
    where t.tgrelid = 'public.profiles'::regclass and p.proname = 'guard_wallet_balance'
  ) then
    create trigger profiles_wallet_guard before update on public.profiles
      for each row execute function public.guard_wallet_balance();
  end if;
  if not exists (
    select 1 from pg_trigger t join pg_proc p on p.oid = t.tgfoid
    where t.tgrelid = 'auth.users'::regclass and p.proname = 'handle_new_user'
  ) then
    create trigger on_auth_user_created after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end $$;

-- ============================================================================
-- 5) RLS + Policies للجداول الجديدة / المتغيّرة
-- ============================================================================

-- products
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products for select to anon, authenticated using (true);
drop policy if exists "products admin write" on public.products;
create policy "products admin write" on public.products for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- market_accounts (قائمة عامة للقراءة؛ الإدارة تضيف/ تعدّل / تحذف مباشرة، والشراء عبر دالة أمنية)
grant select on public.market_accounts to anon;
grant select, insert, update, delete on public.market_accounts to authenticated;
grant all on public.market_accounts to service_role;
alter table public.market_accounts enable row level security;
drop policy if exists "market public read" on public.market_accounts;
create policy "market public read" on public.market_accounts for select to anon, authenticated using (true);
drop policy if exists "market admin all" on public.market_accounts;
create policy "market admin all" on public.market_accounts for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
drop policy if exists "market buyer read" on public.market_accounts;
create policy "market buyer read" on public.market_accounts for select to authenticated using (sold_to = auth.uid());

-- market_account_secrets (بيانات الدخول — للمشتري والإدارة فقط)
grant select, insert, update, delete on public.market_account_secrets to authenticated;
grant all on public.market_account_secrets to service_role;
alter table public.market_account_secrets enable row level security;
drop policy if exists "secrets admin all" on public.market_account_secrets;
create policy "secrets admin all" on public.market_account_secrets for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
drop policy if exists "secrets buyer read" on public.market_account_secrets;
create policy "secrets buyer read" on public.market_account_secrets for select to authenticated
  using (exists (select 1 from public.market_accounts a where a.id = account_id and a.sold_to = auth.uid()));

-- push_devices (تحتاج UPDATE لعملية upsert عند تعارض player_id)
grant select, insert, update, delete on public.push_devices to authenticated;
grant all on public.push_devices to service_role;
alter table public.push_devices enable row level security;
drop policy if exists "push own all" on public.push_devices;
create policy "push own all" on public.push_devices for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "push admin read" on public.push_devices;
create policy "push admin read" on public.push_devices for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- action_logs
grant select, insert on public.action_logs to authenticated;
grant all on public.action_logs to service_role;
alter table public.action_logs enable row level security;
drop policy if exists "logs own" on public.action_logs;
create policy "logs own" on public.action_logs for select to authenticated using (user_id = auth.uid());
drop policy if exists "logs own insert" on public.action_logs;
create policy "logs own insert" on public.action_logs for insert to authenticated with check (user_id = auth.uid());

-- unban_appeals
grant select, insert, update on public.unban_appeals to authenticated;
grant all on public.unban_appeals to service_role;
alter table public.unban_appeals enable row level security;
drop policy if exists "appeals own read" on public.unban_appeals;
create policy "appeals own read" on public.unban_appeals for select to authenticated using (user_id = auth.uid());
drop policy if exists "appeals own insert" on public.unban_appeals;
create policy "appeals own insert" on public.unban_appeals for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "appeals admin read" on public.unban_appeals;
create policy "appeals admin read" on public.unban_appeals for select to authenticated using (public.has_role(auth.uid(),'admin'));
drop policy if exists "appeals admin update" on public.unban_appeals;
create policy "appeals admin update" on public.unban_appeals for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- password_reset_otps (خدمة فقط — بلا سياسات عامة)
alter table public.password_reset_otps enable row level security;
revoke all on table public.password_reset_otps from public, anon, authenticated;

-- support_tickets: سياسات العملاء والموظفين (احتياطية حتى لو فشلت إحداها سابقاً)
grant select, insert, update, delete on public.support_tickets to authenticated;
grant all on public.support_tickets to service_role;
alter table public.support_tickets enable row level security;
drop policy if exists "tickets own insert" on public.support_tickets;
create policy "tickets own insert" on public.support_tickets for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');
drop policy if exists "tickets own or staff read" on public.support_tickets;
create policy "tickets own or staff read" on public.support_tickets for select to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()));
drop policy if exists "tickets own close" on public.support_tickets;
create policy "tickets own close" on public.support_tickets for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and status = 'closed');
drop policy if exists "tickets staff update" on public.support_tickets;
create policy "tickets staff update" on public.support_tickets for update to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
drop policy if exists "tickets staff delete" on public.support_tickets;
create policy "tickets staff delete" on public.support_tickets for delete to authenticated
  using (public.is_staff(auth.uid()));

-- deposit_requests (سياسات الإدراج/القراءة/التحديث)
grant select, insert, update on public.deposit_requests to authenticated;
grant all on public.deposit_requests to service_role;
alter table public.deposit_requests enable row level security;
drop policy if exists "dr own insert" on public.deposit_requests;
create policy "dr own insert" on public.deposit_requests for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');
drop policy if exists "dr own or staff read" on public.deposit_requests;
create policy "dr own or staff read" on public.deposit_requests for select to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()));
drop policy if exists "dr staff update" on public.deposit_requests;
create policy "dr staff update" on public.deposit_requests for update to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
drop policy if exists "dr staff insert" on public.deposit_requests;
create policy "dr staff insert" on public.deposit_requests for insert to authenticated
  with check (public.is_staff(auth.uid()));

-- orders (قراءة العميل لطلباته، وإدارة الإدارة)
grant select, insert, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
drop policy if exists "orders own read" on public.orders;
create policy "orders own read" on public.orders for select to authenticated using (user_id = auth.uid());
drop policy if exists "orders admin read" on public.orders;
create policy "orders admin read" on public.orders for select to authenticated using (public.has_role(auth.uid(),'admin'));
drop policy if exists "orders own insert" on public.orders;
create policy "orders own insert" on public.orders for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "orders admin update" on public.orders;
create policy "orders admin update" on public.orders for update to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- wallet_transactions (قراءة العميل/الإدارة، وإدراج الموظفين فقط)
grant select, insert on public.wallet_transactions to authenticated;
grant all on public.wallet_transactions to service_role;
alter table public.wallet_transactions enable row level security;
drop policy if exists "wallet own read" on public.wallet_transactions;
create policy "wallet own read" on public.wallet_transactions for select to authenticated using (user_id = auth.uid());
drop policy if exists "wallet admin read" on public.wallet_transactions;
create policy "wallet admin read" on public.wallet_transactions for select to authenticated using (public.has_role(auth.uid(),'admin'));
drop policy if exists "wallet staff insert" on public.wallet_transactions;
create policy "wallet staff insert" on public.wallet_transactions for insert to authenticated
  with check (public.is_staff(auth.uid()));

-- ticket_replies (قراءة وإضافة الردود: صاحب التذكرة أو الموظفون)
grant select, insert on public.ticket_replies to authenticated;
grant all on public.ticket_replies to service_role;
alter table public.ticket_replies enable row level security;
drop policy if exists "replies read" on public.ticket_replies;
drop policy if exists "replies own read" on public.ticket_replies;
drop policy if exists "replies admin read" on public.ticket_replies;
create policy "replies read" on public.ticket_replies for select to authenticated
  using (public.is_staff(auth.uid()) or exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid()));
drop policy if exists "replies insert" on public.ticket_replies;
drop policy if exists "replies user insert" on public.ticket_replies;
drop policy if exists "replies staff insert" on public.ticket_replies;
create policy "replies insert" on public.ticket_replies for insert to authenticated
  with check (user_id = auth.uid() and (
    public.is_staff(auth.uid())
    or exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid() and t.status = 'open')
  ));

-- banners (قراءة عامة، وكتابة للإدارة)
grant select on public.banners to anon;
grant select, insert, update, delete on public.banners to authenticated;
grant all on public.banners to service_role;
alter table public.banners enable row level security;
drop policy if exists "banners public read" on public.banners;
create policy "banners public read" on public.banners for select to anon, authenticated using (true);
drop policy if exists "banners admin write" on public.banners;
create policy "banners admin write" on public.banners for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- announcements (قراءة عامة، وكتابة للإدارة)
grant select on public.announcements to anon;
grant select, insert, update, delete on public.announcements to authenticated;
grant all on public.announcements to service_role;
alter table public.announcements enable row level security;
drop policy if exists "announcements public read" on public.announcements;
create policy "announcements public read" on public.announcements for select to anon, authenticated using (true);
drop policy if exists "announcements admin write" on public.announcements;
create policy "announcements admin write" on public.announcements for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- vouchers (الإدارة فقط + قراءة المستخدم لقسائمه المستعملة)
grant select, insert, update, delete on public.vouchers to authenticated;
grant all on public.vouchers to service_role;
alter table public.vouchers enable row level security;
drop policy if exists "vouchers admin all" on public.vouchers;
create policy "vouchers admin all" on public.vouchers for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
drop policy if exists "vouchers own used read" on public.vouchers;
create policy "vouchers own used read" on public.vouchers for select to authenticated
  using (used_by = auth.uid());

-- user_roles: المالك الرئيسي يدير الأدوار (مع صلاحية الكتابة اللازمة لترقيته)
grant select, insert, update, delete on public.user_roles to authenticated;
alter table public.user_roles enable row level security;
drop policy if exists "read own roles" on public.user_roles;
create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());
drop policy if exists "admins read roles" on public.user_roles;
create policy "admins read roles" on public.user_roles for select to authenticated using (public.has_role(auth.uid(),'admin'));
drop policy if exists "master manage roles" on public.user_roles;
create policy "master manage roles" on public.user_roles
  for all to authenticated
  using (public.is_master_admin())
  with check (public.is_master_admin());

-- ============================================================================
-- 6) حاويات التخزين (storage buckets) + سياسات الرفع
-- ============================================================================
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('deposits', 'deposits', false),
  ('unban_requests', 'unban_requests', false),
  ('attachments', 'attachments', false)
on conflict (id) do nothing;

-- avatars (حاوية عامة: صورة الملف الشخصي)
drop policy if exists "public read avatars" on storage.objects;
create policy "public read avatars" on storage.objects for select to anon, authenticated
  using (bucket_id = 'avatars');
drop policy if exists "avatars own upload" on storage.objects;
create policy "avatars own upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars own update" on storage.objects;
create policy "avatars own update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- deposits (إيصالات الإيداع)
drop policy if exists "deposits own upload" on storage.objects;
create policy "deposits own upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'deposits' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "deposits own read" on storage.objects;
create policy "deposits own read" on storage.objects for select to authenticated
  using (bucket_id = 'deposits' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(),'admin')));

-- unban_requests (مرفقات طلب رفع الحظر)
drop policy if exists "unban own upload" on storage.objects;
create policy "unban own upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'unban_requests' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "unban own read" on storage.objects;
create policy "unban own read" on storage.objects for select to authenticated
  using (bucket_id = 'unban_requests' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(),'admin')));

-- attachments (مرفقات التذاكر)
drop policy if exists "own upload attachments" on storage.objects;
create policy "own upload attachments" on storage.objects for insert to authenticated
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "own read attachments" on storage.objects;
create policy "own read attachments" on storage.objects for select to authenticated
  using (bucket_id = 'attachments' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(),'admin')));

-- ============================================================================
-- 7) Realtime (نفس الاشتراكات التي يستخدمها التطبيق)
-- ============================================================================
do $$
begin
  begin alter publication supabase_realtime add table public.deposits; exception when others then null; end;
  begin alter publication supabase_realtime add table public.profiles; exception when others then null; end;
  begin alter publication supabase_realtime add table public.deposit_requests; exception when others then null; end;
  begin alter publication supabase_realtime add table public.support_tickets; exception when others then null; end;
  begin alter publication supabase_realtime add table public.ticket_replies; exception when others then null; end;
  begin alter publication supabase_realtime add table public.orders; exception when others then null; end;
  begin alter publication supabase_realtime add table public.unban_appeals; exception when others then null; end;
  begin alter publication supabase_realtime add table public.notifications; exception when others then null; end;
end $$;
alter table public.deposits replica identity full;
alter table public.profiles replica identity full;
alter table public.deposit_requests replica identity full;

-- ============================================================================
-- 8) بيانات أولية (تُزرع فقط إذا كانت الجداول فارغة)
-- ============================================================================
insert into public.announcements (message, active)
select 'مرحباً بك في Ali Pro Media — شحن فوري وخدمات رقمية موثوقة على مدار الساعة', true
where not exists (select 1 from public.announcements);

insert into public.products (name, name_ar, category, price_iqd, description, icon, image_url, available, sort_order)
select * from (values
  ('PUBG UC 60','شدات ببجي 60','digital_cards',1500,'شدات ببجي موبايل تُشحن فوراً','gamepad','',true,1),
  ('Google Play 10$','جوجل بلاي 10$','digital_cards',16000,'بطاقة جوجل بلاي رصيد 10 دولار','gift','',true,2),
  ('iTunes 10$','آيتونز 10$','digital_cards',16500,'بطاقة آيتونز أمريكية','apple','',true,3),
  ('Instagram Followers','متابعين انستغرام','social_media',25,'متابعين حقيقيين — السعر لكل متابع','instagram','',true,4),
  ('TikTok Followers','متابعين تيك توك','social_media',20,'متابعين تيك توك — السعر لكل متابع','tiktok','',true,5),
  ('Instagram Likes','لايكات انستغرام','social_media',10,'لايكات سريعة — السعر لكل لايك','heart','',true,6)
) as v(name, name_ar, category, price_iqd, description, icon, image_url, available, sort_order)
where not exists (select 1 from public.products);

insert into public.banners (title, subtitle, image_url, badge_text, cta_text, active, sort_order, link_url, is_active)
select 'شحن فوري وآمن','بطاقات رقمية وخدمات سوشيال ميديا بأفضل الأسعار','','الأكثر طلباً','تسوّق الآن',true,1,'',true
where not exists (select 1 from public.banners);

with s as (
  insert into public.market_accounts (platform, title, description, followers, price_iqd, image_url)
  select * from (values
    ('instagram','حساب انستغرام 10 آلاف متابع','حساب نشط بمتابعين عرب حقيقيين، بدون تحذيرات',10000,150000,''),
    ('tiktok','حساب تيك توك 25 ألف متابع','حساب ترفيهي بتفاعل عالي وأرشيف فيديوهات',25000,225000,'')
  ) as v(platform, title, description, followers, price_iqd, image_url)
  where not exists (select 1 from public.market_accounts)
  returning id, platform
)
insert into public.market_account_secrets (account_id, credentials)
select id, case when platform = 'instagram' then 'user: demo_ig / pass: demo-pass-1' else 'user: demo_tt / pass: demo-pass-2' end
from s;

-- ============================================================================
-- 9) إعادة تحميل schema cache في PostgREST (حتى لا تبقى أخطاء 404/400)
-- ============================================================================
notify pgrst, 'reload schema';