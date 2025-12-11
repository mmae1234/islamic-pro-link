-- Drop and recreate view with SECURITY INVOKER to inherit RLS from business_accounts
DROP VIEW IF EXISTS public.business_directory_internal;

CREATE VIEW public.business_directory_internal
WITH (security_invoker = true)
AS
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