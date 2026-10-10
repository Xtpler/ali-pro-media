-- ===== Deposits: standardize on deposit_requests =====
ALTER TABLE public.deposit_requests
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.deposit_requests ALTER COLUMN amount_iqd SET DEFAULT 0;

CREATE OR REPLACE FUNCTION public.is_staff(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role IN ('admin','super_admin'))
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = _uid AND role IN ('admin','super_admin'));
$$;

GRANT SELECT, INSERT, UPDATE ON public.deposit_requests TO authenticated;
GRANT ALL ON public.deposit_requests TO service_role;
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow inserts for everyone" ON public.deposit_requests;
CREATE POLICY "dr own insert" ON public.deposit_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "dr own or staff read" ON public.deposit_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "dr staff insert" ON public.deposit_requests FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "dr staff update" ON public.deposit_requests FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Legacy deposits table: stop open access
DROP POLICY IF EXISTS "Allow All Deposits Access" ON public.deposits;
CREATE POLICY "deposits own or staff read" ON public.deposits FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.review_deposit(_deposit_id uuid, _approve boolean, _note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'not allowed'; END IF;
  UPDATE public.deposit_requests
     SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
         admin_note = _note, reviewed_at = now(), updated_at = now()
   WHERE id = _deposit_id AND status = 'pending';
END; $$;

-- ===== Support tickets =====
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Access To Tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Allow All Tickets" ON public.support_tickets;
CREATE POLICY "tickets own insert" ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "tickets own or staff read" ON public.support_tickets FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "tickets own close" ON public.support_tickets FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND status = 'closed');
CREATE POLICY "tickets staff update" ON public.support_tickets FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "tickets staff delete" ON public.support_tickets FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.ticket_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  message text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  is_admin_reply boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ticket_replies_ticket_idx ON public.ticket_replies(ticket_id, created_at);
GRANT SELECT, INSERT ON public.ticket_replies TO authenticated;
GRANT ALL ON public.ticket_replies TO service_role;
ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "replies read" ON public.ticket_replies FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid()));
CREATE POLICY "replies user insert" ON public.ticket_replies FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_admin_reply = false
    AND EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid() AND t.status = 'open'));
CREATE POLICY "replies staff insert" ON public.ticket_replies FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_staff(auth.uid()));

-- Realtime
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_replies; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.deposit_requests; EXCEPTION WHEN others THEN NULL; END;
END $$;

NOTIFY pgrst, 'reload schema';