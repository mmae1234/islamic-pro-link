-- Fix the security definer view issue and create a proper secure solution
-- Remove the security definer view and implement proper RLS on underlying tables

-- Drop the insecure view
DROP VIEW IF EXISTS public.public_guest_profiles;

-- Create a simple view without security definer (security will be handled by RLS on underlying tables)
CREATE VIEW public.public_guest_profiles AS
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.avatar_url
FROM profiles p
JOIN guest_profiles gp ON (p.user_id = gp.profile_id);

-- The security is now properly handled by the existing RLS policies on the profiles and guest_profiles tables
-- Profiles table already has RLS policy: "Authenticated users can view all profiles"
-- Guest_profiles table already has RLS policy: "Anyone can view guest profiles"

-- Grant usage to authenticated role
GRANT SELECT ON public.public_guest_profiles TO authenticated;

-- Grant usage to anon role but security will be enforced by underlying table RLS
GRANT SELECT ON public.public_guest_profiles TO anon;