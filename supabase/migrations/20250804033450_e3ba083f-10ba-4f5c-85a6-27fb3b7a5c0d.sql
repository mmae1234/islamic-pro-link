-- Add languages column to professional_profiles table
ALTER TABLE public.professional_profiles 
ADD COLUMN languages TEXT[] DEFAULT ARRAY[]::TEXT[];