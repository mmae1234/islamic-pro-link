-- Step 1: Add first_name and last_name columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Step 2: Add first_name and last_name columns to professional_profiles table
ALTER TABLE public.professional_profiles 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Step 3: Backfill existing data by splitting full_name
UPDATE public.profiles 
SET 
  first_name = CASE 
    WHEN full_name IS NOT NULL AND trim(full_name) != '' THEN
      trim(split_part(full_name, ' ', 1))
    ELSE NULL
  END,
  last_name = CASE 
    WHEN full_name IS NOT NULL AND trim(full_name) != '' AND position(' ' in full_name) > 0 THEN
      trim(substring(full_name from position(' ' in full_name) + 1))
    ELSE NULL
  END
WHERE full_name IS NOT NULL;

-- Step 4: Sync names from profiles to professional_profiles
UPDATE public.professional_profiles 
SET 
  first_name = p.first_name,
  last_name = p.last_name
FROM public.profiles p
WHERE professional_profiles.user_id = p.user_id;

-- Step 5: Create function to keep names in sync
CREATE OR REPLACE FUNCTION public.sync_profile_names()
RETURNS TRIGGER AS $$
BEGIN
  -- Update professional_profiles when profiles names change
  UPDATE public.professional_profiles 
  SET 
    first_name = NEW.first_name,
    last_name = NEW.last_name
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create trigger to automatically sync names
DROP TRIGGER IF EXISTS sync_names_trigger ON public.profiles;
CREATE TRIGGER sync_names_trigger
  AFTER UPDATE OF first_name, last_name ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_names();

-- Step 7: Remove the old full_name column from profiles
ALTER TABLE public.profiles DROP COLUMN full_name;