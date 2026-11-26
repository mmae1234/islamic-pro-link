-- First message in a message REQUEST gets its own email ("wants to connect",
-- links to Messages → Requests) instead of the generic "sent you a message"
-- that opened the Inbox, where requests don't appear.
-- Apply AFTER the notify-user function with the message_request kind is
-- deployed (Lovable Publish), or those emails are rejected.
CREATE OR REPLACE FUNCTION public.email_alert_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _status text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.conversation_id IS NOT DISTINCT FROM NEW.conversation_id
      AND m.recipient_id = NEW.recipient_id
      AND m.read_at IS NULL
      AND m.id <> NEW.id
  ) THEN
    SELECT c.status::text INTO _status FROM public.conversations c WHERE c.id = NEW.conversation_id;
    PERFORM public.queue_email_alert(
      CASE WHEN _status = 'request' THEN 'message_request' ELSE 'message' END,
      NEW.recipient_id,
      NEW.sender_id
    );
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.email_alert_on_message() FROM PUBLIC, anon, authenticated;
