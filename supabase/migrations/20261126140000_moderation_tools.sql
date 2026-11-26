-- =====================================================================
-- Moderation tools (logic review, Nov 25 2026)
--
-- Before: the admin Reports page showed a reason and a raw conversation id;
-- "View Profile", "View Conversation" and "Take Action" did nothing; the
-- reported message was never recorded, and the admin had no way to see
-- what was said or to stop a bad actor.
--
-- 1. abuse_reports: status (open / resolved / dismissed), admin note,
--    the reported message id, and an EVIDENCE snapshot taken by the server
--    at report time: the last 30 messages between reporter and the reported
--    member (the reporter is a party to them). It can't be faked by the
--    client and survives later deletes.
-- 2. member_suspensions + is_suspended(): a suspended member is hidden from
--    the directory, previews and profiles, and can't send or receive
--    messages. Sign-in is blocked separately by the admin-suspend-user edge
--    function (Supabase Auth ban), which also writes this table.
-- 3. admin_update_report(): change status / note (admins only).
--
-- Before applying: confirm list_professional_directory still matches
-- 20261126091000 (pg_get_functiondef).
-- =====================================================================

-- 1 -------------------------------------------------------------------
ALTER TABLE public.abuse_reports
  ADD COLUMN IF NOT EXISTS message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS admin_note text,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS evidence jsonb;

DO $$ BEGIN
  ALTER TABLE public.abuse_reports
    ADD CONSTRAINT abuse_reports_status_check CHECK (status IN ('open', 'resolved', 'dismissed'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.capture_report_evidence()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Server-owned fields: never trust the client for these.
  NEW.status := 'open';
  NEW.admin_note := NULL;
  NEW.resolved_at := NULL;
  NEW.resolved_by := NULL;

  -- A reported message must be one the accused sent to the reporter.
  IF NEW.message_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = NEW.message_id
      AND m.sender_id = NEW.accused_id
      AND m.recipient_id = NEW.reporter_id
  ) THEN
    NEW.message_id := NULL;
  END IF;

  IF NEW.conversation_id IS NULL THEN
    SELECT c.id INTO NEW.conversation_id
    FROM public.conversations c
    WHERE c.user_a = LEAST(NEW.reporter_id, NEW.accused_id)
      AND c.user_b = GREATEST(NEW.reporter_id, NEW.accused_id);
  END IF;

  SELECT coalesce(jsonb_agg(x ORDER BY x->>'created_at'), '[]'::jsonb) INTO NEW.evidence
  FROM (
    SELECT jsonb_build_object(
      'id', m.id,
      'from', CASE WHEN m.sender_id = NEW.accused_id THEN 'reported' ELSE 'reporter' END,
      'content', m.content,
      'created_at', m.created_at
    ) AS x
    FROM public.messages m
    WHERE (m.sender_id = NEW.accused_id AND m.recipient_id = NEW.reporter_id)
       OR (m.sender_id = NEW.reporter_id AND m.recipient_id = NEW.accused_id)
    ORDER BY m.created_at DESC
    LIMIT 30
  ) t;

  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.capture_report_evidence() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS capture_report_evidence_trg ON public.abuse_reports;
CREATE TRIGGER capture_report_evidence_trg
  BEFORE INSERT ON public.abuse_reports
  FOR EACH ROW EXECUTE FUNCTION public.capture_report_evidence();

CREATE OR REPLACE FUNCTION public.admin_update_report(_report_id uuid, _status text, _note text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only platform admins can update reports';
  END IF;
  IF _status NOT IN ('open', 'resolved', 'dismissed') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  UPDATE public.abuse_reports
  SET status = _status,
      admin_note = coalesce(nullif(btrim(_note), ''), admin_note),
      resolved_at = CASE WHEN _status = 'open' THEN NULL ELSE now() END,
      resolved_by = CASE WHEN _status = 'open' THEN NULL ELSE auth.uid() END
  WHERE id = _report_id;
  RETURN FOUND;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_update_report(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_report(uuid, text, text) TO authenticated;

-- 2 -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.member_suspensions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  suspended_at timestamptz NOT NULL DEFAULT now(),
  suspended_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text
);
ALTER TABLE public.member_suspensions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view suspensions" ON public.member_suspensions;
CREATE POLICY "Admins can view suspensions"
  ON public.member_suspensions FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
-- Writes only through the admin-suspend-user edge function (service role).
REVOKE ALL ON public.member_suspensions FROM anon, authenticated;
GRANT SELECT ON public.member_suspensions TO authenticated;

CREATE OR REPLACE FUNCTION public.is_suspended(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.member_suspensions WHERE user_id = _user_id);
$$;
REVOKE EXECUTE ON FUNCTION public.is_suspended(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_suspended(uuid) TO authenticated;

-- Hide suspended members everywhere members are listed or contacted.

CREATE OR REPLACE FUNCTION public.list_professional_directory(
  _country text DEFAULT NULL,
  _state_province text DEFAULT NULL,
  _city text DEFAULT NULL,
  _sector text DEFAULT NULL,
  _occupation text DEFAULT NULL,
  _is_mentor boolean DEFAULT NULL,
  _is_seeking_mentor boolean DEFAULT NULL,
  _search text DEFAULT NULL,
  _limit integer DEFAULT 50,
  _offset integer DEFAULT 0
)
RETURNS TABLE (
  user_id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  occupation text,
  sector text,
  city text,
  state_province text,
  country text,
  is_mentor boolean,
  is_seeking_mentor boolean,
  experience_years integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pp.user_id,
    p.first_name,
    p.last_name,
    pp.avatar_url,
    pp.occupation,
    pp.sector,
    pp.city,
    pp.state_province,
    pp.country,
    pp.is_mentor,
    pp.is_seeking_mentor,
    pp.experience_years
  FROM public.professional_profiles pp
  JOIN public.profiles p ON p.user_id = pp.user_id
  WHERE auth.uid() IS NOT NULL
    AND pp.user_id <> auth.uid()
    -- Hide profiles with no name (review item: nameless test/abandoned profiles)
    AND nullif(btrim(p.first_name), '') IS NOT NULL
    AND NOT public.is_suspended(pp.user_id)
    AND (_country IS NULL OR pp.country = _country)
    AND (_state_province IS NULL OR pp.state_province = _state_province)
    AND (_city IS NULL OR pp.city = _city)
    AND (_sector IS NULL OR pp.sector = _sector)
    AND (_occupation IS NULL OR pp.occupation = _occupation)
    AND (_is_mentor IS NULL OR pp.is_mentor = _is_mentor)
    AND (_is_seeking_mentor IS NULL OR pp.is_seeking_mentor = _is_seeking_mentor)
    AND (
      _search IS NULL
      OR p.first_name ILIKE '%' || _search || '%'
      OR p.last_name ILIKE '%' || _search || '%'
      OR pp.occupation ILIKE '%' || _search || '%'
      OR pp.sector ILIKE '%' || _search || '%'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users b
      WHERE (b.blocker_id = auth.uid() AND b.blocked_id = pp.user_id)
         OR (b.blocker_id = pp.user_id AND b.blocked_id = auth.uid())
    )
  ORDER BY pp.updated_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 100))
  OFFSET GREATEST(0, _offset);
$$;
REVOKE EXECUTE ON FUNCTION public.list_professional_directory(text,text,text,text,text,boolean,boolean,text,integer,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_professional_directory(text,text,text,text,text,boolean,boolean,text,integer,integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.public_directory_preview(_limit integer DEFAULT 12)
RETURNS TABLE (
  first_name text,
  last_initial text,
  occupation text,
  sector text,
  city text,
  state_province text,
  country text,
  is_mentor boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    btrim(p.first_name),
    NULLIF(upper(left(btrim(coalesce(p.last_name, '')), 1)), ''),
    pp.occupation,
    pp.sector,
    pp.city,
    pp.state_province,
    pp.country,
    coalesce(pp.is_mentor, false)
  FROM public.professional_profiles pp
  JOIN public.profiles p ON p.user_id = pp.user_id
  WHERE p.public_preview
    AND NOT public.is_suspended(p.user_id)
    AND nullif(btrim(p.first_name), '') IS NOT NULL
    AND nullif(btrim(pp.occupation), '') IS NOT NULL
  ORDER BY pp.updated_at DESC
  LIMIT GREATEST(1, LEAST(coalesce(_limit, 12), 24));
$$;
REVOKE EXECUTE ON FUNCTION public.public_directory_preview(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_directory_preview(integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_member_profiles(_user_ids uuid[])
RETURNS SETOF jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'profile', jsonb_build_object(
      'user_id', p.user_id,
      'first_name', p.first_name,
      'last_name', p.last_name,
      'avatar_url', p.avatar_url,
      'role', p.role,
      'messaging_privacy', p.messaging_privacy
    ),
    'professional',
      CASE
        WHEN pp.user_id IS NULL THEN NULL
        WHEN p.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.user_a = LEAST(auth.uid(), p.user_id)
              AND c.user_b = GREATEST(auth.uid(), p.user_id)
              AND c.status = 'active')
          OR EXISTS (
            SELECT 1 FROM mentorship_requests mr
            WHERE mr.status IN ('accepted', 'completed')
              AND ((mr.mentor_id = auth.uid() AND mr.mentee_id = p.user_id)
                OR (mr.mentor_id = p.user_id AND mr.mentee_id = auth.uid())))
        THEN to_jsonb(pp)
        ELSE to_jsonb(pp) - 'whatsapp_number' - 'telegram_url'
      END
  )
  FROM unnest(_user_ids) WITH ORDINALITY AS u(id, ord)
  JOIN profiles p ON p.user_id = u.id
  LEFT JOIN professional_profiles pp ON pp.user_id = p.user_id
  WHERE auth.uid() IS NOT NULL
    AND (NOT public.is_suspended(p.user_id) OR p.user_id = auth.uid() OR public.is_admin(auth.uid()))
    AND cardinality(_user_ids) <= 200
    AND NOT EXISTS (
      SELECT 1 FROM blocked_users b
      WHERE (b.blocker_id = auth.uid() AND b.blocked_id = p.user_id)
         OR (b.blocker_id = p.user_id AND b.blocked_id = auth.uid())
    )
  ORDER BY u.ord;
$$;
REVOKE EXECUTE ON FUNCTION public.get_member_profiles(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_member_profiles(uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.public_profile_preview(_user_id uuid)
RETURNS TABLE (
  first_name text,
  last_initial text,
  occupation text,
  sector text,
  city text,
  state_province text,
  country text,
  is_mentor boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    btrim(p.first_name),
    NULLIF(upper(left(btrim(coalesce(p.last_name, '')), 1)), ''),
    pp.occupation, pp.sector, pp.city, pp.state_province, pp.country,
    coalesce(pp.is_mentor, false)
  FROM public.profiles p
  JOIN public.professional_profiles pp ON pp.user_id = p.user_id
  WHERE p.user_id = _user_id
    AND p.public_preview
    AND NOT public.is_suspended(p.user_id)
    AND nullif(btrim(p.first_name), '') IS NOT NULL
    AND nullif(btrim(pp.occupation), '') IS NOT NULL;
$$;
REVOKE EXECUTE ON FUNCTION public.public_profile_preview(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_profile_preview(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.can_send_message(sender_id_param uuid, recipient_id_param uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _privacy text;
  _conv record;
BEGIN
  IF sender_id_param IS NULL OR recipient_id_param IS NULL
     OR sender_id_param = recipient_id_param THEN
    RETURN 'closed';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.blocked_users
    WHERE (blocker_id = recipient_id_param AND blocked_id = sender_id_param)
       OR (blocker_id = sender_id_param   AND blocked_id = recipient_id_param)
  ) THEN
    RETURN 'blocked';
  END IF;

  -- Suspended members can't send or receive messages
  IF public.is_suspended(sender_id_param) OR public.is_suspended(recipient_id_param) THEN
    RETURN 'closed';
  END IF;

  SELECT id, status, requested_by INTO _conv
  FROM public.conversations
  WHERE user_a = LEAST(sender_id_param, recipient_id_param)
    AND user_b = GREATEST(sender_id_param, recipient_id_param);

  IF _conv.status = 'blocked' THEN
    RETURN 'blocked';
  END IF;

  IF _conv.status = 'active' THEN
    RETURN 'allowed';
  END IF;

  IF public.has_active_mentorship(sender_id_param, recipient_id_param) THEN
    RETURN 'allowed';
  END IF;

  -- Replying to a request the other person sent you
  IF _conv.id IS NOT NULL AND _conv.status = 'request'
     AND _conv.requested_by = recipient_id_param THEN
    RETURN 'allowed';
  END IF;

  SELECT messaging_privacy::text INTO _privacy
  FROM public.profiles
  WHERE user_id = recipient_id_param;

  -- 'mentorship_only' members are reachable only through an active
  -- mentorship (already allowed above); 'closed' only through an existing
  -- conversation. 'open' members accept message *requests*.
  IF _privacy IS NULL OR _privacy IN ('closed', 'mentorship_only') THEN
    RETURN 'closed';
  END IF;

  RETURN 'request';
END;
$$;
REVOKE EXECUTE ON FUNCTION public.can_send_message(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.can_send_message(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
