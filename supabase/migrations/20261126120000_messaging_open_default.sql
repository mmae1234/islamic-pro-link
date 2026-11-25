-- =====================================================================
-- Messaging default: open (owner decision, Nov 25 2026).
-- Every member was "closed" (the old default) or "mentorship_only", so no
-- one could message a professional they found. "Open" still protects
-- members: a first message is a request they accept or decline, and the
-- sender can send at most 3 messages until it's accepted.
-- Members who chose "mentorship_only" keep their choice.
-- =====================================================================
ALTER TABLE public.profiles ALTER COLUMN messaging_privacy SET DEFAULT 'open';
UPDATE public.profiles SET messaging_privacy = 'open' WHERE messaging_privacy = 'closed';

-- "Mentorship only" now means what Settings says it means.
CREATE OR REPLACE FUNCTION public.can_send_message(sender_id_param uuid, recipient_id_param uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _privacy text;
  _conv record;
BEGIN
  IF sender_id_param IS NULL OR recipient_id_param IS NULL
     OR sender_id_param = recipient_id_param THEN
    RETURN 'closed';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.blocked_users
    WHERE (blocker_id = recipient_id_param AND blocked_id = sender_id_param)
       OR (blocker_id = sender_id_param   AND blocked_id = recipient_id_param)
  ) THEN
    RETURN 'blocked';
  END IF;

  SELECT id, status, requested_by INTO _conv
  FROM public.conversations
  WHERE user_a = LEAST(sender_id_param, recipient_id_param)
    AND user_b = GREATEST(sender_id_param, recipient_id_param);

  IF _conv.status = 'blocked' THEN
    RETURN 'blocked';
  END IF;

  IF _conv.status = 'active' THEN
    RETURN 'allowed';
  END IF;

  IF public.has_active_mentorship(sender_id_param, recipient_id_param) THEN
    RETURN 'allowed';
  END IF;

  -- Replying to a request the other person sent you
  IF _conv.id IS NOT NULL AND _conv.status = 'request'
     AND _conv.requested_by = recipient_id_param THEN
    RETURN 'allowed';
  END IF;

  SELECT messaging_privacy::text INTO _privacy
  FROM public.profiles
  WHERE user_id = recipient_id_param;

  -- 'mentorship_only' members are reachable only through an active
  -- mentorship (already allowed above); 'closed' only through an existing
  -- conversation. 'open' members accept message *requests*.
  IF _privacy IS NULL OR _privacy IN ('closed', 'mentorship_only') THEN
    RETURN 'closed';
  END IF;

  RETURN 'request';
END;
$$;
REVOKE EXECUTE ON FUNCTION public.can_send_message(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.can_send_message(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
