-- =====================================================================
-- Security & logic fixes (Nov 2026 review)
--
--  1. handle_new_user: whitelist account_type before writing profiles.role
--  2. set_account_type(): safe RPC for the onboarding role choice
--     (profiles.role UPDATE is revoked, so client upserts were failing)
--  3. business_accounts: only platform admins / service role may set `verified`
--  4. mentorship_requests: immutable identity fields + status state machine
--  5. conversations.requested_by + fixed messaging gate:
--       - requester can no longer accept their own request
--       - 'closed' recipients can't be messaged via an old pending request
--       - rate limit applies only to cold outreach, not active chats
--       - declines now feed requests_declined
--  6. can_view_profile: respect blocks and relationship status
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. handle_new_user — never trust raw account_type
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  _type text := COALESCE(NEW.raw_user_meta_data->>'account_type', 'visitor');
BEGIN
  IF _type NOT IN ('visitor', 'professional', 'business') THEN
    _type := 'visitor';
  END IF;

  INSERT INTO public.profiles (id, user_id, first_name, last_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    _type,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public;

-- Clean up any privileged-looking values that slipped in before this fix.
-- (Real admin rights live in user_roles; profiles.role is account type only.)
UPDATE public.profiles
SET role = 'visitor'
WHERE role IS NULL OR role NOT IN ('visitor', 'professional', 'business');

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_account_type_chk;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_account_type_chk
  CHECK (role IN ('visitor', 'professional', 'business'));

-- ---------------------------------------------------------------------
-- 2. set_account_type — the only client path to change profiles.role
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_account_type(_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _type NOT IN ('visitor', 'professional', 'business') THEN
    RAISE EXCEPTION 'Invalid account type';
  END IF;

  INSERT INTO public.profiles (id, user_id, role)
  VALUES (auth.uid(), auth.uid(), _type)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = now();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_account_type(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.set_account_type(text) TO authenticated;

-- ---------------------------------------------------------------------
-- 3. business_accounts.verified — admin / service role only
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_business_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Service role / SQL editor (no JWT) and platform admins may do anything.
  IF auth.uid() IS NULL OR public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.verified := false;
  ELSIF NEW.verified IS DISTINCT FROM OLD.verified THEN
    RAISE EXCEPTION 'Only platform admins can change verification status';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_business_verified() FROM anon, public;

DROP TRIGGER IF EXISTS business_accounts_guard_verified ON public.business_accounts;
CREATE TRIGGER business_accounts_guard_verified
  BEFORE INSERT OR UPDATE ON public.business_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_business_verified();

-- ---------------------------------------------------------------------
-- 4. mentorship_requests — state machine on UPDATE
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_mentorship_request_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL OR public.is_admin(_uid) THEN
    RETURN NEW;
  END IF;

  IF NEW.mentor_id IS DISTINCT FROM OLD.mentor_id
     OR NEW.mentee_id IS DISTINCT FROM OLD.mentee_id
     OR NEW.message IS DISTINCT FROM OLD.message
     OR NEW.skills_requested IS DISTINCT FROM OLD.skills_requested
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Mentorship request details cannot be edited';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'declined') THEN
      IF _uid <> OLD.mentor_id THEN
        RAISE EXCEPTION 'Only the mentor can accept or decline this request';
      END IF;
    ELSIF OLD.status = 'pending' AND NEW.status = 'cancelled' THEN
      IF _uid <> OLD.mentee_id THEN
        RAISE EXCEPTION 'Only the requester can cancel this request';
      END IF;
    ELSIF OLD.status = 'accepted' AND NEW.status IN ('completed', 'disconnected') THEN
      NULL; -- either participant (already enforced by RLS USING clause)
    ELSE
      RAISE EXCEPTION 'Invalid status change: % -> %', OLD.status, NEW.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_mentorship_request_update() FROM anon, public;

DROP TRIGGER IF EXISTS guard_mentorship_request_update_trigger ON public.mentorship_requests;
CREATE TRIGGER guard_mentorship_request_update_trigger
  BEFORE UPDATE ON public.mentorship_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_mentorship_request_update();

-- Add WITH CHECK so a participant can't move the row out of their own scope.
DROP POLICY IF EXISTS "Users can update their own mentorship requests" ON public.mentorship_requests;
CREATE POLICY "Users can update their own mentorship requests"
  ON public.mentorship_requests FOR UPDATE
  USING (auth.uid() = mentor_id OR auth.uid() = mentee_id)
  WITH CHECK (auth.uid() = mentor_id OR auth.uid() = mentee_id);

-- ---------------------------------------------------------------------
-- 5. Messaging
-- ---------------------------------------------------------------------

-- 5a. Track who opened a request conversation
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS requested_by uuid;

-- Backfill: the sender of the earliest message is the requester
UPDATE public.conversations c
SET requested_by = first_msg.sender_id
FROM (
  SELECT DISTINCT ON (conversation_id) conversation_id, sender_id
  FROM public.messages
  WHERE conversation_id IS NOT NULL
  ORDER BY conversation_id, created_at ASC
) AS first_msg
WHERE first_msg.conversation_id = c.id
  AND c.requested_by IS NULL;

-- 5b. Gate: who may send to whom
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

  IF _privacy IS NULL OR _privacy = 'closed' THEN
    RETURN 'closed';
  END IF;

  -- 'open' and 'mentorship_only' both accept message *requests*
  RETURN 'request';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.can_send_message(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.can_send_message(uuid, uuid) TO authenticated;

-- 5c. send_message — rate-limit cold outreach only; recipient reply = accept
CREATE OR REPLACE FUNCTION public.send_message(_recipient_id uuid, _content text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _sender_id uuid := auth.uid();
  _gate text;
  _conv record;
  _conv_id uuid;
  _message_id uuid;
  _trimmed text;
  _is_cold boolean;
  _pending_count integer;
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

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _recipient_id) THEN
    RAISE EXCEPTION 'Recipient not found';
  END IF;

  _gate := public.can_send_message(_sender_id, _recipient_id);
  IF _gate = 'blocked' THEN
    RAISE EXCEPTION 'Cannot message this user';
  END IF;
  IF _gate = 'closed' THEN
    RAISE EXCEPTION 'Recipient is not accepting messages';
  END IF;

  SELECT id, status, requested_by INTO _conv
  FROM public.conversations
  WHERE user_a = LEAST(_sender_id, _recipient_id)
    AND user_b = GREATEST(_sender_id, _recipient_id)
  FOR UPDATE;

  -- Cold outreach = starting a new request, or adding to your own pending request
  _is_cold := _gate = 'request';

  IF _is_cold AND NOT public.check_message_rate_limit(_sender_id) THEN
    RAISE EXCEPTION 'Daily message request limit reached';
  END IF;

  IF _conv.id IS NULL THEN
    INSERT INTO public.conversations (user_a, user_b, status, requested_by)
    VALUES (
      LEAST(_sender_id, _recipient_id),
      GREATEST(_sender_id, _recipient_id),
      CASE WHEN _gate = 'allowed' THEN 'active'::conversation_status
           ELSE 'request'::conversation_status END,
      _sender_id
    )
    RETURNING id INTO _conv_id;
  ELSE
    _conv_id := _conv.id;

    IF _conv.status = 'request' THEN
      IF _gate = 'allowed' THEN
        -- Recipient replied, or a mentorship now exists: activate
        UPDATE public.conversations
        SET status = 'active'::conversation_status
        WHERE id = _conv_id;
      ELSE
        -- Requester following up before a reply: cap at 3 pending messages
        SELECT count(*) INTO _pending_count
        FROM public.messages
        WHERE conversation_id = _conv_id AND sender_id = _sender_id;
        IF _pending_count >= 3 THEN
          RAISE EXCEPTION 'Please wait for a reply before sending more messages';
        END IF;
      END IF;
    END IF;
  END IF;

  INSERT INTO public.messages (sender_id, recipient_id, conversation_id, content)
  VALUES (_sender_id, _recipient_id, _conv_id, _trimmed)
  RETURNING id INTO _message_id;

  IF _is_cold THEN
    INSERT INTO public.user_message_limits (user_id, date, requests_sent)
    VALUES (_sender_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, date)
    DO UPDATE SET requests_sent = public.user_message_limits.requests_sent + 1,
                  updated_at = now();
  END IF;

  UPDATE public.conversations SET updated_at = now() WHERE id = _conv_id;

  RETURN _message_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.send_message(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.send_message(uuid, text) TO authenticated;

-- 5d. update_conversation_status — requester can't self-accept; declines counted
CREATE OR REPLACE FUNCTION public.update_conversation_status(_conversation_id uuid, _new_status text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _conv record;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _new_status NOT IN ('active', 'blocked') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  SELECT * INTO _conv FROM public.conversations WHERE id = _conversation_id FOR UPDATE;
  IF _conv.id IS NULL THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;

  IF _uid <> _conv.user_a AND _uid <> _conv.user_b THEN
    RAISE EXCEPTION 'Not a participant';
  END IF;

  IF _conv.status::text = _new_status THEN
    RETURN TRUE;
  END IF;

  IF _conv.status = 'blocked' THEN
    RAISE EXCEPTION 'Use unblock flow to lift a block';
  END IF;

  IF _new_status = 'active' THEN
    IF _conv.requested_by IS NOT NULL AND _conv.requested_by = _uid THEN
      RAISE EXCEPTION 'Only the recipient can accept a message request';
    END IF;
  END IF;

  -- A recipient declining a request counts against the requester
  IF _new_status = 'blocked'
     AND _conv.status = 'request'
     AND _conv.requested_by IS NOT NULL
     AND _conv.requested_by <> _uid THEN
    INSERT INTO public.user_message_limits (user_id, date, requests_declined)
    VALUES (_conv.requested_by, CURRENT_DATE, 1)
    ON CONFLICT (user_id, date)
    DO UPDATE SET requests_declined = public.user_message_limits.requests_declined + 1,
                  updated_at = now();
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

-- 5e. Legacy helper — sets requested_by too, so no path skips the gate
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(user_a_param uuid, user_b_param uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _conv_id uuid;
BEGIN
  IF auth.uid() IS NULL OR (auth.uid() <> user_a_param AND auth.uid() <> user_b_param) THEN
    RAISE EXCEPTION 'Caller must be a conversation participant';
  END IF;
  IF user_a_param = user_b_param THEN
    RAISE EXCEPTION 'Invalid participants';
  END IF;

  SELECT id INTO _conv_id
  FROM public.conversations
  WHERE user_a = LEAST(user_a_param, user_b_param)
    AND user_b = GREATEST(user_a_param, user_b_param);

  IF _conv_id IS NULL THEN
    INSERT INTO public.conversations (user_a, user_b, status, requested_by)
    VALUES (LEAST(user_a_param, user_b_param), GREATEST(user_a_param, user_b_param),
            'request', auth.uid())
    RETURNING id INTO _conv_id;
  END IF;

  RETURN _conv_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_or_create_conversation(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_or_create_conversation(uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------
-- 6. can_view_profile — honour blocks and relationship status
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_view_profile(_viewer_id uuid, _profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    _viewer_id IS NOT NULL
    AND (
      _viewer_id = _profile_user_id
      OR (
        NOT EXISTS (
          SELECT 1 FROM blocked_users b
          WHERE (b.blocker_id = _viewer_id AND b.blocked_id = _profile_user_id)
             OR (b.blocker_id = _profile_user_id AND b.blocked_id = _viewer_id)
        )
        AND (
          EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.user_a = LEAST(_viewer_id, _profile_user_id)
              AND c.user_b = GREATEST(_viewer_id, _profile_user_id)
              AND c.status IN ('request', 'active')
          )
          OR EXISTS (
            SELECT 1 FROM mentorship_requests mr
            WHERE mr.status IN ('pending', 'accepted', 'completed')
              AND ((mr.mentor_id = _viewer_id AND mr.mentee_id = _profile_user_id)
                OR (mr.mentor_id = _profile_user_id AND mr.mentee_id = _viewer_id))
          )
          OR EXISTS (
            SELECT 1 FROM business_members bm1
            JOIN business_members bm2 ON bm1.business_id = bm2.business_id
            WHERE bm1.user_id = _viewer_id AND bm2.user_id = _profile_user_id
          )
          OR EXISTS (
            SELECT 1 FROM professional_business_links pbl
            JOIN business_accounts ba ON ba.id = pbl.business_id
            WHERE pbl.professional_user_id = _profile_user_id
              AND pbl.status IN ('pending', 'approved')
              AND (ba.owner_id = _viewer_id
                   OR EXISTS (SELECT 1 FROM business_members bm
                              WHERE bm.business_id = ba.id AND bm.user_id = _viewer_id))
          )
        )
      )
    )
$$;

REVOKE EXECUTE ON FUNCTION public.can_view_profile(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.can_view_profile(uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------
-- 7. mentorship_requests — allow re-requesting after decline/cancel
--    The original UNIQUE(mentor_id, mentee_id) blocked this forever.
--    Only one *open* request per pair is enforced now.
-- ---------------------------------------------------------------------
ALTER TABLE public.mentorship_requests
  DROP CONSTRAINT IF EXISTS mentorship_requests_mentor_id_mentee_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS mentorship_requests_open_pair_uidx
  ON public.mentorship_requests (mentor_id, mentee_id)
  WHERE status IN ('pending', 'accepted');
