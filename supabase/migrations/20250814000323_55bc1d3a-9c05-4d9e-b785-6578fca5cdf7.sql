-- Fix business directory security by implementing proper access controls
-- Remove public access grants and implement controlled access through RLS policies

-- Revoke all public access to the business_directory view
REVOKE ALL ON public.business_directory FROM anon, authenticated, public;

-- Enable RLS on the business_directory view (this creates a policy table)
-- Since we can't enable RLS directly on views, we'll control access through the underlying table policies

-- Create a secure business directory view with proper filtering
DROP VIEW IF EXISTS public.business_directory;

-- Create a new business_directory view that only shows published/active businesses
-- and only shows safe, public information
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
  AND verified = true;  -- Only show verified businesses in public directory

-- Create a more detailed business_directory_internal view for authenticated users
CREATE VIEW public.business_directory_internal AS
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

-- Set both views to use security_invoker
ALTER VIEW public.business_directory SET (security_invoker = true);
ALTER VIEW public.business_directory_internal SET (security_invoker = true);

-- Grant limited access to public directory (verified businesses only, limited fields)
GRANT SELECT ON public.business_directory TO anon, authenticated;

-- Grant access to internal directory only for authenticated users
GRANT SELECT ON public.business_directory_internal TO authenticated;

-- Create RLS policy for additional protection on the underlying table
-- Update the business_accounts table to have a policy for public directory access
CREATE POLICY "Public directory access for verified published businesses" 
ON public.business_accounts 
FOR SELECT 
TO anon, authenticated
USING (status IN ('published', 'active') AND verified = true);