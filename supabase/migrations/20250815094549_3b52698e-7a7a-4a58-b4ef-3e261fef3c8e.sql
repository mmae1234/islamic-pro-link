-- Fix RLS policies for business directory tables

-- Allow public access to business_directory (public view without contact info)
ALTER TABLE business_directory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view business directory" 
ON business_directory 
FOR SELECT 
USING (true);

-- Allow authenticated users to view business_directory_internal (includes contact info)
ALTER TABLE business_directory_internal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view internal business directory" 
ON business_directory_internal 
FOR SELECT 
USING (auth.uid() IS NOT NULL);