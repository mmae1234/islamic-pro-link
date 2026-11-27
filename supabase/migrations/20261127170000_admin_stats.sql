-- =====================================================================
-- Admin stats: weekly growth and engagement (last 12 weeks, Mon-Sun in
-- America/Los_Angeles) plus current totals. Admins only.
--   signups          new accounts
--   messages         messages sent
--   new_conversations conversations started
--   replied          of those, how many got a reply from the other person
--   active_members   members who sent a message, mentorship request or
--                    posted an event that week
-- =====================================================================
CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _weeks jsonb;
  _totals jsonb;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admins only';
  END IF;

  WITH wk AS (
    SELECT generate_series(
      date_trunc('week', (now() AT TIME ZONE 'America/Los_Angeles')) - interval '11 weeks',
      date_trunc('week', (now() AT TIME ZONE 'America/Los_Angeles')),
      interval '1 week') AS ws
  ),
  b AS (
    SELECT ws, (ws AT TIME ZONE 'America/Los_Angeles') AS s, ((ws + interval '1 week') AT TIME ZONE 'America/Los_Angeles') AS e FROM wk
  ),
  conv AS (
    SELECT c.id, c.created_at,
           EXISTS (
             SELECT 1 FROM public.messages m
             WHERE m.conversation_id = c.id
               AND m.sender_id <> coalesce(c.requested_by,
                     (SELECT m0.sender_id FROM public.messages m0 WHERE m0.conversation_id = c.id ORDER BY m0.created_at LIMIT 1))
           ) AS replied
    FROM public.conversations c
  )
  SELECT jsonb_agg(jsonb_build_object(
      'week', to_char(b.ws, 'YYYY-MM-DD'),
      'signups', (SELECT count(*) FROM public.profiles p WHERE p.created_at >= b.s AND p.created_at < b.e),
      'messages', (SELECT count(*) FROM public.messages m WHERE m.created_at >= b.s AND m.created_at < b.e),
      'new_conversations', (SELECT count(*) FROM conv WHERE conv.created_at >= b.s AND conv.created_at < b.e),
      'replied', (SELECT count(*) FROM conv WHERE conv.created_at >= b.s AND conv.created_at < b.e AND conv.replied),
      'active_members', (SELECT count(DISTINCT u) FROM (
          SELECT m.sender_id AS u FROM public.messages m WHERE m.created_at >= b.s AND m.created_at < b.e
          UNION SELECT r.mentee_id FROM public.mentorship_requests r WHERE r.created_at >= b.s AND r.created_at < b.e
          UNION SELECT ev.created_by FROM public.org_events ev WHERE ev.created_at >= b.s AND ev.created_at < b.e
        ) x WHERE u IS NOT NULL)
    ) ORDER BY b.ws)
  INTO _weeks
  FROM b;

  SELECT jsonb_build_object(
    'members', (SELECT count(*) FROM public.profiles),
    'professional_profiles', (SELECT count(*) FROM public.professional_profiles pp JOIN public.profiles p USING (user_id)
                              WHERE nullif(btrim(p.first_name), '') IS NOT NULL),
    'with_photo', (SELECT count(*) FROM public.profiles WHERE nullif(avatar_url, '') IS NOT NULL),
    'mentors', (SELECT count(*) FROM public.professional_profiles WHERE is_mentor),
    'businesses', (SELECT count(*) FROM public.business_accounts WHERE kind = 'business'),
    'organizations_approved', (SELECT count(*) FROM public.business_accounts WHERE kind = 'organization' AND verified),
    'organizations_waiting', (SELECT count(*) FROM public.business_accounts WHERE kind = 'organization' AND NOT verified),
    'upcoming_events', (SELECT count(*) FROM public.org_events WHERE NOT hidden AND coalesce(ends_at, starts_at) >= now()),
    'active_mentorships', (SELECT count(*) FROM public.mentorship_requests WHERE status = 'accepted'),
    'open_reports', (SELECT count(*) FROM public.abuse_reports WHERE status = 'open'),
    'joined_by_invite', (SELECT count(*) FROM public.profiles WHERE referred_by IS NOT NULL)
  ) INTO _totals;

  RETURN jsonb_build_object('weeks', coalesce(_weeks, '[]'::jsonb), 'totals', _totals);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_stats() TO authenticated;
