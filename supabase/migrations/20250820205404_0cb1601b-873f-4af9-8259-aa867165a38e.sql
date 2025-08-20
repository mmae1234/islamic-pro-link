-- Restrict public (anon) from reading sensitive contact fields on business_accounts
-- 1) Remove broad table-level SELECT from anon
REVOKE SELECT ON TABLE public.business_accounts FROM anon;

-- 2) Grant SELECT on only safe, non-sensitive columns to anon
GRANT SELECT (id, name, sector, bio, services, country, state, city, website, logo_url, verified, created_at)
ON public.business_accounts TO anon;

-- 3) Ensure authenticated users retain table-level SELECT (subject to RLS)
GRANT SELECT ON public.business_accounts TO authenticated;