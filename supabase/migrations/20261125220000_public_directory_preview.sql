-- =====================================================================
-- Public directory preview for signed-out visitors
--
--  * profiles.public_preview: member's opt-out switch (default on)
--  * public_directory_preview(): limited, anonymous-safe view of the
--    professional directory. Returns NO user id, NO photo, NO last name
--    (initial only), NO contact details. Hides members without a first
--    name, without an occupation, or who opted out.
-- =====================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS public_preview boolean NOT NULL DEFAULT true;

GRANT UPDATE (public_preview) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.public_directory_preview(_limit integer DEFAULT 12)
RETURNS TABLE (
  first_name text,
  last_initial text,
  occupation text,
  sector text,
  city text,
  state_province text,
  country text,
  is_mentor boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    btrim(p.first_name),
    NULLIF(upper(left(btrim(coalesce(p.last_name, '')), 1)), ''),
    pp.occupation,
    pp.sector,
    pp.city,
    pp.state_province,
    pp.country,
    coalesce(pp.is_mentor, false)
  FROM public.professional_profiles pp
  JOIN public.profiles p ON p.user_id = pp.user_id
  WHERE p.public_preview
    AND nullif(btrim(p.first_name), '') IS NOT NULL
    AND nullif(btrim(pp.occupation), '') IS NOT NULL
  ORDER BY pp.updated_at DESC
  LIMIT GREATEST(1, LEAST(coalesce(_limit, 12), 24));
$$;

REVOKE EXECUTE ON FUNCTION public.public_directory_preview(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_directory_preview(integer) TO anon, authenticated;
