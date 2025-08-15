-- Enable RLS and add policies for business directory tables
ALTER TABLE business_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_directory_internal ENABLE ROW LEVEL SECURITY;

-- Allow public read access to business_directory
CREATE POLICY "Public can view business directory" 
ON business_directory 
FOR SELECT 
USING (true);

-- Allow authenticated users to view business_directory_internal
CREATE POLICY "Authenticated users can view business directory internal" 
ON business_directory_internal 
FOR SELECT 
USING (auth.uid() IS NOT NULL);