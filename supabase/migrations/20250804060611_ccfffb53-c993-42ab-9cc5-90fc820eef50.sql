-- Fix the handle_new_user function to use first_name and last_name instead of full_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, first_name, last_name, created_at, updated_at)
  VALUES (
    NEW.id, 
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''), 
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NOW(), 
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Migrate existing users who have full_name data to first_name/last_name
-- This handles the data migration for existing users
DO $$
DECLARE
  profile_record RECORD;
  name_parts TEXT[];
  first_name_part TEXT;
  last_name_part TEXT;
BEGIN
  -- Process profiles that might have full_name-like data in first_name field
  FOR profile_record IN 
    SELECT id, user_id, first_name, last_name 
    FROM public.profiles 
    WHERE first_name IS NOT NULL 
    AND (last_name IS NULL OR last_name = '')
    AND first_name LIKE '% %'
  LOOP
    -- Split the name on the first space
    name_parts := string_to_array(profile_record.first_name, ' ');
    
    IF array_length(name_parts, 1) >= 2 THEN
      -- Take first element as first name, join the rest as last name
      first_name_part := name_parts[1];
      last_name_part := array_to_string(name_parts[2:array_length(name_parts, 1)], ' ');
      
      -- Update the profile
      UPDATE public.profiles 
      SET 
        first_name = first_name_part,
        last_name = last_name_part,
        updated_at = NOW()
      WHERE id = profile_record.id;
    END IF;
  END LOOP;
END;
$$;