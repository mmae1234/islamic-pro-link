-- Ensure we have necessary tables for guest access
-- Check if we need any additional RLS policies for anonymous users

-- Add RLS policy to allow anonymous users to view limited professional profiles 
-- (this should already exist but let's make sure it's properly configured)

-- Create function to get viewable profile IDs for guests if it doesn't exist
CREATE OR REPLACE FUNCTION public.get_guest_viewable_profile_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT ARRAY(
    SELECT id 
    FROM public.professional_profiles 
    ORDER BY created_at 
    LIMIT 2
  );
$function$;

-- Ensure the guest policy exists for professional_profiles
DROP POLICY IF EXISTS "Guests can view limited professional profiles" ON public.professional_profiles;
CREATE POLICY "Guests can view limited professional profiles" 
ON public.professional_profiles
FOR SELECT 
USING ((auth.uid() IS NULL) AND (id = ANY (get_guest_viewable_profile_ids())));

-- Ensure authenticated users can view all profiles
DROP POLICY IF EXISTS "Authenticated users can view all professional profiles" ON public.professional_profiles;
CREATE POLICY "Authenticated users can view all professional profiles" 
ON public.professional_profiles
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Allow anonymous users to view basic profile information for public pages
DROP POLICY IF EXISTS "Anonymous users can view basic profiles" ON public.profiles;
CREATE POLICY "Anonymous users can view basic profiles" 
ON public.profiles
FOR SELECT 
USING (true);