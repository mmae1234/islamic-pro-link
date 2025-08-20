-- Remove public (unauthenticated) access to business accounts
DROP POLICY IF EXISTS "Public can view published business accounts for directory" ON public.business_accounts;

-- Add policy to allow only authenticated users to view published business accounts
CREATE POLICY "Authenticated users can view published business accounts for directory"
ON public.business_accounts
FOR SELECT
USING (auth.uid() IS NOT NULL AND status = 'published');

-- Ensure views inherit proper security by revoking and re-granting permissions
REVOKE SELECT ON public.business_directory FROM anon;
REVOKE SELECT ON public.business_directory_internal FROM anon;

-- Grant access to authenticated users only
GRANT SELECT ON public.business_directory TO authenticated;
GRANT SELECT ON public.business_directory_internal TO authenticated;