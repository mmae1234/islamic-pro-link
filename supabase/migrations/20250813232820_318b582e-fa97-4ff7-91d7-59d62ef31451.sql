-- Fix critical security issue: Remove public access to sensitive business data
-- Keep only owner/admin access and use business_directory for public information

-- 1. Remove the overly permissive policy that allows all authenticated users to view business accounts
DROP POLICY IF EXISTS "Authenticated users can view business accounts" ON public.business_accounts;

-- 2. Add a more restrictive policy for legitimate business viewing needs
-- This allows viewing only for business relationships (owners, team members, or through links)
CREATE POLICY "Business team members can view business accounts" 
ON public.business_accounts 
FOR SELECT 
USING (
  auth.uid() = owner_id OR 
  is_business_team_member(auth.uid(), id) OR
  EXISTS (
    SELECT 1 FROM public.professional_business_links pbl 
    WHERE pbl.business_id = id 
    AND pbl.professional_user_id = auth.uid() 
    AND pbl.status = 'approved'
  )
);

-- 3. Create a function to get safe business contact info for authenticated users
-- This excludes sensitive data like personal addresses and internal emails
CREATE OR REPLACE FUNCTION public.get_business_contact_info(_business_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  bio text,
  services text,
  sector text,
  country text,
  state text,
  city text,
  website text,
  logo_url text,
  cover_url text,
  verified boolean,
  facebook_url text,
  instagram_url text,
  linkedin_url text,
  twitter_url text,
  youtube_url text,
  tiktok_url text,
  whatsapp_number text,
  telegram_url text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  -- Only return business contact info for published businesses
  -- Excludes sensitive data like email, phone, physical addresses
  SELECT 
    b.id,
    b.name,
    b.bio,
    b.services,
    b.sector,
    b.country,
    b.state,
    b.city,
    b.website,
    b.logo_url,
    b.cover_url,
    b.verified,
    b.facebook_url,
    b.instagram_url,
    b.linkedin_url,
    b.twitter_url,
    b.youtube_url,
    b.tiktok_url,
    b.whatsapp_number,
    b.telegram_url
  FROM public.business_accounts b
  WHERE b.id = _business_id 
  AND (b.status = 'published' OR b.status = 'active')
  AND auth.uid() IS NOT NULL;
$function$;