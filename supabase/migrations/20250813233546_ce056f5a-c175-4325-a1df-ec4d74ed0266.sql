-- Remove the unnecessary security definer function created earlier
-- Since we now have proper business_directory view, this function is redundant

DROP FUNCTION IF EXISTS public.get_business_contact_info(uuid);