-- Add foreign key relationship between professional_profiles and profiles tables
-- This will allow Supabase to understand the relationship for queries

ALTER TABLE public.professional_profiles 
ADD CONSTRAINT fk_professional_profiles_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

-- Also add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_professional_profiles_user_id 
ON public.professional_profiles(user_id);