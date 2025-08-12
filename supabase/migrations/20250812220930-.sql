-- 1) Restrict public SELECT on business_accounts and require auth for full details
DROP POLICY IF EXISTS "Public can view business accounts" ON public.business_accounts;

-- Allow any authenticated user to view full business details
CREATE POLICY "Authenticated users can view business accounts"
ON public.business_accounts
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 2) Safe public directory via security definer function + view (exposes only non-sensitive fields)
CREATE OR REPLACE FUNCTION public.get_business_directory()
RETURNS TABLE (
  id uuid,
  name text,
  sector text,
  bio text,
  services text,
  country text,
  state text,
  city text,
  website text,
  logo_url text,
  cover_url text,
  verified boolean,
  status text,
  facebook_url text,
  instagram_url text,
  linkedin_url text,
  twitter_url text,
  youtube_url text,
  tiktok_url text,
  whatsapp_number text,
  telegram_url text,
  created_at timestamptz
) AS $$
  SELECT 
    b.id,
    b.name,
    b.sector,
    b.bio,
    b.services,
    b.country,
    b.state,
    b.city,
    b.website,
    b.logo_url,
    b.cover_url,
    b.verified,
    b.status,
    b.facebook_url,
    b.instagram_url,
    b.linkedin_url,
    b.twitter_url,
    b.youtube_url,
    b.tiktok_url,
    b.whatsapp_number,
    b.telegram_url,
    b.created_at
  FROM public.business_accounts b;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

DROP VIEW IF EXISTS public.business_directory;
CREATE VIEW public.business_directory AS
  SELECT * FROM public.get_business_directory();

-- Grant read access to the public directory view
GRANT SELECT ON public.business_directory TO anon, authenticated;