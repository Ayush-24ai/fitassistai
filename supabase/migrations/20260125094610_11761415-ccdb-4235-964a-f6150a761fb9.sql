-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule daily cleanup at 3:00 AM UTC
SELECT cron.schedule(
  'cleanup-old-analyses-daily',
  '0 3 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://sfnmrtoijabjbduvibcb.supabase.co/functions/v1/cleanup-old-analyses',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbm1ydG9pamFiamJkdXZpYmNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNzg5MTYsImV4cCI6MjA4NDc1NDkxNn0.tqPxAWse_Bctksydw98y4bRex_OKZKlLwsVK2vDNO0g"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);