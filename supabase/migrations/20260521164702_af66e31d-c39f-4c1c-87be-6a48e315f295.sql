-- Drop old global categories (unused in app)
DROP TABLE IF EXISTS public.categories CASCADE;

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '220 15% 55%',
  icon text NOT NULL DEFAULT '✨',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);

CREATE INDEX idx_categories_user ON public.categories(user_id);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own categories" ON public.categories
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own categories" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own categories" ON public.categories
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default categories for a user (idempotent)
CREATE OR REPLACE FUNCTION public.seed_default_categories(_user_id uuid, _lang text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.categories (user_id, slug, name, color, icon, sort_order) VALUES
    (_user_id, 'food',      CASE WHEN _lang = 'en' THEN 'Food'      ELSE 'Comida'     END, '18 78% 62%',  '🍜', 1),
    (_user_id, 'transport', CASE WHEN _lang = 'en' THEN 'Transport' ELSE 'Transporte' END, '200 70% 55%', '🚇', 2),
    (_user_id, 'shopping',  CASE WHEN _lang = 'en' THEN 'Shopping'  ELSE 'Compras'    END, '340 70% 60%', '🛍️', 3),
    (_user_id, 'bills',     CASE WHEN _lang = 'en' THEN 'Bills'     ELSE 'Facturas'   END, '260 50% 60%', '🧾', 4),
    (_user_id, 'fun',       CASE WHEN _lang = 'en' THEN 'Fun'       ELSE 'Diversión'  END, '45 90% 55%',  '🎉', 5),
    (_user_id, 'health',    CASE WHEN _lang = 'en' THEN 'Health'    ELSE 'Salud'      END, '158 50% 45%', '🌿', 6),
    (_user_id, 'home',      CASE WHEN _lang = 'en' THEN 'Home'      ELSE 'Hogar'      END, '25 60% 50%',  '🏡', 7),
    (_user_id, 'other',     CASE WHEN _lang = 'en' THEN 'Other'     ELSE 'Otros'      END, '220 15% 55%', '✨', 8)
  ON CONFLICT (user_id, slug) DO NOTHING;
END;
$$;

-- Update handle_new_user to also seed default categories
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _lang text;
BEGIN
  _lang := COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'es');
  INSERT INTO public.profiles (id, email, preferred_language)
  VALUES (NEW.id, NEW.email, _lang);
  PERFORM public.seed_default_categories(NEW.id, _lang);
  RETURN NEW;
END;
$$;

-- Backfill existing users
DO $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN SELECT id, preferred_language FROM public.profiles LOOP
    PERFORM public.seed_default_categories(u.id, COALESCE(u.preferred_language, 'es'));
  END LOOP;
END $$;