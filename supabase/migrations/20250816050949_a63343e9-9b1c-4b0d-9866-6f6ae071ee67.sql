-- Tighten public data exposure on business_accounts while preserving directory access

-- 1) Revoke any broad privileges from anon and public on base table
REVOKE ALL ON TABLE public.business_accounts FROM anon;
REVOKE ALL ON TABLE public.business_accounts FROM PUBLIC;

-- 2) Grant anon only safe, non-contact columns needed for the public directory
GRANT SELECT (
  id,
  name,
  sector,
  bio,
  country,
  state,
  city,
  verified,
  logo_url,
  cover_url,
  services,
  website,
  created_at,
  status
) ON public.business_accounts TO anon;

-- 3) Allow authenticated users to read all columns (RLS still applies for rows)
GRANT SELECT ON public.business_accounts TO authenticated;

-- 4) Ensure roles can read the directory views
GRANT SELECT ON public.business_directory TO anon;
GRANT SELECT ON public.business_directory_internal TO authenticated;