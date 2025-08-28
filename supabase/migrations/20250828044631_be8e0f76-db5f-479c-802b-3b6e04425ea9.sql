-- Restrict access to professional directory view to authenticated users only

-- Ensure only authenticated users (and service role) can read the view
REVOKE ALL ON TABLE public.professional_directory FROM PUBLIC;
REVOKE ALL ON TABLE public.professional_directory FROM anon;
GRANT SELECT ON TABLE public.professional_directory TO authenticated;
GRANT SELECT ON TABLE public.professional_directory TO service_role;