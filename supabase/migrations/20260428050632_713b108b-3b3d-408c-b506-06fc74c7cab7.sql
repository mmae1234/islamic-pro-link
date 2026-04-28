
-- ============================================================
-- P0 #1: Lock down delete_user_account
-- ============================================================
CREATE OR REPLACE FUNCTION public.delete_user_account(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- CRITICAL: Verify caller is deleting their own account
  IF auth.uid() IS NULL OR auth.uid() <> user_id_param THEN
    RAISE EXCEPTION 'Not authorized to delete this account';
  END IF;

  DELETE FROM public.mentorship_sessions
  WHERE request_id IN (
    SELECT id FROM public.mentorship_requests
    WHERE mentor_id = user_id_param OR mentee_id = user_id_param
  );

  DELETE FROM public.mentorship_requests
  WHERE mentor_id = user_id_param OR mentee_id = user_id_param;

  DELETE FROM public.messages
  WHERE sender_id = user_id_param OR recipient_id = user_id_param;

  DELETE FROM public.conversations
  WHERE user_a = user_id_param OR user_b = user_id_param;

  DELETE FROM public.favorites WHERE user_id = user_id_param;
  DELETE FROM public.blocked_users WHERE blocker_id = user_id_param OR blocked_id = user_id_param;
  DELETE FROM public.profile_views WHERE viewer_id = user_id_param OR viewed_profile_id = user_id_param;
  DELETE FROM public.user_message_limits WHERE user_id = user_id_param;
  DELETE FROM public.abuse_reports WHERE reporter_id = user_id_param OR accused_id = user_id_param;
  DELETE FROM public.signup_events WHERE user_id = user_id_param;
  DELETE FROM public.professional_business_links WHERE professional_user_id = user_id_param;
  DELETE FROM public.business_members WHERE user_id = user_id_param;
  DELETE FROM public.business_accounts WHERE owner_id = user_id_param;
  DELETE FROM public.guest_profiles WHERE profile_id = user_id_param;
  DELETE FROM public.professional_profiles WHERE user_id = user_id_param;
  DELETE FROM public.profiles WHERE user_id = user_id_param;

  DELETE FROM auth.users WHERE id = user_id_param;

  RETURN TRUE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_user_account(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_account(uuid) TO service_role, authenticated;
-- Authenticated is granted, but the auth.uid() check inside means they can only delete themselves.

-- ============================================================
-- P0 #2: Restore directory access for authenticated users
-- The previous can_view_profile-only policy broke discovery for new users.
-- Add a permissive policy so any authenticated user can browse the professional directory.
-- ============================================================
CREATE POLICY "Authenticated users can view professional profiles for directory"
ON public.professional_profiles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view profile names for directory"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- ============================================================
-- P1 #12: Lock down get_or_create_conversation
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(user_a_param uuid, user_b_param uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  conversation_id uuid;
  ordered_user_a uuid;
  ordered_user_b uuid;
BEGIN
  -- CRITICAL: caller must be one of the participants
  IF auth.uid() IS NULL OR (auth.uid() <> user_a_param AND auth.uid() <> user_b_param) THEN
    RAISE EXCEPTION 'Caller must be a conversation participant';
  END IF;

  IF user_a_param < user_b_param THEN
    ordered_user_a := user_a_param;
    ordered_user_b := user_b_param;
  ELSE
    ordered_user_a := user_b_param;
    ordered_user_b := user_a_param;
  END IF;

  SELECT id INTO conversation_id
  FROM public.conversations
  WHERE user_a = ordered_user_a AND user_b = ordered_user_b;

  IF conversation_id IS NULL THEN
    INSERT INTO public.conversations (user_a, user_b, status)
    VALUES (ordered_user_a, ordered_user_b, 'request')
    RETURNING id INTO conversation_id;
  END IF;

  RETURN conversation_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_or_create_conversation(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(uuid, uuid) TO authenticated;
