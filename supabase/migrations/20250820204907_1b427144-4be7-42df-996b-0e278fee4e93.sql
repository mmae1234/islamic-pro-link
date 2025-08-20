-- Ensure application views execute with caller's permissions to respect RLS
ALTER VIEW public.business_directory SET (security_invoker = true);
ALTER VIEW public.business_directory_internal SET (security_invoker = true);
ALTER VIEW public.professional_directory SET (security_invoker = true);
ALTER VIEW public.public_guest_profiles SET (security_invoker = true);

-- Ensure API roles can read these views (RLS on underlying tables will still apply)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.business_directory TO anon, authenticated;
GRANT SELECT ON public.business_directory_internal TO anon, authenticated;
GRANT SELECT ON public.professional_directory TO anon, authenticated;
GRANT SELECT ON public.public_guest_profiles TO anon, authenticated;