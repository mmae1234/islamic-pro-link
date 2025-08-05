-- Fix infinite recursion in professional_profiles RLS policy

-- First, drop the problematic policy
DROP POLICY IF EXISTS "Guests can view limited professional profiles" ON public.professional_profiles;

-- Create a security definer function to get the first 2 profile IDs without RLS
CREATE OR REPLACE FUNCTION public.get_guest_viewable_profile_ids()
RETURNS uuid[] AS $$
  SELECT ARRAY(
    SELECT id 
    FROM public.professional_profiles 
    ORDER BY created_at 
    LIMIT 2
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create a new policy that uses the security definer function
CREATE POLICY "Guests can view limited professional profiles" 
ON public.professional_profiles 
FOR SELECT 
USING (
  (auth.uid() IS NULL) AND 
  (id = ANY(public.get_guest_viewable_profile_ids()))
);