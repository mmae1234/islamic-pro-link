-- Extend favorites table to support both professional and business favorites
ALTER TABLE public.favorites
  ALTER COLUMN professional_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS business_id uuid;

-- Exactly one target must be set
ALTER TABLE public.favorites
  DROP CONSTRAINT IF EXISTS favorites_target_xor;
ALTER TABLE public.favorites
  ADD CONSTRAINT favorites_target_xor
  CHECK (
    (professional_id IS NOT NULL AND business_id IS NULL)
    OR (professional_id IS NULL AND business_id IS NOT NULL)
  );

-- Prevent duplicate professional or business favorites per user
CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_professional_uidx
  ON public.favorites (user_id, professional_id)
  WHERE professional_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_business_uidx
  ON public.favorites (user_id, business_id)
  WHERE business_id IS NOT NULL;

-- Index for lookups by business
CREATE INDEX IF NOT EXISTS favorites_business_id_idx
  ON public.favorites (business_id)
  WHERE business_id IS NOT NULL;

-- Existing RLS policies on favorites (user_id = auth.uid()) already cover both kinds.
-- No policy changes needed.

-- Update delete_user_account to also clean business favorites referencing the user's business.
-- (Existing function already deletes favorites WHERE user_id = user_id_param, which covers
-- the user's own favorites. We additionally remove rows where someone favorited a business
-- owned by the deleted user.)
CREATE OR REPLACE FUNCTION public.delete_user_account(user_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
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

  -- Remove favorites the user created AND favorites pointing at this user (as professional)
  -- or at businesses they own.
  DELETE FROM public.favorites
  WHERE user_id = user_id_param
     OR professional_id = user_id_param
     OR business_id IN (SELECT id FROM public.business_accounts WHERE owner_id = user_id_param);

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
$function$;