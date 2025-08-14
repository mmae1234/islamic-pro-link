-- Fix business contact information exposure by removing public access to business_accounts
-- This ensures sensitive contact data can only be accessed through proper channels

-- Remove the public access policy that exposes sensitive contact data
DROP POLICY IF EXISTS "Public basic business info access" ON public.business_accounts;

-- The business_directory view should be the only way for public users to access business data
-- It only exposes safe, non-sensitive fields
-- Contact information is protected in business_directory_with_contact which requires authentication

-- Ensure RLS is enabled on professional_directory table
ALTER TABLE public.professional_directory ENABLE ROW LEVEL SECURITY;

-- Add policy for professional directory (authenticated access only)
CREATE POLICY "Authenticated users can view professional directory"
ON public.professional_directory
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Add RLS to public_guest_profiles table
ALTER TABLE public.public_guest_profiles ENABLE ROW LEVEL SECURITY;

-- Public guest profiles can be viewed by anyone (safe, basic info only)
CREATE POLICY "Anyone can view public guest profiles"
ON public.public_guest_profiles
FOR SELECT
USING (true);