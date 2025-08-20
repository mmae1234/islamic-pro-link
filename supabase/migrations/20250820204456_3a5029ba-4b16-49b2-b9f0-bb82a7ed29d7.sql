-- Drop the insecure view that exposes all business contact details
DROP VIEW IF EXISTS public.business_directory_internal;

-- Create a secure view that excludes sensitive contact information
-- This view will inherit RLS from the underlying business_accounts table
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
    created_at
FROM public.business_accounts
WHERE status IN ('published', 'active');

-- Grant appropriate permissions
GRANT SELECT ON public.business_directory_internal TO authenticated;
GRANT SELECT ON public.business_directory_internal TO anon;