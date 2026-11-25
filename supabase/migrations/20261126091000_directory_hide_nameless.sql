-- =====================================================================
-- Directory: hide professional profiles that have no first name.
-- Same function as 20260428065417 plus one filter. Members keep their
-- profile; they reappear as soon as they add a name (the dashboard's
-- "Finish your profile" checklist tells them).
--
-- Before applying: confirm the live definition still matches
--   select pg_get_functiondef('public.list_professional_directory(text,text,text,text,text,boolean,boolean,text,integer,integer)'::regprocedure);
-- =====================================================================

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
    -- Hide profiles with no name (review item: nameless test/abandoned profiles)
    AND nullif(btrim(p.first_name), '') IS NOT NULL
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
