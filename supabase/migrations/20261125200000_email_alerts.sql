-- =====================================================================
-- Email alerts for new messages and mentorship activity
--
--  * profiles.email_alerts: per-user on/off switch (default on)
--  * queue_email_alert(): posts a job to the notify-user edge function
--    via pg_net. The shared secret is read from Vault (same secret the
--    signup digest uses; the function checks it as DIGEST_SECRET).
--  * Triggers:
--      messages            AFTER INSERT -> 'message' (only the first unread
--                                           message per conversation, so a
--                                           burst of messages = one email)
--      mentorship_requests AFTER INSERT -> 'mentorship_request' (to mentor)
--      mentorship_requests AFTER UPDATE pending->accepted
--                                       -> 'mentorship_accepted' (to mentee)
--  * Failures never block the insert/update; they only log a warning.
--  * Email never contains message text, only who wrote and a link.
-- =====================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_alerts boolean NOT NULL DEFAULT true;

GRANT UPDATE (email_alerts) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.queue_email_alert(_kind text, _recipient uuid, _actor uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _secret text;
BEGIN
  IF _recipient IS NULL OR _recipient = _actor THEN
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _recipient AND email_alerts) THEN
    RETURN;
  END IF;

  SELECT decrypted_secret INTO _secret FROM vault.decrypted_secrets WHERE name = 'digest_secret';
  IF _secret IS NULL THEN
    RAISE WARNING 'email alert skipped: digest_secret missing from vault';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := 'https://zhtfygjxnyxqsmeoipst.supabase.co/functions/v1/notify-user',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpodGZ5Z2p4bnl4cXNtZW9pcHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTc3OTgsImV4cCI6MjA2OTQzMzc5OH0.e6BfsKvqmRYiRLO4DLqvylmV7smrlmVKBmKjRq2i5zw',
      'x-digest-secret', _secret
    ),
    body := jsonb_build_object('kind', _kind, 'recipient_id', _recipient, 'actor_id', _actor)
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'email alert not queued: %', SQLERRM;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.queue_email_alert(text, uuid, uuid) FROM PUBLIC, anon, authenticated;

-- New message: email only if this is the recipient's only unread message
-- in the conversation (they haven't been alerted since they last read it).
CREATE OR REPLACE FUNCTION public.email_alert_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.conversation_id IS NOT DISTINCT FROM NEW.conversation_id
      AND m.recipient_id = NEW.recipient_id
      AND m.read_at IS NULL
      AND m.id <> NEW.id
  ) THEN
    PERFORM public.queue_email_alert('message', NEW.recipient_id, NEW.sender_id);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.email_alert_on_message() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS email_alert_on_message_trigger ON public.messages;
CREATE TRIGGER email_alert_on_message_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.email_alert_on_message();

CREATE OR REPLACE FUNCTION public.email_alert_on_mentorship()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    PERFORM public.queue_email_alert('mentorship_request', NEW.mentor_id, NEW.mentee_id);
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    PERFORM public.queue_email_alert('mentorship_accepted', NEW.mentee_id, NEW.mentor_id);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.email_alert_on_mentorship() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS email_alert_on_mentorship_trigger ON public.mentorship_requests;
CREATE TRIGGER email_alert_on_mentorship_trigger
  AFTER INSERT OR UPDATE OF status ON public.mentorship_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.email_alert_on_mentorship();
