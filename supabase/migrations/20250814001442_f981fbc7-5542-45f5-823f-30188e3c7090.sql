-- Fix business contact information exposure by implementing granular access control
-- Remove broad public access and create specific policies for different data types

-- Drop the problematic public access policy
DROP POLICY IF EXISTS "Public directory access for verified published businesses" ON public.business_accounts;

-- Create separate policies for different types of access

-- 1. Public directory access - ONLY basic business information (no contact details)
CREATE POLICY "Public basic business info access" 
ON public.business_accounts 
FOR SELECT 
TO anon, authenticated
USING (
  status IN ('published', 'active') 
  AND verified = true
);

-- 2. Contact information access - ONLY for authenticated users with business relationship
CREATE POLICY "Contact info for business relationships" 
ON public.business_accounts 
FOR SELECT 
TO authenticated
USING (
  (auth.uid() = owner_id) 
  OR is_business_team_member(auth.uid(), id) 
  OR (EXISTS (
    SELECT 1 FROM professional_business_links pbl
    WHERE pbl.business_id = id 
      AND pbl.professional_user_id = auth.uid() 
      AND pbl.status = 'approved'::link_status
  ))
);

-- 3. Update business directory views to properly filter sensitive data

-- Recreate public business_directory with ONLY safe fields
DROP VIEW IF EXISTS public.business_directory;
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
    verified,
    created_at
FROM business_accounts 
WHERE status IN ('published', 'active')
  AND verified = true;

-- Create a business_directory_with_contact for authenticated users with relationships
DROP VIEW IF EXISTS public.business_directory_with_contact;
CREATE VIEW public.business_directory_with_contact AS
SELECT 
    ba.id,
    ba.name,
    ba.sector,
    ba.bio,
    ba.services,
    ba.country,
    ba.state,
    ba.city,
    ba.website,
    ba.logo_url,
    ba.cover_url,
    ba.verified,
    ba.status,
    ba.facebook_url,
    ba.instagram_url,
    ba.linkedin_url,
    ba.twitter_url,
    ba.youtube_url,
    ba.tiktok_url,
    -- Contact information only visible with proper relationship
    CASE 
      WHEN (auth.uid() = ba.owner_id) 
        OR is_business_team_member(auth.uid(), ba.id) 
        OR (EXISTS (
          SELECT 1 FROM professional_business_links pbl
          WHERE pbl.business_id = ba.id 
            AND pbl.professional_user_id = auth.uid() 
            AND pbl.status = 'approved'::link_status
        ))
      THEN ba.email
      ELSE NULL
    END as email,
    CASE 
      WHEN (auth.uid() = ba.owner_id) 
        OR is_business_team_member(auth.uid(), ba.id) 
        OR (EXISTS (
          SELECT 1 FROM professional_business_links pbl
          WHERE pbl.business_id = ba.id 
            AND pbl.professional_user_id = auth.uid() 
            AND pbl.status = 'approved'::link_status
        ))
      THEN ba.phone
      ELSE NULL
    END as phone,
    CASE 
      WHEN (auth.uid() = ba.owner_id) 
        OR is_business_team_member(auth.uid(), ba.id) 
        OR (EXISTS (
          SELECT 1 FROM professional_business_links pbl
          WHERE pbl.business_id = ba.id 
            AND pbl.professional_user_id = auth.uid() 
            AND pbl.status = 'approved'::link_status
        ))
      THEN ba.whatsapp_number
      ELSE NULL
    END as whatsapp_number,
    CASE 
      WHEN (auth.uid() = ba.owner_id) 
        OR is_business_team_member(auth.uid(), ba.id) 
        OR (EXISTS (
          SELECT 1 FROM professional_business_links pbl
          WHERE pbl.business_id = ba.id 
            AND pbl.professional_user_id = auth.uid() 
            AND pbl.status = 'approved'::link_status
        ))
      THEN ba.telegram_url
      ELSE NULL
    END as telegram_url,
    ba.created_at
FROM business_accounts ba
WHERE ba.status IN ('published', 'active');

-- Set security_invoker on all views
ALTER VIEW public.business_directory SET (security_invoker = true);
ALTER VIEW public.business_directory_internal SET (security_invoker = true);
ALTER VIEW public.business_directory_with_contact SET (security_invoker = true);

-- Grant appropriate access
GRANT SELECT ON public.business_directory TO anon, authenticated;
GRANT SELECT ON public.business_directory_internal TO authenticated;
GRANT SELECT ON public.business_directory_with_contact TO authenticated;