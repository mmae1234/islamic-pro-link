-- Check current policies and disable/enable RLS correctly

-- First drop any existing policies that might be blocking
DROP POLICY IF EXISTS "Public can view business directory" ON business_directory;
DROP POLICY IF EXISTS "Authenticated users can view internal business directory" ON business_directory_internal;

-- Disable RLS first, then re-enable with proper policies
ALTER TABLE business_directory DISABLE ROW LEVEL SECURITY;
ALTER TABLE business_directory_internal DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with new policies
ALTER TABLE business_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_directory_internal ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Public can view business directory" 
ON business_directory 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can view internal business directory" 
ON business_directory_internal 
FOR SELECT 
USING (auth.uid() IS NOT NULL);