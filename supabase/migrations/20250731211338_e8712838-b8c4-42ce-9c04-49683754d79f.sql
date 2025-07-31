-- Add state_province column to professional_profiles table
ALTER TABLE public.professional_profiles 
ADD COLUMN state_province text;