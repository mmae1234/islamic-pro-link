-- =====================================================================
-- Organizations + events (owner decisions, Nov 26 2026)
--
-- Organizations reuse business accounts (kind = 'organization'):
--  * listed only after an admin verifies them (prevents fake mosque/MSA pages)
--  * mentorship stays people-only (org owners have role 'business')
-- Events belong to verified organizations:
--  * title, time, in person / online, description, an https RSVP link
--  * anyone can see the listing; the street address and RSVP link are for
--    signed-in members only
--  * admins can hide an event
-- Admin alert: email when a new organization signs up, plus a reminder every
-- 3 days while any are waiting (org-approvals edge function).
-- =====================================================================

-- 1. Organization accounts -------------------------------------------
ALTER TABLE public.business_accounts
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'business',
  ADD COLUMN IF NOT EXISTS org_type text;

DO $$ BEGIN
  ALTER TABLE public.business_accounts
    ADD CONSTRAINT business_accounts_kind_chk CHECK (kind IN ('business', 'organization'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.business_accounts
    ADD CONSTRAINT business_accounts_org_type_chk CHECK (
      org_type IS NULL OR org_type IN
      ('mosque', 'student_association', 'professional_association', 'nonprofit', 'school', 'other'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Only admins change business <-> organization after creation (a verified
-- business must not become an unverified-looking "organization" or back).
CREATE OR REPLACE FUNCTION public.guard_business_kind()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.kind IS DISTINCT FROM OLD.kind
     AND auth.uid() IS NOT NULL
     AND NOT public.is_admin(auth.uid()) THEN
    NEW.kind := OLD.kind;
  END IF;
  IF NEW.kind = 'business' THEN
    NEW.org_type := NULL;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.guard_business_kind() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS business_accounts_guard_kind ON public.business_accounts;
CREATE TRIGGER business_accounts_guard_kind
  BEFORE UPDATE ON public.business_accounts
  FOR EACH ROW EXECUTE FUNCTION public.guard_business_kind();

-- Businesses page: businesses only.
CREATE OR REPLACE FUNCTION public.search_business_directory(
  search_term text DEFAULT NULL::text,
  filter_country text DEFAULT NULL::text,
  filter_state text DEFAULT NULL::text,
  filter_city text DEFAULT NULL::text,
  filter_sector text DEFAULT NULL::text,
  verified_only boolean DEFAULT false,
  result_limit integer DEFAULT 50)
RETURNS TABLE(id uuid, name text, sector text, bio text, services text, country text, state text, city text,
              website text, logo_url text, verified boolean, created_at timestamp with time zone)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT ba.id, ba.name, ba.sector, ba.bio, ba.services, ba.country, ba.state, ba.city,
         ba.website, ba.logo_url, ba.verified, ba.created_at
  FROM business_accounts ba
  WHERE ba.status = ANY (ARRAY['published'::text, 'active'::text])
    AND ba.kind = 'business'
    AND (search_term IS NULL OR (ba.name ILIKE '%' || search_term || '%'
         OR ba.bio ILIKE '%' || search_term || '%' OR ba.sector ILIKE '%' || search_term || '%'))
    AND (filter_country IS NULL OR ba.country = filter_country)
    AND (filter_state IS NULL OR ba.state = filter_state)
    AND (filter_city IS NULL OR ba.city = filter_city)
    AND (filter_sector IS NULL OR ba.sector = filter_sector)
    AND (NOT verified_only OR ba.verified = true)
  ORDER BY ba.verified DESC, ba.created_at DESC
  LIMIT result_limit;
END;
$function$;

-- Business/organization page: adds kind + org_type; unverified
-- organizations are visible only to their owner and admins.
DROP FUNCTION IF EXISTS public.get_business_by_id(uuid);
CREATE FUNCTION public.get_business_by_id(_id uuid)
RETURNS TABLE(id uuid, name text, sector text, bio text, services text, country text, state text, city text,
              website text, logo_url text, verified boolean, created_at timestamp with time zone,
              kind text, org_type text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT ba.id, ba.name, ba.sector, ba.bio, ba.services, ba.country, ba.state, ba.city,
         ba.website, ba.logo_url, ba.verified, ba.created_at, ba.kind, ba.org_type
  FROM business_accounts ba
  WHERE ba.id = _id
    AND ba.status IN ('published', 'active')
    AND auth.uid() IS NOT NULL
    AND (ba.kind = 'business' OR ba.verified
         OR ba.owner_id = auth.uid() OR public.is_admin(auth.uid()));
$$;
REVOKE EXECUTE ON FUNCTION public.get_business_by_id(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_business_by_id(uuid) TO authenticated;

-- 2. Events -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.org_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 3 AND 120),
  description text CHECK (description IS NULL OR char_length(description) <= 4000),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  timezone text NOT NULL DEFAULT 'America/Los_Angeles' CHECK (char_length(timezone) <= 64),
  mode text NOT NULL DEFAULT 'in_person' CHECK (mode IN ('in_person', 'online', 'hybrid')),
  venue_name text CHECK (venue_name IS NULL OR char_length(venue_name) <= 200),
  address text CHECK (address IS NULL OR char_length(address) <= 300),
  city text CHECK (city IS NULL OR char_length(city) <= 100),
  state text CHECK (state IS NULL OR char_length(state) <= 100),
  country text CHECK (country IS NULL OR char_length(country) <= 100),
  -- Safe links only: https, a real hostname, no spaces/quotes/angle brackets.
  rsvp_url text CHECK (rsvp_url IS NULL OR (
    char_length(rsvp_url) <= 500
    AND rsvp_url ~* '^https://[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}(:[0-9]{2,5})?(/[^[:space:]<>"''`]*)?$')),
  hidden boolean NOT NULL DEFAULT false,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT org_events_end_after_start CHECK (ends_at IS NULL OR ends_at >= starts_at)
);
CREATE INDEX IF NOT EXISTS org_events_org_start_idx ON public.org_events (org_id, starts_at);
CREATE INDEX IF NOT EXISTS org_events_start_idx ON public.org_events (starts_at) WHERE NOT hidden;

ALTER TABLE public.org_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_manage_org(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.business_accounts
                 WHERE id = _org_id AND owner_id = auth.uid() AND kind = 'organization');
$$;
REVOKE EXECUTE ON FUNCTION public.can_manage_org(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_org(uuid) TO authenticated;

DROP POLICY IF EXISTS "Org owners manage their events" ON public.org_events;
CREATE POLICY "Org owners manage their events"
  ON public.org_events FOR ALL TO authenticated
  USING (public.can_manage_org(org_id) OR public.is_admin(auth.uid()))
  WITH CHECK (public.can_manage_org(org_id) OR public.is_admin(auth.uid()));

REVOKE ALL ON public.org_events FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_events TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_org_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _admin boolean := public.is_admin(auth.uid());
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT EXISTS (SELECT 1 FROM public.business_accounts
                   WHERE id = NEW.org_id AND kind = 'organization' AND verified) AND NOT _admin THEN
      RAISE EXCEPTION 'Your organization can post events once it has been approved';
    END IF;
    IF NEW.starts_at < now() - interval '1 day' THEN
      RAISE EXCEPTION 'The event start time is in the past';
    END IF;
    NEW.created_by := auth.uid();
    IF NOT _admin THEN NEW.hidden := false; END IF;
  ELSE
    NEW.org_id := OLD.org_id;
    NEW.created_by := OLD.created_by;
    NEW.created_at := OLD.created_at;
    IF NOT _admin THEN NEW.hidden := OLD.hidden; END IF;
  END IF;
  IF NEW.starts_at > now() + interval '2 years' THEN
    RAISE EXCEPTION 'Events can be scheduled up to 2 years ahead';
  END IF;
  NEW.title := btrim(NEW.title);
  NEW.rsvp_url := nullif(btrim(NEW.rsvp_url), '');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.guard_org_event() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_org_event_trg ON public.org_events;
CREATE TRIGGER guard_org_event_trg
  BEFORE INSERT OR UPDATE ON public.org_events
  FOR EACH ROW EXECUTE FUNCTION public.guard_org_event();

-- Public listing. Street address and RSVP link only for signed-in members.
CREATE OR REPLACE FUNCTION public.list_events(
  _org_id uuid DEFAULT NULL,
  _limit integer DEFAULT 50,
  _include_past boolean DEFAULT false)
RETURNS TABLE(id uuid, org_id uuid, org_name text, org_logo_url text, title text, description text,
              starts_at timestamptz, ends_at timestamptz, timezone text, mode text,
              venue_name text, city text, state text, country text, address text, rsvp_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT e.id, e.org_id, ba.name, ba.logo_url, e.title, e.description,
         e.starts_at, e.ends_at, e.timezone, e.mode,
         e.venue_name, e.city, e.state, e.country,
         CASE WHEN auth.uid() IS NOT NULL THEN e.address END,
         CASE WHEN auth.uid() IS NOT NULL THEN e.rsvp_url END
  FROM public.org_events e
  JOIN public.business_accounts ba ON ba.id = e.org_id
  WHERE NOT e.hidden
    AND ba.kind = 'organization' AND ba.verified AND ba.status IN ('published', 'active')
    AND NOT public.is_suspended(ba.owner_id)
    AND (_org_id IS NULL OR e.org_id = _org_id)
    AND (_include_past OR coalesce(e.ends_at, e.starts_at) >= now() - interval '6 hours')
  ORDER BY e.starts_at
  LIMIT least(coalesce(_limit, 50), 200);
$$;

-- Organizations directory: verified organizations, open to visitors too.
CREATE OR REPLACE FUNCTION public.list_organizations(
  _search text DEFAULT NULL,
  _org_type text DEFAULT NULL,
  _country text DEFAULT NULL,
  _state text DEFAULT NULL,
  _city text DEFAULT NULL,
  _limit integer DEFAULT 60)
RETURNS TABLE(id uuid, name text, org_type text, bio text, country text, state text, city text,
              website text, logo_url text, upcoming_events integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT ba.id, ba.name, ba.org_type, left(ba.bio, 400), ba.country, ba.state, ba.city,
         ba.website, ba.logo_url,
         (SELECT count(*)::int FROM public.org_events e
          WHERE e.org_id = ba.id AND NOT e.hidden AND coalesce(e.ends_at, e.starts_at) >= now())
  FROM public.business_accounts ba
  WHERE ba.kind = 'organization'
    AND ba.verified
    AND ba.status IN ('published', 'active')
    AND NOT public.is_suspended(ba.owner_id)
    AND (_search IS NULL OR ba.name ILIKE '%' || _search || '%' OR ba.bio ILIKE '%' || _search || '%'
         OR ba.city ILIKE '%' || _search || '%')
    AND (_org_type IS NULL OR ba.org_type = _org_type)
    AND (_country IS NULL OR ba.country = _country)
    AND (_state IS NULL OR ba.state = _state)
    AND (_city IS NULL OR ba.city ILIKE _city)
  ORDER BY ba.name
  LIMIT least(coalesce(_limit, 60), 200);
$$;

-- 3. Admin -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_organizations()
RETURNS TABLE(id uuid, name text, org_type text, city text, state text, country text, website text,
              email text, verified boolean, created_at timestamptz, owner_name text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admins only';
  END IF;
  RETURN QUERY
  SELECT ba.id, ba.name, ba.org_type, ba.city, ba.state, ba.country, ba.website, ba.email,
         ba.verified, ba.created_at, public.display_name(p)
  FROM public.business_accounts ba
  LEFT JOIN public.profiles p ON p.user_id = ba.owner_id
  WHERE ba.kind = 'organization'
  ORDER BY ba.verified, ba.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_event_hidden(_event_id uuid, _hidden boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admins only';
  END IF;
  UPDATE public.org_events SET hidden = _hidden WHERE id = _event_id;
  RETURN FOUND;
END;
$$;

-- 4. Admin email: new organization + reminder every 3 days --------------
CREATE OR REPLACE FUNCTION public.ping_org_approvals(_mode text, _org_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _secret text;
BEGIN
  SELECT decrypted_secret INTO _secret FROM vault.decrypted_secrets WHERE name = 'digest_secret';
  IF _secret IS NULL THEN
    RAISE WARNING 'org approval email skipped: digest_secret missing';
    RETURN;
  END IF;
  PERFORM net.http_post(
    url := 'https://zhtfygjxnyxqsmeoipst.supabase.co/functions/v1/org-approvals',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpodGZ5Z2p4bnl4cXNtZW9pcHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTc3OTgsImV4cCI6MjA2OTQzMzc5OH0.e6BfsKvqmRYiRLO4DLqvylmV7smrlmVKBmKjRq2i5zw', -- gitleaks:allow (public anon key)
      'x-digest-secret', _secret),
    body := jsonb_build_object('mode', _mode, 'org_id', _org_id));
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'org approval email not queued: %', SQLERRM;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.ping_org_approvals(text, uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.email_admin_on_new_org()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.kind = 'organization' AND NOT NEW.verified THEN
    PERFORM public.ping_org_approvals('new', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.email_admin_on_new_org() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS email_admin_on_new_org_trg ON public.business_accounts;
CREATE TRIGGER email_admin_on_new_org_trg
  AFTER INSERT ON public.business_accounts
  FOR EACH ROW EXECUTE FUNCTION public.email_admin_on_new_org();

-- Every 3 days at 9:15 AM Pacific (17:15 UTC); the function sends nothing
-- when no organization is waiting.
DO $$
DECLARE _job bigint;
BEGIN
  SELECT jobid INTO _job FROM cron.job WHERE jobname = 'org-approvals-reminder';
  IF _job IS NOT NULL THEN PERFORM cron.unschedule(_job); END IF;
  PERFORM cron.schedule('org-approvals-reminder', '15 17 */3 * *',
    $cron$ SELECT public.ping_org_approvals('reminder'); $cron$);
END $$;

-- Grants (end of file so every function exists).
REVOKE EXECUTE ON FUNCTION public.list_organizations(text, text, text, text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_organizations(text, text, text, text, text, integer) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.list_events(uuid, integer, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_events(uuid, integer, boolean) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_list_organizations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_organizations() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_set_event_hidden(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_event_hidden(uuid, boolean) TO authenticated;

NOTIFY pgrst, 'reload schema';
