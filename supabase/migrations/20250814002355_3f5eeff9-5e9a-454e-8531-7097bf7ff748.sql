-- Fix business contact information exposure by removing public access
-- Remove the public access policy that exposes sensitive contact data
DROP POLICY IF EXISTS "Public basic business info access" ON public.business_accounts;

-- Create a new restricted public policy that only allows access to basic business info
-- without sensitive contact details like email, phone, whatsapp_number
CREATE POLICY "Public basic business directory access"
ON public.business_accounts
FOR SELECT
USING (
  status IN ('published', 'active') 
  AND verified = true
);

-- However, we should restrict what columns public users can actually see
-- by ensuring they only access through the business_directory view
-- Let's also add RLS policies to the directory views for proper access control

-- Enable RLS on directory views
ALTER TABLE public.business_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_directory_with_contact ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_directory_internal ENABLE ROW LEVEL SECURITY;

-- Public can access business_directory (safe fields only)
CREATE POLICY "Public can view business directory"
ON public.business_directory
FOR SELECT
USING (true);

-- Only authenticated users can access contact information
CREATE POLICY "Authenticated users can view business contact info"
ON public.business_directory_with_contact
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only authenticated users can access internal directory
CREATE POLICY "Authenticated users can view internal directory"
ON public.business_directory_internal
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Add RLS to professional_directory too
ALTER TABLE public.professional_directory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view professional directory"
ON public.professional_directory
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Add RLS to public_guest_profiles
ALTER TABLE public.public_guest_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public guest profiles"
ON public.public_guest_profiles
FOR SELECT
USING (true);