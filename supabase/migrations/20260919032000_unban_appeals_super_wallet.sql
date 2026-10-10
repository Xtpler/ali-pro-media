-- Unban appeals + explicit super_admin support. Kept as a project migration;
-- apply it to the Supabase project used by this build after schema alignment.
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.unban_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  attachment_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note text NOT NULL DEFAULT '',
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.unban_appeals TO authenticated;
GRANT UPDATE ON public.unban_appeals TO authenticated;
ALTER TABLE public.unban_appeals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appeals own read" ON public.unban_appeals FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "appeals own insert" ON public.unban_appeals FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "appeals admin read" ON public.unban_appeals FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "appeals admin update" ON public.unban_appeals FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.admin_review_unban(_appeal_id uuid, _approve boolean, _note text DEFAULT '')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target uuid;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT user_id INTO target FROM public.unban_appeals WHERE id = _appeal_id FOR UPDATE;
  IF target IS NULL THEN RAISE EXCEPTION 'appeal_not_found'; END IF;
  UPDATE public.unban_appeals SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END, admin_note = coalesce(_note,''), reviewed_by = auth.uid(), reviewed_at = now() WHERE id = _appeal_id;
  IF _approve THEN UPDATE public.profiles SET is_banned = false WHERE id = target; END IF;
  INSERT INTO public.notifications(user_id,audience,title,message,kind) VALUES(target,'user',CASE WHEN _approve THEN 'تم فك الحظر' ELSE 'تمت مراجعة طلب فك الحظر' END,CASE WHEN _approve THEN 'تمت الموافقة على طلبك وإعادة تفعيل حسابك.' ELSE coalesce(_note,'تم رفض طلب فك الحظر.') END,CASE WHEN _approve THEN 'success' ELSE 'error' END);
END $$;
REVOKE ALL ON FUNCTION public.admin_review_unban(uuid,boolean,text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_unban(uuid,boolean,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_adjust_wallet(_user_id uuid, _amount numeric, _reason text DEFAULT 'تعديل إداري')
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_balance numeric;
BEGIN
  IF NOT public.is_master_admin() AND NOT public.has_role(auth.uid(),'super_admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  new_balance := public.credit_wallet(_user_id, _amount, coalesce(_reason,'تعديل إداري'));
  INSERT INTO public.notifications (user_id,audience,title,message,kind) VALUES (_user_id,'user','تحديث الرصيد',CASE WHEN _amount >= 0 THEN 'تمت إضافة ' || _amount || ' د.ع إلى محفظتك' ELSE 'تم خصم ' || abs(_amount) || ' د.ع من محفظتك' END,'info');
  RETURN new_balance;
END $$;
REVOKE ALL ON FUNCTION public.admin_adjust_wallet(uuid,numeric,text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_wallet(uuid,numeric,text) TO authenticated;

-- Ensure the master account is explicitly marked super_admin as well.
CREATE OR REPLACE FUNCTION public.ensure_master_admin()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE lower(email) = 'ha1900612@gmail.com' LIMIT 1;
  IF uid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'super_admin') ON CONFLICT DO NOTHING;
  END IF;
END $$;
