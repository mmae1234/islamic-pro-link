-- 1. Prevent business owner_id theft by admins/team members
CREATE OR REPLACE FUNCTION public.guard_business_owner_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
    -- Only the current owner or a platform admin can transfer ownership
    IF auth.uid() <> OLD.owner_id AND NOT public.is_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Only the current owner or a platform admin can transfer business ownership';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS business_accounts_guard_owner_change ON public.business_accounts;
CREATE TRIGGER business_accounts_guard_owner_change
  BEFORE UPDATE ON public.business_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_business_owner_change();

-- 2. Tighten profile_views inserts (anyone can pollute today)
DROP POLICY IF EXISTS "Anyone can insert profile views" ON public.profile_views;
CREATE POLICY "Authenticated users can record profile views"
  ON public.profile_views
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- viewer_id must match the caller (or be NULL for not-tracked)
    (viewer_id IS NULL OR viewer_id = auth.uid())
    -- viewed profile must actually exist
    AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = viewed_profile_id)
    -- Cannot self-view spam
    AND (viewer_id IS NULL OR viewer_id <> viewed_profile_id)
  );

-- 3. Tighten signup_events inserts
DROP POLICY IF EXISTS "Anyone can insert signup events" ON public.signup_events;
CREATE POLICY "Signup events tied to caller or anonymous"
  ON public.signup_events
  FOR INSERT
  TO public
  WITH CHECK (
    -- Authenticated users can only log their own user_id
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    -- Anonymous events must have NULL user_id
    OR (auth.uid() IS NULL AND user_id IS NULL)
  );

-- Admins can review signup events for analytics/abuse
CREATE POLICY "Admins can view all signup events"
  ON public.signup_events
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- 4. Lock down guest_profiles — currently any authenticated user can wipe the table
DROP POLICY IF EXISTS "Authenticated users can delete guest profiles" ON public.guest_profiles;
DROP POLICY IF EXISTS "Authenticated users can insert guest profiles" ON public.guest_profiles;
DROP POLICY IF EXISTS "Authenticated users can view guest profiles" ON public.guest_profiles;

CREATE POLICY "Users can view their own guest profile"
  ON public.guest_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = profile_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create their own guest profile"
  ON public.guest_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own guest profile"
  ON public.guest_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = profile_id OR public.is_admin(auth.uid()));