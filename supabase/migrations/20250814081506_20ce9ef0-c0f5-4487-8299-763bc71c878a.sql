-- Remove anonymous SELECT access from professional tables
DROP POLICY IF EXISTS "Allow anonymous users to view professional profiles" ON public.professional_profiles;
DROP POLICY IF EXISTS "Anonymous users can view professional directory" ON public.professional_directory;
DROP POLICY IF EXISTS "Allow anonymous read access to business accounts" ON public.business_accounts;
DROP POLICY IF EXISTS "Allow anonymous read access to business directory" ON public.business_directory;
DROP POLICY IF EXISTS "Allow anonymous read access to professional business links" ON public.professional_business_links;
DROP POLICY IF EXISTS "Allow anonymous read access to messages" ON public.messages;
DROP POLICY IF EXISTS "Allow anonymous read access to mentorship requests" ON public.mentorship_requests;

-- Ensure authenticated users can still access professional profiles
CREATE POLICY "Authenticated users can view all professional profiles" 
ON public.professional_profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Note: Keep existing policies for authenticated access, profile views, and other necessary operations
-- The existing RLS policies for authenticated users should remain unchanged