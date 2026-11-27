-- =====================================================================
-- Jobs & opportunities: businesses and approved organizations post jobs,
-- internships, contract work and volunteer roles. Anyone can browse; the
-- apply link is for signed-in members only (https links only). Admins can
-- hide a post. Replaces the Careers "Coming soon" page.
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'job' CHECK (kind IN ('job', 'internship', 'contract', 'volunteer')),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 3 AND 120),
  description text CHECK (description IS NULL OR char_length(description) <= 6000),
  workplace text NOT NULL DEFAULT 'onsite' CHECK (workplace IN ('onsite', 'remote', 'hybrid')),
  city text CHECK (city IS NULL OR char_length(city) <= 100),
  state text CHECK (state IS NULL OR char_length(state) <= 100),
  country text CHECK (country IS NULL OR char_length(country) <= 100),
  pay text CHECK (pay IS NULL OR char_length(pay) <= 120),
  apply_url text CHECK (apply_url IS NULL OR (
    char_length(apply_url) <= 500
    AND apply_url ~* '^https://[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}(:[0-9]{2,5})?(/[^[:space:]<>"''`]*)?$')),
  closes_on date,
  hidden boolean NOT NULL DEFAULT false,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS opportunities_business_idx ON public.opportunities (business_id, created_at DESC);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_manage_listing(_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.business_accounts WHERE id = _business_id AND owner_id = auth.uid());
$$;
REVOKE EXECUTE ON FUNCTION public.can_manage_listing(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_listing(uuid) TO authenticated;

DROP POLICY IF EXISTS "Owners manage their opportunities" ON public.opportunities;
CREATE POLICY "Owners manage their opportunities"
  ON public.opportunities FOR ALL TO authenticated
  USING (public.can_manage_listing(business_id) OR public.is_admin(auth.uid()))
  WITH CHECK (public.can_manage_listing(business_id) OR public.is_admin(auth.uid()));
REVOKE ALL ON public.opportunities FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_opportunity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _admin boolean := public.is_admin(auth.uid());
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT _admin AND NOT EXISTS (
      SELECT 1 FROM public.business_accounts b
      WHERE b.id = NEW.business_id AND b.status IN ('published', 'active')
        AND (b.kind = 'business' OR b.verified)
    ) THEN
      RAISE EXCEPTION 'Your organization can post opportunities once it has been approved';
    END IF;
    NEW.created_by := auth.uid();
    IF NOT _admin THEN NEW.hidden := false; END IF;
  ELSE
    NEW.business_id := OLD.business_id;
    NEW.created_by := OLD.created_by;
    NEW.created_at := OLD.created_at;
    IF NOT _admin THEN NEW.hidden := OLD.hidden; END IF;
  END IF;
  IF NEW.closes_on IS NOT NULL AND NEW.closes_on > (now() + interval '1 year')::date THEN
    RAISE EXCEPTION 'Closing date can be up to a year ahead';
  END IF;
  NEW.title := btrim(NEW.title);
  NEW.apply_url := nullif(btrim(NEW.apply_url), '');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.guard_opportunity() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_opportunity_trg ON public.opportunities;
CREATE TRIGGER guard_opportunity_trg
  BEFORE INSERT OR UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.guard_opportunity();

-- Open posts: not hidden, not past their closing date, listing visible,
-- owner not suspended. Apply link only for signed-in members.
CREATE OR REPLACE FUNCTION public.list_opportunities(
  _kind text DEFAULT NULL,
  _search text DEFAULT NULL,
  _business_id uuid DEFAULT NULL,
  _id uuid DEFAULT NULL,
  _limit integer DEFAULT 100)
RETURNS TABLE(id uuid, business_id uuid, business_name text, business_logo_url text, business_kind text,
              kind text, title text, description text, workplace text, city text, state text, country text,
              pay text, apply_url text, closes_on date, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT o.id, o.business_id, b.name, b.logo_url, b.kind,
         o.kind, o.title, o.description, o.workplace, o.city, o.state, o.country, o.pay,
         CASE WHEN auth.uid() IS NOT NULL THEN o.apply_url END,
         o.closes_on, o.created_at
  FROM public.opportunities o
  JOIN public.business_accounts b ON b.id = o.business_id
  WHERE NOT o.hidden
    AND (o.closes_on IS NULL OR o.closes_on >= (now() AT TIME ZONE 'America/Los_Angeles')::date)
    AND b.status IN ('published', 'active')
    AND (b.kind = 'business' OR b.verified)
    AND NOT public.is_suspended(b.owner_id)
    AND (_kind IS NULL OR o.kind = _kind)
    AND (_business_id IS NULL OR o.business_id = _business_id)
    AND (_id IS NULL OR o.id = _id)
    AND (_search IS NULL OR o.title ILIKE '%' || _search || '%' OR o.description ILIKE '%' || _search || '%'
         OR b.name ILIKE '%' || _search || '%' OR o.city ILIKE '%' || _search || '%')
  ORDER BY o.created_at DESC
  LIMIT least(coalesce(_limit, 100), 200);
$$;
REVOKE EXECUTE ON FUNCTION public.list_opportunities(text, text, uuid, uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_opportunities(text, text, uuid, uuid, integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_opportunity_hidden(_id uuid, _hidden boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admins only'; END IF;
  UPDATE public.opportunities SET hidden = _hidden WHERE id = _id;
  RETURN FOUND;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_set_opportunity_hidden(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_opportunity_hidden(uuid, boolean) TO authenticated;

-- Reports can point at a post.
ALTER TABLE public.abuse_reports
  ADD COLUMN IF NOT EXISTS opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.fill_report_target()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _owner uuid;
BEGIN
  IF NEW.opportunity_id IS NOT NULL THEN
    SELECT o.business_id INTO NEW.business_id FROM public.opportunities o WHERE o.id = NEW.opportunity_id;
    IF NEW.business_id IS NULL THEN RAISE EXCEPTION 'Post not found'; END IF;
  END IF;
  IF NEW.event_id IS NOT NULL THEN
    SELECT e.org_id INTO NEW.business_id FROM public.org_events e WHERE e.id = NEW.event_id;
    IF NEW.business_id IS NULL THEN RAISE EXCEPTION 'Event not found'; END IF;
  END IF;
  IF NEW.business_id IS NOT NULL THEN
    SELECT b.owner_id INTO _owner FROM public.business_accounts b WHERE b.id = NEW.business_id;
    IF _owner IS NULL THEN RAISE EXCEPTION 'Listing not found'; END IF;
    IF _owner = NEW.reporter_id THEN RAISE EXCEPTION 'You can''t report your own listing'; END IF;
    NEW.accused_id := _owner;
  END IF;
  RETURN NEW;
END;
$$;

NOTIFY pgrst, 'reload schema';
