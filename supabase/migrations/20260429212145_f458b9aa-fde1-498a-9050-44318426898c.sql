
CREATE TABLE public.category_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  category TEXT NOT NULL,
  hits INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, keyword, category)
);

ALTER TABLE public.category_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own overrides" ON public.category_overrides
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own overrides" ON public.category_overrides
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own overrides" ON public.category_overrides
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_overrides_user_keyword ON public.category_overrides (user_id, keyword);

CREATE TRIGGER update_overrides_updated_at
  BEFORE UPDATE ON public.category_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
