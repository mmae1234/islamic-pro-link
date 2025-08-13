-- Clean up all old security definer view dependencies
-- Remove the old view and function that are no longer needed

-- 1. Drop the old view that depends on the security definer function
DROP VIEW IF EXISTS public.guest_viewable_profiles CASCADE;

-- 2. Now drop the unused security definer function
DROP FUNCTION IF EXISTS public.get_guest_viewable_profile_ids();