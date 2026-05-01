-- 1) Drop PII columns from profile_views (visible to viewed profile owner via RLS)
DROP INDEX IF EXISTS public.idx_profile_views_ip_viewed;
ALTER TABLE public.profile_views DROP COLUMN IF EXISTS ip_address;
ALTER TABLE public.profile_views DROP COLUMN IF EXISTS user_agent;

-- 2) Restrict approved professional_business_links read to authenticated users
DROP POLICY IF EXISTS "Public can view approved links" ON public.professional_business_links;

CREATE POLICY "Authenticated can view approved links"
  ON public.professional_business_links
  FOR SELECT
  TO authenticated
  USING (status = 'approved'::link_status);
