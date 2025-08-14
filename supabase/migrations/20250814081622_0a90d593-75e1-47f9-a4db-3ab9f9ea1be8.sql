-- Remove anonymous SELECT access from professional tables
DROP POLICY IF EXISTS "Allow anonymous users to view professional profiles" ON public.professional_profiles;
DROP POLICY IF EXISTS "Anonymous users can view professional directory" ON public.professional_directory;
DROP POLICY IF EXISTS "Allow anonymous read access to business accounts" ON public.business_accounts;
DROP POLICY IF EXISTS "Allow anonymous read access to business directory" ON public.business_directory;
DROP POLICY IF EXISTS "Allow anonymous read access to professional business links" ON public.professional_business_links;
DROP POLICY IF EXISTS "Allow anonymous read access to messages" ON public.messages;
DROP POLICY IF EXISTS "Allow anonymous read access to mentorship requests" ON public.mentorship_requests;

-- The authenticated users policy already exists, so we don't need to create it again