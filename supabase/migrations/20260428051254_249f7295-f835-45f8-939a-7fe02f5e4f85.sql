
-- ============================================================
-- 1. Atomic SECURITY DEFINER send_message function
-- Enforces: auth, no self-message, blocking, privacy, rate limit
-- ============================================================
CREATE OR REPLACE FUNCTION public.send_message(
  _recipient_id uuid,
  _content text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sender_id uuid := auth.uid();
  _conv_id uuid;
  _gate text;
  _message_id uuid;
  _trimmed text;
BEGIN
  IF _sender_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _recipient_id IS NULL OR _sender_id = _recipient_id THEN
    RAISE EXCEPTION 'Invalid recipient';
  END IF;

  _trimmed := btrim(coalesce(_content, ''));
  IF length(_trimmed) = 0 THEN
    RAISE EXCEPTION 'Message cannot be empty';
  END IF;
  IF length(_trimmed) > 5000 THEN
    RAISE EXCEPTION 'Message too long (max 5000 characters)';
  END IF;

  -- Block check (either direction)
  IF EXISTS (
    SELECT 1 FROM public.blocked_users
    WHERE (blocker_id = _recipient_id AND blocked_id = _sender_id)
       OR (blocker_id = _sender_id   AND blocked_id = _recipient_id)
  ) THEN
    RAISE EXCEPTION 'Cannot message this user';
  END IF;

  -- Recipient must exist
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _recipient_id) THEN
    RAISE EXCEPTION 'Recipient not found';
  END IF;

  -- Rate limit
  IF NOT public.check_message_rate_limit(_sender_id) THEN
    RAISE EXCEPTION 'Daily message limit reached';
  END IF;

  -- Privacy gate
  _gate := public.can_send_message(_sender_id, _recipient_id);
  IF _gate IN ('closed','blocked') THEN
    RAISE EXCEPTION 'Recipient is not accepting messages';
  END IF;

  -- Get/create conversation (ordered by uuid)
  IF _sender_id < _recipient_id THEN
    SELECT id INTO _conv_id FROM public.conversations
      WHERE user_a = _sender_id AND user_b = _recipient_id;
    IF _conv_id IS NULL THEN
      INSERT INTO public.conversations (user_a, user_b, status)
        VALUES (_sender_id, _recipient_id,
                CASE WHEN _gate = 'allowed' THEN 'active'::conversation_status ELSE 'request'::conversation_status END)
        RETURNING id INTO _conv_id;
    END IF;
  ELSE
    SELECT id INTO _conv_id FROM public.conversations
      WHERE user_a = _recipient_id AND user_b = _sender_id;
    IF _conv_id IS NULL THEN
      INSERT INTO public.conversations (user_a, user_b, status)
        VALUES (_recipient_id, _sender_id,
                CASE WHEN _gate = 'allowed' THEN 'active'::conversation_status ELSE 'request'::conversation_status END)
        RETURNING id INTO _conv_id;
    END IF;
  END IF;

  -- Insert message
  INSERT INTO public.messages (sender_id, recipient_id, conversation_id, content)
  VALUES (_sender_id, _recipient_id, _conv_id, _trimmed)
  RETURNING id INTO _message_id;

  -- Atomic rate-limit increment (UPSERT)
  INSERT INTO public.user_message_limits (user_id, date, requests_sent)
  VALUES (_sender_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET requests_sent = public.user_message_limits.requests_sent + 1,
                updated_at = now();

  -- Bump conversation timestamp
  UPDATE public.conversations SET updated_at = now() WHERE id = _conv_id;

  RETURN _message_id;
END;
$$;

-- Ensure unique key for upsert
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_message_limits_user_date_key'
  ) THEN
    BEGIN
      ALTER TABLE public.user_message_limits
        ADD CONSTRAINT user_message_limits_user_date_key UNIQUE (user_id, date);
    EXCEPTION WHEN duplicate_table THEN NULL;
    END;
  END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.send_message(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.send_message(uuid, text) TO authenticated;

-- ============================================================
-- 2. update_conversation_status (accept/block) — auth + state-machine
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_conversation_status(
  _conversation_id uuid,
  _new_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _conv record;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _new_status NOT IN ('active','blocked','request') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  SELECT * INTO _conv FROM public.conversations WHERE id = _conversation_id;
  IF _conv.id IS NULL THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;

  IF auth.uid() <> _conv.user_a AND auth.uid() <> _conv.user_b THEN
    RAISE EXCEPTION 'Not a participant';
  END IF;

  -- Once blocked, only the blocker can unblock (we don't track blocker
  -- on conversations, so require both parties to use blocked_users for
  -- true blocks). Disallow unblocking via this function.
  IF _conv.status = 'blocked' AND _new_status <> 'blocked' THEN
    RAISE EXCEPTION 'Use unblock flow to lift a block';
  END IF;

  UPDATE public.conversations
  SET status = _new_status::conversation_status,
      updated_at = now()
  WHERE id = _conversation_id;

  RETURN TRUE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_conversation_status(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.update_conversation_status(uuid, text) TO authenticated;

-- ============================================================
-- 3. Lock down messages — drop write policies, add column-scoped UPDATE
-- ============================================================
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update message status for their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update read status of received messages" ON public.messages;

-- Sender can update their own message metadata (delete/archive/report)
CREATE POLICY "Sender can update own message flags"
ON public.messages FOR UPDATE TO authenticated
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- Recipient can mark read / archive / report / soft-delete their copy view
CREATE POLICY "Recipient can update received message flags"
ON public.messages FOR UPDATE TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

-- Column-level: prevent edits to content / identity / conversation
REVOKE UPDATE ON public.messages FROM authenticated, anon, PUBLIC;
GRANT  UPDATE (read_at, deleted_at, archived_at, reported_at, report_reason)
  ON public.messages TO authenticated;

-- INSERT only via send_message function (no direct insert policy)
-- (We intentionally leave NO INSERT policy on messages.)

-- ============================================================
-- 4. Lock down conversations — direct status updates blocked
-- ============================================================
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

-- (No direct INSERT/UPDATE policies. Status changes go through update_conversation_status;
--  conversation creation happens inside send_message.)
-- DELETE remains: participants can delete their conversation thread
-- SELECT remains as-is.

-- ============================================================
-- 5. Lock down user_message_limits — read-only for users
-- ============================================================
DROP POLICY IF EXISTS "Users can update their own message limits" ON public.user_message_limits;
-- Only SELECT remains for users; writes happen inside send_message (SECURITY DEFINER).
