-- Update RLS policy for professional_profiles to allow limited guest access
DROP POLICY IF EXISTS "Users can view all professional profiles" ON professional_profiles;

-- Create new policy that allows authenticated users to see all profiles
CREATE POLICY "Authenticated users can view all professional profiles" 
ON professional_profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create policy for guests to see limited profiles (first 2 by creation date)
CREATE POLICY "Guests can view limited professional profiles" 
ON professional_profiles 
FOR SELECT 
USING (
  auth.uid() IS NULL AND 
  id IN (
    SELECT id FROM professional_profiles 
    ORDER BY created_at ASC 
    LIMIT 2
  )
);