-- move credentials out of the public listing table
create table public.market_account_secrets (
  account_id uuid primary key references public.market_accounts(id) on delete cascade,
  credentials text not null default ''
);
grant select, insert, update, delete on public.market_account_secrets to authenticated;
grant all on public.market_account_secrets to service_role;
alter table public.market_account_secrets enable row level security;
create policy "secrets admin all" on public.market_account_secrets for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "secrets buyer read" on public.market_account_secrets for select to authenticated
  using (exists (select 1 from public.market_accounts a where a.id = account_id and a.sold_to = auth.uid()));

insert into public.market_account_secrets (account_id, credentials)
  select id, credentials from public.market_accounts;

drop view public.market_accounts_public;
alter table public.market_accounts drop column credentials;

drop policy "market buyer read" on public.market_accounts;
create policy "market public read" on public.market_accounts for select to anon, authenticated using (true);
grant select on public.market_accounts to anon;

create or replace function public.purchase_with_wallet(
  _product_id uuid, _product_name text, _category text, _kind text,
  _target_link text, _quantity int, _unit_price numeric,
  _buyer_name text, _buyer_phone text, _buyer_email text,
  _market_account_id uuid default null
) returns public.orders language plpgsql security definer set search_path = public as $$
declare balance numeric; total numeric; qty int; unit numeric; new_order public.orders; acc public.market_accounts; secret text := '';
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
  insert into public.orders (user_id, product_id, product_name, category, kind, target_link,
    quantity, unit_price_iqd, price_iqd, buyer_name, buyer_phone, buyer_email, payment_method, status, credentials)
  values (auth.uid(), _product_id, coalesce(_product_name,''), coalesce(_category,'digital_cards'),
    coalesce(_kind,'service'), coalesce(_target_link,''), qty, unit, total,
    coalesce(_buyer_name,''), coalesce(_buyer_phone,''), coalesce(_buyer_email,''), 'wallet', 'pending',
    coalesce(secret,''))
  returning * into new_order;
  insert into public.notifications (user_id, audience, title, message, kind)
  values (null, 'admin', 'طلب جديد', coalesce(_product_name,'') || ' بمبلغ ' || total || ' د.ع', 'info');
  return new_order;
end $$;

-- lock down internal helpers
revoke all on function public.handle_new_user() from anon, authenticated;
revoke all on function public.set_updated_at() from anon, authenticated;
revoke all on function public.guard_wallet_balance() from anon, authenticated;
revoke all on function public.credit_wallet(uuid, numeric, text) from anon, authenticated;
revoke all on function public.has_role(uuid, public.app_role) from anon;
revoke all on function public.check_rate_limit(text, int, int) from anon;
revoke all on function public.review_deposit(uuid, boolean, text) from anon;
revoke all on function public.redeem_voucher(text) from anon;
revoke all on function public.purchase_with_wallet(uuid, text, text, text, text, int, numeric, text, text, text, uuid) from anon;

revoke all on function public.handle_new_user() from public;
revoke all on function public.set_updated_at() from public;
revoke all on function public.guard_wallet_balance() from public;
revoke all on function public.credit_wallet(uuid, numeric, text) from public;
revoke all on function public.has_role(uuid, public.app_role) from public;
revoke all on function public.check_rate_limit(text, int, int) from public;
revoke all on function public.review_deposit(uuid, boolean, text) from public;
revoke all on function public.redeem_voucher(text) from public;
revoke all on function public.purchase_with_wallet(uuid, text, text, text, text, int, numeric, text, text, text, uuid) from public;

grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.check_rate_limit(text, int, int) to authenticated;
grant execute on function public.review_deposit(uuid, boolean, text) to authenticated;
grant execute on function public.redeem_voucher(text) to authenticated;
grant execute on function public.purchase_with_wallet(uuid, text, text, text, text, int, numeric, text, text, text, uuid) to authenticated;

create or replace function public.admin_adjust_wallet(_user_id uuid, _amount numeric, _reason text default 'تعديل إداري')
returns numeric language plpgsql security definer set search_path = public as $$
declare new_balance numeric;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'forbidden'; end if;
  new_balance := public.credit_wallet(_user_id, _amount, coalesce(_reason,'تعديل إداري'));
  insert into public.notifications (user_id, audience, title, message, kind)
  values (_user_id, 'user', 'تحديث الرصيد',
    case when _amount >= 0 then 'تمت إضافة ' || _amount || ' د.ع إلى محفظتك' else 'تم خصم ' || abs(_amount) || ' د.ع من محفظتك' end,
    'info');
  return new_balance;
end $$;

revoke all on function public.admin_adjust_wallet(uuid, numeric, text) from public;
grant execute on function public.admin_adjust_wallet(uuid, numeric, text) to authenticated;