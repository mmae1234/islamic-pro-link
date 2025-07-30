-- Remove foreign key constraints that reference auth.users to allow sample data
ALTER TABLE public.professional_profiles DROP CONSTRAINT IF EXISTS professional_profiles_user_id_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;