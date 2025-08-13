-- Fix Security Definer View issues by recreating views without SECURITY DEFINER
-- Drop and recreate all public views to ensure they don't have SECURITY DEFINER property

-- Drop existing views
DROP VIEW IF EXISTS public.business_directory CASCADE;
DROP VIEW IF EXISTS public.professional_directory CASCADE;
DROP VIEW IF EXISTS public.public_guest_profiles CASCADE;

-- Recreate business_directory view (public read access for published businesses)
CREATE VIEW public.business_directory AS
SELECT 
    id,
    name,
    sector,
    bio,
    services,
    country,
    state,
    city,
    website,
    logo_url,
    cover_url,
    verified,
    status,
    facebook_url,
    instagram_url,
    linkedin_url,
    twitter_url,
    youtube_url,
    tiktok_url,
    whatsapp_number,
    telegram_url,
    created_at
FROM business_accounts 
WHERE status IN ('published', 'active');

-- Recreate professional_directory view (accessible to authenticated users)
CREATE VIEW public.professional_directory AS
SELECT 
    id,
    user_id,
    first_name,
    last_name,
    bio,
    occupation,
    sector,
    city,
    state_province,
    country,
    experience_years,
    skills,
    is_mentor,
    is_seeking_mentor,
    availability,
    avatar_url,
    created_at
FROM professional_profiles
ORDER BY created_at;

-- Recreate public_guest_profiles view (public read access)
CREATE VIEW public.public_guest_profiles AS
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.avatar_url
FROM profiles p
JOIN guest_profiles gp ON p.user_id = gp.profile_id;

-- Grant appropriate permissions to views
GRANT SELECT ON public.business_directory TO anon, authenticated;
GRANT SELECT ON public.professional_directory TO authenticated;
GRANT SELECT ON public.public_guest_profiles TO anon, authenticated;