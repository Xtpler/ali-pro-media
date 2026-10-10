-- شغّل هذا الملف مرة واحدة على قاعدة بياناتك بعد ربط الباك-إند.
-- يضيف: حقل صورة إثبات الباند + جدولي الكارتات الإلكترونية + حاويتي التخزين.

ALTER TABLE public.unban_appeals
  ADD COLUMN IF NOT EXISTS proof_image_url text NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS public.card_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.card_categories TO anon;
GRANT SELECT ON public.card_categories TO authenticated;
GRANT ALL ON public.card_categories TO service_role;
ALTER TABLE public.card_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "card categories public read" ON public.card_categories;
CREATE POLICY "card categories public read" ON public.card_categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "card categories admin write" ON public.card_categories;
CREATE POLICY "card categories admin write" ON public.card_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.electronic_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.card_categories(id) ON DELETE SET NULL,
  name_ar text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  image_url text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.electronic_cards TO anon;
GRANT SELECT ON public.electronic_cards TO authenticated;
GRANT ALL ON public.electronic_cards TO service_role;
ALTER TABLE public.electronic_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cards public read" ON public.electronic_cards;
CREATE POLICY "cards public read" ON public.electronic_cards FOR SELECT TO anon, authenticated USING (is_active);
DROP POLICY IF EXISTS "cards admin write" ON public.electronic_cards;
CREATE POLICY "cards admin write" ON public.electronic_cards FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS electronic_cards_category_idx ON public.electronic_cards(category_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('deposits', 'deposits', false), ('unban_requests', 'unban_requests', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "deposits own upload" ON storage.objects;
CREATE POLICY "deposits own upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'deposits' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "deposits own read" ON storage.objects;
CREATE POLICY "deposits own read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'deposits' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));

DROP POLICY IF EXISTS "unban own upload" ON storage.objects;
CREATE POLICY "unban own upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'unban_requests' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "unban own read" ON storage.objects;
CREATE POLICY "unban own read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'unban_requests' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
