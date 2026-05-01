-- Enable extensions for scheduled HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any prior schedule with the same name (idempotent)
DO $$
DECLARE
  job_id bigint;
BEGIN
  SELECT jobid INTO job_id FROM cron.job WHERE jobname = 'signup-digest-weekly';
  IF job_id IS NOT NULL THEN
    PERFORM cron.unschedule(job_id);
  END IF;
END $$;

-- Schedule: every Friday at 00:00 UTC (= Friday 5 PM PDT / 4 PM PST).
-- The edge function always sends the weekly digest, and additionally sends
-- the monthly digest when today is the last Friday of the month (PT).
SELECT cron.schedule(
  'signup-digest-weekly',
  '0 0 * * 5',
  $$
  SELECT net.http_post(
    url := 'https://zhtfygjxnyxqsmeoipst.supabase.co/functions/v1/signup-digest',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpodGZ5Z2p4bnl4cXNtZW9pcHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTc3OTgsImV4cCI6MjA2OTQzMzc5OH0.e6BfsKvqmRYiRLO4DLqvylmV7smrlmVKBmKjRq2i5zw"}'::jsonb,
    body := jsonb_build_object('mode', 'auto', 'triggered_at', now())
  );
  $$
);