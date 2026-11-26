-- Suspended members can't receive mentorship requests (they're hidden from
-- the directory, but a saved link with ?mentor=<id> still worked).
-- Same body as the live guard plus the suspension check.
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
