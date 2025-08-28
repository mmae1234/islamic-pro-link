-- Restrict access to business directory views to authenticated users only

-- business_directory view
REVOKE ALL ON TABLE public.business_directory FROM PUBLIC;
REVOKE ALL ON TABLE public.business_directory FROM anon;
GRANT SELECT ON TABLE public.business_directory TO authenticated;
GRANT SELECT ON TABLE public.business_directory TO service_role;

-- business_directory_internal view
REVOKE ALL ON TABLE public.business_directory_internal FROM PUBLIC;
REVOKE ALL ON TABLE public.business_directory_internal FROM anon;
GRANT SELECT ON TABLE public.business_directory_internal TO authenticated;
GRANT SELECT ON TABLE public.business_directory_internal TO service_role;