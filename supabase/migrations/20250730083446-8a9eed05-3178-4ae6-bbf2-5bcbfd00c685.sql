-- Fix the function search path security issue
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';

-- Add function to handle automatic profile creation for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, full_name, created_at, updated_at)
  VALUES (NEW.id, NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger to automatically create profile for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();