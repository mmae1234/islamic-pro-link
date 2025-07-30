-- Add foreign key relationship between professional_profiles and profiles
-- First, ensure both tables have matching user_ids by creating any missing profiles
INSERT INTO public.profiles (id, user_id, full_name, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  pp.user_id,
  'Professional User',
  NOW(),
  NOW()
FROM public.professional_profiles pp
LEFT JOIN public.profiles p ON p.user_id = pp.user_id
WHERE p.user_id IS NULL;

-- Now add the foreign key constraint
ALTER TABLE public.professional_profiles 
ADD CONSTRAINT fk_professional_profiles_profiles 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);