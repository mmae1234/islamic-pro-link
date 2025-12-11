-- Fix security definer views by explicitly setting security_invoker = true
-- This ensures views respect RLS policies of the querying user

-- Recreate business_directory with security invoker
DROP VIEW IF EXISTS business_directory;
CREATE VIEW business_directory 
WITH (security_invoker = true) AS
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
    verified,
    created_at
FROM business_accounts
WHERE status = ANY (ARRAY['published'::text, 'active'::text]);

-- Recreate business_directory_internal with security invoker
DROP VIEW IF EXISTS business_directory_internal;
CREATE VIEW business_directory_internal 
WITH (security_invoker = true) AS
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
    created_at
FROM business_accounts
WHERE status = ANY (ARRAY['published'::text, 'active'::text]);

-- Recreate professional_directory with security invoker
DROP VIEW IF EXISTS professional_directory;
CREATE VIEW professional_directory 
WITH (security_invoker = true) AS
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

-- Recreate public_guest_profiles with security invoker
DROP VIEW IF EXISTS public_guest_profiles;
CREATE VIEW public_guest_profiles 
WITH (security_invoker = true) AS
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.avatar_url
FROM profiles p
JOIN guest_profiles gp ON p.user_id = gp.profile_id;