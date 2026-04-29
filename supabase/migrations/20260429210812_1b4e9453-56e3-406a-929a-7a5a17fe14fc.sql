
-- Drop overly permissive INSERT policy on categories
DROP POLICY IF EXISTS "Authenticated users can create categories" ON public.categories;

-- Lock down SECURITY DEFINER functions: only triggers (postgres role) should call them
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
