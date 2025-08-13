-- Fix security definer view issues by replacing with proper RLS approach
-- Remove security definer dependencies and use direct table access with RLS

-- 1. Drop the problematic view that depends on security definer functions
DROP VIEW IF EXISTS public.guest_viewable_profiles;

-- 2. Create a simple table-based approach for guest profile access
-- Create a guest_profiles table to explicitly control what profiles guests can see
CREATE TABLE IF NOT EXISTS public.guest_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(profile_id)
);

-- 3. Enable RLS on the new table
ALTER TABLE public.guest_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Add RLS policies for guest_profiles
CREATE POLICY "Anyone can view guest profiles" 
ON public.guest_profiles 
FOR SELECT 
USING (true);

-- 5. Only authenticated users can manage guest profile entries
CREATE POLICY "Authenticated users can insert guest profiles" 
ON public.guest_profiles 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete guest profiles" 
ON public.guest_profiles 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- 6. Create a view that joins guest_profiles with profiles for public access
CREATE VIEW public.public_guest_profiles AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.avatar_url
FROM public.profiles p
INNER JOIN public.guest_profiles gp ON p.id = gp.profile_id;

-- 7. Grant public access to the view
GRANT SELECT ON public.public_guest_profiles TO anon;
GRANT SELECT ON public.public_guest_profiles TO authenticated;

-- 8. Populate with initial data (first 2 profiles from professional_profiles)
INSERT INTO public.guest_profiles (profile_id)
SELECT user_id 
FROM public.professional_profiles 
ORDER BY created_at 
LIMIT 2
ON CONFLICT (profile_id) DO NOTHING;