-- Restrict sensitive business contact columns from public (anon)
REVOKE SELECT (email, phone, owner_id) ON TABLE public.business_accounts FROM anon;
-- Allow authenticated users to access contact info
GRANT SELECT (email, phone, owner_id) ON TABLE public.business_accounts TO authenticated;