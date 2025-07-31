-- Fix the foreign key relationship conflict between professional_profiles and profiles
-- Drop the existing foreign key and create a properly named one

-- Drop the existing fk_professional_profiles_profiles constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_professional_profiles_profiles') THEN
        ALTER TABLE professional_profiles DROP CONSTRAINT fk_professional_profiles_profiles;
    END IF;
END $$;

-- Create the proper foreign key with unique naming
ALTER TABLE professional_profiles 
ADD CONSTRAINT professional_profiles_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;