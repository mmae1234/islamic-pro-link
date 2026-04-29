-- ============================================================
-- Batch P0/P1 fixes: business lookup RPC + mentorship request RPC
-- with rate limit/dedupe + restrict mentorship_requests INSERT
-- ============================================================

-- 1) get_business_by_id: replace 1000-row scan with single lookup
CREATE OR REPLACE FUNCTION public.get_business_by_id(_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  sector text,
  bio text,
  services text,
  country text,
  state text,
  city text,
  website text,
  logo_url text,
  verified boolean,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    ba.id,
    ba.name,
    ba.sector,
    ba.bio,
    ba.services,
    ba.country,
    ba.state,
    ba.city,
    ba.website,
    ba.logo_url,
    ba.verified,
    ba.created_at
  FROM business_accounts ba
  WHERE ba.id = _id
    AND ba.status IN ('published','active')
    AND auth.uid() IS NOT NULL;
$$;

REVOKE EXECUTE ON FUNCTION public.get_business_by_id(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_business_by_id(uuid) TO authenticated;

-- 2) request_mentorship: SECURITY DEFINER RPC with dedupe + rate limit + block check
CREATE OR REPLACE FUNCTION public.request_mentorship(
  _mentor_id uuid,
  _message text,
  _skills_requested text[] DEFAULT ARRAY[]::text[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _mentee_id uuid := auth.uid();
  _trimmed text;
  _recent_count integer;
  _request_id uuid;
BEGIN
  IF _mentee_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _mentor_id IS NULL OR _mentor_id = _mentee_id THEN
    RAISE EXCEPTION 'Invalid mentor';
  END IF;

  _trimmed := btrim(coalesce(_message, ''));
  IF length(_trimmed) < 30 THEN
    RAISE EXCEPTION 'Please write at least 30 characters introducing yourself';
  END IF;
  IF length(_trimmed) > 2000 THEN
    RAISE EXCEPTION 'Message too long (max 2000 characters)';
  END IF;

  -- Mentor must exist and have a professional profile flagged as mentor
  IF NOT EXISTS (
    SELECT 1 FROM public.professional_profiles
    WHERE user_id = _mentor_id AND is_mentor = true
  ) THEN
    RAISE EXCEPTION 'This person is not currently accepting mentorship requests';
  END IF;

  -- Block check
  IF EXISTS (
    SELECT 1 FROM public.blocked_users
    WHERE (blocker_id = _mentor_id AND blocked_id = _mentee_id)
       OR (blocker_id = _mentee_id AND blocked_id = _mentor_id)
  ) THEN
    RAISE EXCEPTION 'Cannot send a request to this user';
  END IF;

  -- Dedupe: no existing pending/accepted request for this pair
  IF EXISTS (
    SELECT 1 FROM public.mentorship_requests
    WHERE mentor_id = _mentor_id
      AND mentee_id = _mentee_id
      AND status IN ('pending','accepted')
  ) THEN
    RAISE EXCEPTION 'You already have an active request with this mentor';
  END IF;

  -- Rate limit: max 5 requests in any rolling 24h
  SELECT count(*) INTO _recent_count
  FROM public.mentorship_requests
  WHERE mentee_id = _mentee_id
    AND created_at > now() - interval '24 hours';

  IF _recent_count >= 5 THEN
    RAISE EXCEPTION 'Daily mentorship request limit reached (5 per 24 hours)';
  END IF;

  INSERT INTO public.mentorship_requests (mentor_id, mentee_id, message, skills_requested, status)
  VALUES (_mentor_id, _mentee_id, _trimmed, coalesce(_skills_requested, ARRAY[]::text[]), 'pending')
  RETURNING id INTO _request_id;

  RETURN _request_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.request_mentorship(uuid, text, text[]) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.request_mentorship(uuid, text, text[]) TO authenticated;

-- 3) Trigger: enforce same constraints if INSERT comes through direct table access
CREATE OR REPLACE FUNCTION public.guard_mentorship_request_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
    WHERE mentor_id = NEW.mentor_id
      AND mentee_id = NEW.mentee_id
      AND status IN ('pending','accepted')
  ) THEN
    RAISE EXCEPTION 'You already have an active request with this mentor';
  END IF;

  -- Rate limit
  SELECT count(*) INTO _recent_count
  FROM public.mentorship_requests
  WHERE mentee_id = NEW.mentee_id
    AND created_at > now() - interval '24 hours';

  IF _recent_count >= 5 THEN
    RAISE EXCEPTION 'Daily mentorship request limit reached (5 per 24 hours)';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_mentorship_request_insert_trigger ON public.mentorship_requests;
CREATE TRIGGER guard_mentorship_request_insert_trigger
BEFORE INSERT ON public.mentorship_requests
FOR EACH ROW
EXECUTE FUNCTION public.guard_mentorship_request_insert();