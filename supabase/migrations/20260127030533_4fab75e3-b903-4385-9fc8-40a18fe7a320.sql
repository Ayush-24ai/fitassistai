-- Add auth_provider column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS auth_provider text DEFAULT 'email';

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.auth_provider IS 'Authentication provider used: email, google, etc.';