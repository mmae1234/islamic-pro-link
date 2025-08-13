-- Fix security definer issue by replacing with proper RLS approach
-- Remove the security definer function and use direct table access with proper RLS

-- Drop the security definer function
DROP FUNCTION IF EXISTS public.get_guest_profiles();

-- Instead, create a view that guest users can access for limited profile data
-- This relies on the existing get_guest_viewable_profile_ids() function
CREATE OR REPLACE VIEW public.guest_viewable_profiles AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.avatar_url
FROM public.profiles p
WHERE p.id = ANY(public.get_guest_viewable_profile_ids())
LIMIT 2;

-- Grant public access to this specific view only
GRANT SELECT ON public.guest_viewable_profiles TO anon;