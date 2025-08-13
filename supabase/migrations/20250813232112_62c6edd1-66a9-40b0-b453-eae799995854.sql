-- Fix security issue: Enable RLS on business_directory table and add proper policies
-- Business directories are typically public, but should have controlled access

-- 1. Enable Row Level Security on business_directory table
ALTER TABLE public.business_directory ENABLE ROW LEVEL SECURITY;

-- 2. Add policy for public read access to business directory
-- This allows authenticated and anonymous users to view business listings
CREATE POLICY "Public can view business directory" 
ON public.business_directory 
FOR SELECT 
USING (true);

-- 3. Restrict write operations to prevent unauthorized modifications
-- Only authenticated users should be able to modify business directory entries
-- (This assumes business_directory entries are managed through business_accounts table)
CREATE POLICY "No direct inserts to business directory" 
ON public.business_directory 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "No direct updates to business directory" 
ON public.business_directory 
FOR UPDATE 
USING (false);

CREATE POLICY "No direct deletes from business directory" 
ON public.business_directory 
FOR DELETE 
USING (false);