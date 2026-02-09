
-- Create rate limiting table
CREATE TABLE public.api_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  requested_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_api_rate_limits_lookup ON public.api_rate_limits (user_id, endpoint, requested_at DESC);

-- Enable RLS - block all direct client access
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct client access to rate limits"
ON public.api_rate_limits
FOR ALL
USING (false);

-- Auto-cleanup old rate limit entries (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.api_rate_limits
  WHERE requested_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Schedule cleanup every hour
SELECT cron.schedule(
  'cleanup-rate-limits-hourly',
  '0 * * * *',
  'SELECT public.cleanup_rate_limits();'
);
