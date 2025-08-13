-- Fix security definer view with a simpler approach that avoids foreign key issues
-- Drop any existing structures first

DROP TABLE IF EXISTS public.guest_profiles CASCADE;
DROP VIEW IF EXISTS public.public_guest_profiles CASCADE;

-- 1. Create a simple guest_profiles table with minimal constraints initially
CREATE TABLE public.guest_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(profile_id)
);

-- 2. Enable RLS on the new table
ALTER TABLE public.guest_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Add RLS policies for guest_profiles
CREATE POLICY "Anyone can view guest profiles" 
ON public.guest_profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert guest profiles" 
ON public.guest_profiles 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete guest profiles" 
ON public.guest_profiles 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- 4. Populate with safe data first
INSERT INTO public.guest_profiles (profile_id)
SELECT p.user_id 
FROM public.profiles p
INNER JOIN public.professional_profiles pp ON p.user_id = pp.user_id
ORDER BY pp.created_at 
LIMIT 2;

-- 5. Now add the foreign key constraint
ALTER TABLE public.guest_profiles 
ADD CONSTRAINT guest_profiles_profile_id_fkey 
FOREIGN KEY (profile_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- 6. Create view for public access
CREATE VIEW public.public_guest_profiles AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.avatar_url
FROM public.profiles p
INNER JOIN public.guest_profiles gp ON p.user_id = gp.profile_id;

-- 7. Grant access
GRANT SELECT ON public.public_guest_profiles TO anon;
GRANT SELECT ON public.public_guest_profiles TO authenticated;