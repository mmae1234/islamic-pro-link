-- =====================================================================
-- Mentorship is people-only (owner decision, Nov 26 2026)
--  * Business accounts can't offer or request mentorship.
--  * Business accounts lose any mentor / seeking-mentor flags, and can't set
--    them again.
--  * get_member_profiles returns business_name so existing requests and
--    conversations with a business account show the business instead of
--    "Unknown".
-- Existing accepted mentorships are kept as history.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.get_member_profiles(_user_ids uuid[])
RETURNS SETOF jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'profile', jsonb_build_object(
      'user_id', p.user_id,
      'first_name', p.first_name,
      'last_name', p.last_name,
      'avatar_url', p.avatar_url,
      'role', p.role,
      'messaging_privacy', p.messaging_privacy,
      -- Business accounts often have no personal name: show the business.
      'business_name', (SELECT b.name FROM public.business_accounts b
                        WHERE b.owner_id = p.user_id ORDER BY b.created_at LIMIT 1)
    ),
    'professional',
      CASE
        WHEN pp.user_id IS NULL THEN NULL
        WHEN p.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.user_a = LEAST(auth.uid(), p.user_id)
              AND c.user_b = GREATEST(auth.uid(), p.user_id)
              AND c.status = 'active')
          OR EXISTS (
            SELECT 1 FROM mentorship_requests mr
            WHERE mr.status IN ('accepted', 'completed')
              AND ((mr.mentor_id = auth.uid() AND mr.mentee_id = p.user_id)
                OR (mr.mentor_id = p.user_id AND mr.mentee_id = auth.uid())))
        THEN to_jsonb(pp)
        ELSE to_jsonb(pp) - 'whatsapp_number' - 'telegram_url'
      END
  )
  FROM unnest(_user_ids) WITH ORDINALITY AS u(id, ord)
  JOIN profiles p ON p.user_id = u.id
  LEFT JOIN professional_profiles pp ON pp.user_id = p.user_id
  WHERE auth.uid() IS NOT NULL
    AND (NOT public.is_suspended(p.user_id) OR p.user_id = auth.uid() OR public.is_admin(auth.uid()))
    AND cardinality(_user_ids) <= 200
    AND NOT EXISTS (
      SELECT 1 FROM blocked_users b
      WHERE (b.blocker_id = auth.uid() AND b.blocked_id = p.user_id)
         OR (b.blocker_id = p.user_id AND b.blocked_id = auth.uid())
    )
  ORDER BY u.ord;
$$;
REVOKE EXECUTE ON FUNCTION public.get_member_profiles(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_member_profiles(uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_mentorship_request_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _trimmed text;
  _recent_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NEW.mentee_id <> auth.uid() THEN
    RAISE EXCEPTION 'Mentee must match the authenticated user';
  END IF;
  IF NEW.mentor_id IS NULL OR NEW.mentor_id = NEW.mentee_id THEN
    RAISE EXCEPTION 'Invalid mentor';
  END IF;
  -- Mentorship is between people (owner decision, Nov 26 2026): business
  -- accounts can't offer or request it; the owner uses a personal account.
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.mentee_id AND role = 'business') THEN
    RAISE EXCEPTION 'Mentorship is for personal accounts. Please use your personal account to request a mentor.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.mentor_id AND role = 'business') THEN
    RAISE EXCEPTION 'This person is not currently accepting mentorship requests';
  END IF;
  IF public.is_suspended(NEW.mentor_id) OR public.is_suspended(NEW.mentee_id) THEN
    RAISE EXCEPTION 'This person is not currently accepting mentorship requests';
  END IF;

  _trimmed := btrim(coalesce(NEW.message, ''));
  IF length(_trimmed) < 30 THEN
    RAISE EXCEPTION 'Please write at least 30 characters introducing yourself';
  END IF;
  IF length(_trimmed) > 2000 THEN
    RAISE EXCEPTION 'Message too long (max 2000 characters)';
  END IF;
  NEW.message := _trimmed;

  -- Block check
  IF EXISTS (
    SELECT 1 FROM public.blocked_users
    WHERE (blocker_id = NEW.mentor_id AND blocked_id = NEW.mentee_id)
       OR (blocker_id = NEW.mentee_id AND blocked_id = NEW.mentor_id)
  ) THEN
    RAISE EXCEPTION 'Cannot send a request to this user';
  END IF;

  -- Dedupe
  IF EXISTS (
    SELECT 1 FROM public.mentorship_requests
    WHERE mentor_id = NEW.mentor_id AND mentee_id = NEW.mentee_id
      AND status IN ('pending','accepted')
  ) THEN
    RAISE EXCEPTION 'You already have an active request with this mentor';
  END IF;

  -- Rate limit
  SELECT count(*) INTO _recent_count
  FROM public.mentorship_requests
  WHERE mentee_id = NEW.mentee_id AND created_at > now() - interval '24 hours';
  IF _recent_count >= 5 THEN
    RAISE EXCEPTION 'Daily mentorship request limit reached (5 per 24 hours)';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.no_mentoring_for_business_accounts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.user_id AND role = 'business') THEN
    NEW.is_mentor := false;
    NEW.is_seeking_mentor := false;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.no_mentoring_for_business_accounts() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS no_mentoring_for_business_accounts_trg ON public.professional_profiles;
CREATE TRIGGER no_mentoring_for_business_accounts_trg
  BEFORE INSERT OR UPDATE OF is_mentor, is_seeking_mentor ON public.professional_profiles
  FOR EACH ROW EXECUTE FUNCTION public.no_mentoring_for_business_accounts();

UPDATE public.professional_profiles pp
SET is_mentor = false, is_seeking_mentor = false
FROM public.profiles p
WHERE p.user_id = pp.user_id AND p.role = 'business'
  AND (pp.is_mentor OR pp.is_seeking_mentor);

NOTIFY pgrst, 'reload schema';
