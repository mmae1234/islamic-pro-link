-- =====================================================================
-- Weekly "new members" email (edge function: member-digest)
--
--  * profiles.weekly_digest: member's on/off switch (default on)
--  * cron job 'member-digest-weekly': Mondays 16:30 UTC (8:30 AM PST /
--    9:30 AM PDT). The function only emails people in weeks when at least
--    one complete new professional profile was created.
--  * Auth: shared x-digest-secret read from Vault at run time (same secret
--    as signup-digest and notify-user; never stored in the job text).
--
-- Apply AFTER deploying the member-digest edge function.
-- =====================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weekly_digest boolean NOT NULL DEFAULT true;

GRANT UPDATE (weekly_digest) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.run_member_digest()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _secret text;
BEGIN
  SELECT decrypted_secret INTO _secret FROM vault.decrypted_secrets WHERE name = 'digest_secret';
  IF _secret IS NULL THEN
    RAISE WARNING 'member digest skipped: digest_secret missing from vault';
    RETURN;
  END IF;
  PERFORM net.http_post(
    url := 'https://zhtfygjxnyxqsmeoipst.supabase.co/functions/v1/member-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpodGZ5Z2p4bnl4cXNtZW9pcHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTc3OTgsImV4cCI6MjA2OTQzMzc5OH0.e6BfsKvqmRYiRLO4DLqvylmV7smrlmVKBmKjRq2i5zw',
      'x-digest-secret', _secret
    ),
    body := jsonb_build_object('triggered_at', now()),
    timeout_milliseconds := 60000
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.run_member_digest() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  job_id bigint;
BEGIN
  SELECT jobid INTO job_id FROM cron.job WHERE jobname = 'member-digest-weekly';
  IF job_id IS NOT NULL THEN
    PERFORM cron.unschedule(job_id);
  END IF;
END $$;

SELECT cron.schedule('member-digest-weekly', '30 16 * * 1', $$ SELECT public.run_member_digest(); $$);
