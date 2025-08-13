-- Clean up unused security definer function
-- Remove the get_guest_viewable_profile_ids function since we replaced it with table-based approach

DROP FUNCTION IF EXISTS public.get_guest_viewable_profile_ids();