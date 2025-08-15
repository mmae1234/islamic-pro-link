-- Fix guest profiles security issue by ensuring proper access control
-- The issue is that guest_profiles table allows "Anyone can view guest profiles" 
-- which means anonymous users can access profile data through the view

-- Update the guest_profiles table policy to require authentication
DROP POLICY IF EXISTS "Anyone can view guest profiles" ON public.guest_profiles;

-- Create a secure policy that requires authentication to view guest profiles
CREATE POLICY "Authenticated users can view guest profiles" 
ON public.guest_profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Now the public_guest_profiles view will be secured because:
-- 1. The profiles table requires authentication: "Authenticated users can view all profiles"
-- 2. The guest_profiles table now requires authentication: "Authenticated users can view guest profiles"
-- 3. The view will only return data when both underlying tables allow access