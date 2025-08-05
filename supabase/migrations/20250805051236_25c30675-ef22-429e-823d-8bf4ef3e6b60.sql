-- Fix security warning: set search_path for the function
CREATE OR REPLACE FUNCTION public.get_guest_viewable_profile_ids()
RETURNS uuid[] 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = ''
AS $$
  SELECT ARRAY(
    SELECT id 
    FROM public.professional_profiles 
    ORDER BY created_at 
    LIMIT 2
  );
$$;