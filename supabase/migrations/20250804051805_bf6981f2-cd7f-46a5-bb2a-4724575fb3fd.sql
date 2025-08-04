-- Update sync_profile_names function to explicitly set search path
CREATE OR REPLACE FUNCTION public.sync_profile_names()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Update professional_profiles when profiles names change
  UPDATE professional_profiles 
  SET 
    first_name = NEW.first_name,
    last_name = NEW.last_name
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$function$;