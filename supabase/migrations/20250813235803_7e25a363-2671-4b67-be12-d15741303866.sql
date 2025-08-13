-- Fix Security Definer View issues by setting security_invoker = true
-- This ensures views use the permissions of the querying user, not the view creator

-- Alter existing views to use security_invoker
ALTER VIEW public.business_directory SET (security_invoker = true);
ALTER VIEW public.professional_directory SET (security_invoker = true);
ALTER VIEW public.public_guest_profiles SET (security_invoker = true);