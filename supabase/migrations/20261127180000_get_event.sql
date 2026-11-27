-- One event by id for its own shareable page (/events/<id>). Same visibility
-- rules as list_events: hidden events and unapproved/suspended organizations
-- are never returned; address and RSVP link only for signed-in members.
CREATE OR REPLACE FUNCTION public.get_event(_id uuid)
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
  WHERE e.id = _id
    AND NOT e.hidden
    AND ba.kind = 'organization' AND ba.verified AND ba.status IN ('published', 'active')
    AND NOT public.is_suspended(ba.owner_id);
$$;
REVOKE EXECUTE ON FUNCTION public.get_event(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_event(uuid) TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
