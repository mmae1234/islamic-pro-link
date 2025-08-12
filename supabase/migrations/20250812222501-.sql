-- Tighten access to professional_profiles: remove guest SELECT, add public-safe directory functions

-- 1) Remove guest visibility policy
DROP POLICY IF EXISTS "Guests can view limited professional profiles" ON public.professional_profiles;

-- 2) Public-safe directory for guests (no contact or social fields)
CREATE OR REPLACE FUNCTION public.get_professional_directory(limit_count integer DEFAULT 2)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  bio text,
  occupation text,
  sector text,
  city text,
  state_province text,
  country text,
  experience_years integer,
  skills text[],
  is_mentor boolean,
  is_seeking_mentor boolean,
  availability text,
  avatar_url text,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT
    p.id,
    p.user_id,
    p.first_name,
    p.last_name,
    p.bio,
    p.occupation,
    p.sector,
    p.city,
    p.state_province,
    p.country,
    p.experience_years,
    p.skills,
    p.is_mentor,
    p.is_seeking_mentor,
    p.availability,
    p.avatar_url,
    p.created_at
  FROM public.professional_profiles p
  ORDER BY p.created_at ASC
  LIMIT COALESCE(limit_count, 2);
$$;

-- 3) Public-safe single profile by user id
CREATE OR REPLACE FUNCTION public.get_professional_profile_public(_user_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  bio text,
  occupation text,
  sector text,
  city text,
  state_province text,
  country text,
  experience_years integer,
  skills text[],
  is_mentor boolean,
  is_seeking_mentor boolean,
  availability text,
  avatar_url text,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT
    p.id,
    p.user_id,
    p.first_name,
    p.last_name,
    p.bio,
    p.occupation,
    p.sector,
    p.city,
    p.state_province,
    p.country,
    p.experience_years,
    p.skills,
    p.is_mentor,
    p.is_seeking_mentor,
    p.availability,
    p.avatar_url,
    p.created_at
  FROM public.professional_profiles p
  WHERE p.user_id = _user_id
  LIMIT 1;
$$;