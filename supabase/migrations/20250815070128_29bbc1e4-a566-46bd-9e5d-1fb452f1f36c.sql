-- Fix security issue: Replace insecure public_guest_profiles view with secure version
-- Current view exposes user data without authentication checks

-- Drop the existing insecure view
DROP VIEW IF EXISTS public.public_guest_profiles;

-- Create a secure view that only allows authenticated users to access guest profile data
-- This view implements security by design, ensuring only logged-in users can see guest profiles
CREATE VIEW public.public_guest_profiles 
WITH (security_barrier = true) AS
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.avatar_url
FROM profiles p
JOIN guest_profiles gp ON (p.user_id = gp.profile_id)
WHERE auth.uid() IS NOT NULL;  -- Only allow access to authenticated users

-- Grant usage to authenticated users only
GRANT SELECT ON public.public_guest_profiles TO authenticated;