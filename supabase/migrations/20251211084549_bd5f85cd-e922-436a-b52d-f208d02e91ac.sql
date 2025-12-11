-- Remove the overly permissive policy that exposes contact info to all authenticated users
DROP POLICY IF EXISTS "Authenticated users can view published business accounts for di" ON public.business_accounts;

-- Recreate business_directory view with security_invoker = false so it can be accessed
-- This view already excludes sensitive contact info (email, phone, whatsapp, social links)
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
WHERE status = ANY (ARRAY['published'::text, 'active'::text]);

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.business_directory TO authenticated;