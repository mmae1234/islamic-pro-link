-- Add public read access to business_accounts for the business directory views

-- Add policy to allow public to view published business accounts for directory
CREATE POLICY "Public can view published business accounts for directory" 
ON business_accounts 
FOR SELECT 
USING (status = 'published');

-- The existing policies already allow authenticated users to view more details