-- Fix security issue: Secure business_directory view by replacing it with a properly controlled view
-- The current view uses get_business_directory() function which already has SECURITY DEFINER

-- 1. Drop the existing unsecured view
DROP VIEW IF EXISTS public.business_directory;

-- 2. Create a new secured view with explicit access control
-- This view should only show public business information
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
WHERE b.status = 'published' OR b.status = 'active';

-- 3. Grant appropriate permissions
-- Allow public read access for business directory (this is typical for business directories)
GRANT SELECT ON public.business_directory TO anon;
GRANT SELECT ON public.business_directory TO authenticated;

-- 4. Add comment to document the security model
COMMENT ON VIEW public.business_directory IS 'Public business directory view - only shows published/active businesses';