-- Fix business contact information exposure by removing public access to business_accounts
-- This ensures sensitive contact data like email, phone, whatsapp_number can only be accessed 
-- through proper authentication and authorization channels

-- Remove the public access policy that exposes sensitive contact data
DROP POLICY IF EXISTS "Public basic business info access" ON public.business_accounts;

-- Now public users can only access business information through the business_directory view
-- which only exposes safe, non-sensitive fields (name, sector, bio, location, verified status)
-- 
-- Authenticated users with proper relationships can access contact information through 
-- business_directory_with_contact view which requires authentication and business relationships