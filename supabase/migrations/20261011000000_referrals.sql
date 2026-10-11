-- ============================================================================
-- Referral Engine — Ali Pro Media
-- ----------------------------------------------------------------------------
-- • Each user gets a unique invite link: /ref/<user-id>
-- • Opening the link with a signed-in account registers a pending referral via
--   apply_referral(). A signed-out visitor defers the referral until login.
-- • On the referred friend's FIRST approved wallet top-up (deposit_requests →
--   status = 'approved'), the referrer automatically receives a configurable
--   % bonus of the deposit credited through credit_wallet().
--   The bonus percentage is the bonus_pct constant in maybe_reward_referral().
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','rewarded')),
  reward_amount_iqd numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referrer_id, referred_user_id)
);
CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON public.referrals (referrer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS referrals_referred_idx ON public.referrals (referred_user_id, created_at DESC);

GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "referrals own read" ON public.referrals;
CREATE POLICY "referrals own read" ON public.referrals FOR SELECT TO authenticated
  USING (referrer_id = auth.uid() OR referred_user_id = auth.uid());
DROP POLICY IF EXISTS "referrals admin read" ON public.referrals;
CREATE POLICY "referrals admin read" ON public.referrals FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.apply_referral(_referrer_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := auth.uid(); cnt int;
BEGIN
  IF me IS NULL THEN RETURN 'needs_auth'; END IF;
  IF _referrer_id IS NULL OR _referrer_id = me THEN RETURN 'self'; END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _referrer_id) THEN RETURN 'invalid'; END IF;
  SELECT count(*) INTO cnt FROM public.referrals WHERE referred_user_id = me;
  IF cnt > 0 THEN RETURN 'already'; END IF;
  INSERT INTO public.referrals (referrer_id, referred_user_id) VALUES (_referrer_id, me)
  ON CONFLICT (referrer_id, referred_user_id) DO NOTHING;
  RETURN 'ok';
END $$;
REVOKE ALL ON FUNCTION public.apply_referral(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.apply_referral(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.maybe_reward_referral()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ref_row public.referrals;
  bonus numeric;
  bonus_pct numeric := 10; -- configurable referral bonus percentage
BEGIN
  IF NEW.user_id IS NULL OR coalesce(NEW.amount_iqd, 0) <= 0 THEN RETURN NEW; END IF;
  SELECT * INTO ref_row FROM public.referrals
   WHERE referred_user_id = NEW.user_id AND status = 'pending'
   LIMIT 1;
  IF ref_row.id IS NULL OR ref_row.referrer_id = NEW.user_id THEN RETURN NEW; END IF;
  bonus := floor(NEW.amount_iqd * bonus_pct / 100);
  UPDATE public.referrals
     SET status = 'rewarded', reward_amount_iqd = bonus
   WHERE id = ref_row.id;
  IF bonus <= 0 THEN RETURN NEW; END IF;
  PERFORM public.credit_wallet(ref_row.referrer_id, bonus, 'مكافأة إحالة (٪' || bonus_pct || ')');
  INSERT INTO public.notifications (user_id, audience, title, message, kind)
  VALUES (ref_row.referrer_id, 'user', '🎉 مكافأة إحالة',
    'حصلت على مكافأة ' || bonus || ' د.ع إثر أول إيداع معتمد لصديقك المدعو', 'success');
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.maybe_reward_referral() FROM public, anon;

DROP TRIGGER IF EXISTS referral_reward ON public.deposit_requests;
CREATE TRIGGER referral_reward
  AFTER INSERT OR UPDATE OF status ON public.deposit_requests
  FOR EACH ROW WHEN (NEW.status = 'approved')
  EXECUTE FUNCTION public.maybe_reward_referral();

NOTIFY pgrst, 'reload schema';