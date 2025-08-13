-- Fix security definer view issues with a safer approach
-- Create table without immediately populating it

-- 1. Create a guest_profiles table to explicitly control what profiles guests can see
CREATE TABLE IF NOT EXISTS public.guest_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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

-- 4. Only authenticated users can manage guest profile entries
CREATE POLICY "Authenticated users can insert guest profiles" 
ON public.guest_profiles 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete guest profiles" 
ON public.guest_profiles 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- 5. Create a view that joins guest_profiles with profiles for public access
CREATE VIEW public.public_guest_profiles AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.avatar_url
FROM public.profiles p
INNER JOIN public.guest_profiles gp ON p.id = gp.profile_id;

-- 6. Grant public access to the view
GRANT SELECT ON public.public_guest_profiles TO anon;
GRANT SELECT ON public.public_guest_profiles TO authenticated;

-- 7. Safely populate with existing data where profiles exist
INSERT INTO public.guest_profiles (profile_id)
SELECT pp.user_id 
FROM public.professional_profiles pp
INNER JOIN public.profiles p ON pp.user_id = p.user_id
ORDER BY pp.created_at 
LIMIT 2
ON CONFLICT (profile_id) DO NOTHING;