
-- Fix 1: Harden handle_new_user() - empty search_path, input validation, auth_provider
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  safe_display_name text;
BEGIN
  safe_display_name := COALESCE(
    substring(NEW.raw_user_meta_data->>'display_name', 1, 100),
    substring(NEW.email, 1, position('@' IN NEW.email) - 1),
    'User'
  );

  INSERT INTO public.profiles (user_id, display_name, auth_provider)
  VALUES (
    NEW.id,
    safe_display_name,
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix 2: Restrict profile UPDATE to prevent Pro column manipulation
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  is_pro IS NOT DISTINCT FROM (SELECT p.is_pro FROM public.profiles p WHERE p.user_id = auth.uid()) AND
  pro_expires_at IS NOT DISTINCT FROM (SELECT p.pro_expires_at FROM public.profiles p WHERE p.user_id = auth.uid())
);

-- Fix 3: Replace HTTP-based cron with direct DB function for cleanup
CREATE OR REPLACE FUNCTION public.cleanup_old_analyses()
RETURNS void AS $$
BEGIN
  DELETE FROM public.analysis_history
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Update cron job to use direct function call instead of HTTP
SELECT cron.unschedule('cleanup-old-analyses-daily');

SELECT cron.schedule(
  'cleanup-old-analyses-daily',
  '0 3 * * *',
  'SELECT public.cleanup_old_analyses();'
);
