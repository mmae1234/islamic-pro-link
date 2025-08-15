-- Fix security issue: Add RLS policies to public_guest_profiles table
-- This table contains user identity information (names, avatars) that should be protected

-- Enable Row Level Security on public_guest_profiles table
ALTER TABLE public.public_guest_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to view public guest profiles
-- This ensures only logged-in users can access this data
CREATE POLICY "Authenticated users can view public guest profiles" 
ON public.public_guest_profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create policy to allow users to insert guest profiles (if needed for functionality)
-- Only authenticated users can create guest profile entries
CREATE POLICY "Authenticated users can create public guest profiles" 
ON public.public_guest_profiles 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create policy to allow updates only by authenticated users
CREATE POLICY "Authenticated users can update public guest profiles" 
ON public.public_guest_profiles 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Create policy to allow deletes only by authenticated users
CREATE POLICY "Authenticated users can delete public guest profiles" 
ON public.public_guest_profiles 
FOR DELETE 
USING (auth.uid() IS NOT NULL);