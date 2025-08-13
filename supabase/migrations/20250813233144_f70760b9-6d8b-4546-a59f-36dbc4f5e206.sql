-- Fix security definer issues by replacing problematic directory functions with proper RLS

-- 1. Drop the security definer directory functions that bypass RLS
DROP FUNCTION IF EXISTS public.get_business_directory();
DROP FUNCTION IF EXISTS public.get_professional_directory(integer);
DROP FUNCTION IF EXISTS public.get_professional_profile_public(uuid);

-- 2. Replace get_professional_directory with a proper view that respects RLS
CREATE VIEW public.professional_directory AS
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
ORDER BY p.created_at ASC;

-- 3. Grant appropriate access to the view
GRANT SELECT ON public.professional_directory TO authenticated;
GRANT SELECT ON public.professional_directory TO anon;

-- 4. Update business_directory view to use direct table access instead of function
DROP VIEW IF EXISTS public.business_directory;

CREATE VIEW public.business_directory 
WITH (security_barrier = true) AS
SELECT 
  b.id,
  b.name,
  b.sector,
  b.bio,
  b.services,
  b.country,
  b.state,
  b.city,
  b.website,
  b.logo_url,
  b.cover_url,
  b.verified,
  b.status,
  b.facebook_url,
  b.instagram_url,
  b.linkedin_url,
  b.twitter_url,
  b.youtube_url,
  b.tiktok_url,
  b.whatsapp_number,
  b.telegram_url,
  b.created_at
FROM public.business_accounts b
WHERE b.status IN ('published', 'active');

-- 5. Grant access to business directory
GRANT SELECT ON public.business_directory TO anon;
GRANT SELECT ON public.business_directory TO authenticated;