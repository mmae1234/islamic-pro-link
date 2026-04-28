-- =====================================================================
-- Migration A: Directory & Auth Hardening (atomic)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Drop unused views
-- ---------------------------------------------------------------------
DROP VIEW IF EXISTS public.professional_directory CASCADE;
DROP VIEW IF EXISTS public.business_directory_internal CASCADE;

-- ---------------------------------------------------------------------
-- 2. Tighten profiles / professional_profiles SELECT
--    Drop the permissive auth.uid() IS NOT NULL policies.
--    The remaining "Users can view related profiles" (uses can_view_profile)
--    + admin policies + self-view policies cover legitimate reads.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view profile names for directory" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view professional profiles for director" ON public.professional_profiles;

-- ---------------------------------------------------------------------
-- 3. Tighten UPDATE policies on profiles / professional_profiles
--    Add WITH CHECK so users cannot rewrite user_id.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own professional profile" ON public.professional_profiles;
CREATE POLICY "Users can update their own professional profile"
  ON public.professional_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 4. Lock down profiles.role — only platform/admin pathways may change it
-- ---------------------------------------------------------------------
REVOKE UPDATE (role) ON public.profiles FROM authenticated;
REVOKE UPDATE (role) ON public.profiles FROM anon;

-- ---------------------------------------------------------------------
-- 5. Lock down messages columns
--    Authenticated users may only update flag columns, not content/identity.
-- ---------------------------------------------------------------------
REVOKE UPDATE ON public.messages FROM authenticated;
REVOKE UPDATE ON public.messages FROM anon;
GRANT UPDATE (read_at, deleted_at, archived_at, reported_at, report_reason)
  ON public.messages TO authenticated;

-- ---------------------------------------------------------------------
-- 6. Fix the "Approved partners" typo on business_accounts
--    Old policy referenced pbl.business_id = pbl.id (always false).
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Approved partners can view contact info" ON public.business_accounts;
CREATE POLICY "Approved partners can view contact info"
  ON public.business_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.professional_business_links pbl
      WHERE pbl.business_id = business_accounts.id
        AND pbl.professional_user_id = auth.uid()
        AND pbl.status = 'approved'::link_status
    )
  );

-- ---------------------------------------------------------------------
-- 7. New SECURITY DEFINER RPCs
-- ---------------------------------------------------------------------

-- 7a. list_professional_directory: directory grid
CREATE OR REPLACE FUNCTION public.list_professional_directory(
  _country text DEFAULT NULL,
  _state_province text DEFAULT NULL,
  _city text DEFAULT NULL,
  _sector text DEFAULT NULL,
  _occupation text DEFAULT NULL,
  _is_mentor boolean DEFAULT NULL,
  _is_seeking_mentor boolean DEFAULT NULL,
  _search text DEFAULT NULL,
  _limit integer DEFAULT 50,
  _offset integer DEFAULT 0
)
RETURNS TABLE (
  user_id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  occupation text,
  sector text,
  city text,
  state_province text,
  country text,
  is_mentor boolean,
  is_seeking_mentor boolean,
  experience_years integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pp.user_id,
    p.first_name,
    p.last_name,
    pp.avatar_url,
    pp.occupation,
    pp.sector,
    pp.city,
    pp.state_province,
    pp.country,
    pp.is_mentor,
    pp.is_seeking_mentor,
    pp.experience_years
  FROM public.professional_profiles pp
  JOIN public.profiles p ON p.user_id = pp.user_id
  WHERE auth.uid() IS NOT NULL
    AND pp.user_id <> auth.uid()
    AND (_country IS NULL OR pp.country = _country)
    AND (_state_province IS NULL OR pp.state_province = _state_province)
    AND (_city IS NULL OR pp.city = _city)
    AND (_sector IS NULL OR pp.sector = _sector)
    AND (_occupation IS NULL OR pp.occupation = _occupation)
    AND (_is_mentor IS NULL OR pp.is_mentor = _is_mentor)
    AND (_is_seeking_mentor IS NULL OR pp.is_seeking_mentor = _is_seeking_mentor)
    AND (
      _search IS NULL
      OR p.first_name ILIKE '%' || _search || '%'
      OR p.last_name ILIKE '%' || _search || '%'
      OR pp.occupation ILIKE '%' || _search || '%'
      OR pp.sector ILIKE '%' || _search || '%'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users b
      WHERE (b.blocker_id = auth.uid() AND b.blocked_id = pp.user_id)
         OR (b.blocker_id = pp.user_id AND b.blocked_id = auth.uid())
    )
  ORDER BY pp.updated_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 100))
  OFFSET GREATEST(0, _offset);
$$;

REVOKE EXECUTE ON FUNCTION public.list_professional_directory(text,text,text,text,text,boolean,boolean,text,integer,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_professional_directory(text,text,text,text,text,boolean,boolean,text,integer,integer) TO authenticated;

-- 7b. lookup_profile_basic: single-person basic info
CREATE OR REPLACE FUNCTION public.lookup_profile_basic(_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  occupation text,
  sector text,
  city text,
  country text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    p.first_name,
    p.last_name,
    COALESCE(pp.avatar_url, p.avatar_url) AS avatar_url,
    pp.occupation,
    pp.sector,
    pp.city,
    pp.country
  FROM public.profiles p
  LEFT JOIN public.professional_profiles pp ON pp.user_id = p.user_id
  WHERE p.user_id = _user_id
    AND auth.uid() IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users b
      WHERE (b.blocker_id = auth.uid() AND b.blocked_id = _user_id)
         OR (b.blocker_id = _user_id AND b.blocked_id = auth.uid())
    );
$$;

REVOKE EXECUTE ON FUNCTION public.lookup_profile_basic(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lookup_profile_basic(uuid) TO authenticated;

-- 7c. get_business_team: team list for a business profile page
CREATE OR REPLACE FUNCTION public.get_business_team(_business_id uuid)
RETURNS TABLE (
  user_id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  role_title text,
  occupation text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    p.first_name,
    p.last_name,
    COALESCE(pp.avatar_url, p.avatar_url) AS avatar_url,
    pbl.role_title,
    pp.occupation
  FROM public.professional_business_links pbl
  JOIN public.profiles p ON p.user_id = pbl.professional_user_id
  LEFT JOIN public.professional_profiles pp ON pp.user_id = pbl.professional_user_id
  WHERE pbl.business_id = _business_id
    AND pbl.status = 'approved'::link_status
    AND auth.uid() IS NOT NULL;
$$;

REVOKE EXECUTE ON FUNCTION public.get_business_team(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_business_team(uuid) TO authenticated;

-- 7d. get_business_owner_id: for the "Message Business" CTA
CREATE OR REPLACE FUNCTION public.get_business_owner_id(_business_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT owner_id
  FROM public.business_accounts
  WHERE id = _business_id
    AND status IN ('published', 'active')
    AND auth.uid() IS NOT NULL;
$$;

REVOKE EXECUTE ON FUNCTION public.get_business_owner_id(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_business_owner_id(uuid) TO authenticated;
