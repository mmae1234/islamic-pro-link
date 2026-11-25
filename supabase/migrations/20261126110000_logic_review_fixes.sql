-- =====================================================================
-- Logic review fixes (Nov 25 2026)
--  1. get_member_profiles: hold back Telegram like WhatsApp until a
--     conversation is active / mentorship accepted.
--  2. public_profile_preview: what a signed-out visitor sees when opening a
--     shared profile link (same limited fields as the directory preview,
--     honours the public_preview opt-out). No user id echoed back.
--  3. get_business_contact: business email/phone/address/social links for
--     SIGNED-IN members only (owner decision: no scraping by visitors);
--     hidden from anyone the owner has blocked or who blocked the owner.
--  4. admin_set_business_verified: the admin "Verified" switch.
--  5. Email the other person when a mentorship session is scheduled.
-- =====================================================================

-- 1 -------------------------------------------------------------------
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

-- 2 -------------------------------------------------------------------
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
    AND nullif(btrim(p.first_name), '') IS NOT NULL
    AND nullif(btrim(pp.occupation), '') IS NOT NULL;
$$;
REVOKE EXECUTE ON FUNCTION public.public_profile_preview(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_profile_preview(uuid) TO anon, authenticated;

-- 3 -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_business_contact(_business_id uuid)
RETURNS TABLE (
  owner_id uuid,
  email text,
  phone text,
  booking_url text,
  address_line1 text,
  address_line2 text,
  postal_code text,
  facebook_url text,
  instagram_url text,
  linkedin_url text,
  twitter_url text,
  youtube_url text,
  tiktok_url text,
  whatsapp_number text,
  telegram_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT b.owner_id, b.email, b.phone, b.booking_url, b.address_line1, b.address_line2,
         b.postal_code, b.facebook_url, b.instagram_url, b.linkedin_url, b.twitter_url,
         b.youtube_url, b.tiktok_url, b.whatsapp_number, b.telegram_url
  FROM public.business_accounts b
  WHERE b.id = _business_id
    AND auth.uid() IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users bu
      WHERE (bu.blocker_id = auth.uid() AND bu.blocked_id = b.owner_id)
         OR (bu.blocker_id = b.owner_id AND bu.blocked_id = auth.uid())
    );
$$;
REVOKE EXECUTE ON FUNCTION public.get_business_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_business_contact(uuid) TO authenticated;

-- 4 -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_set_business_verified(_business_id uuid, _verified boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only platform admins can change verification status';
  END IF;
  UPDATE public.business_accounts SET verified = _verified, updated_at = now()
  WHERE id = _business_id;
  RETURN FOUND;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_set_business_verified(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_business_verified(uuid, boolean) TO authenticated;

-- 5 -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.email_alert_on_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _mr record;
  _actor uuid := auth.uid();
BEGIN
  SELECT mentor_id, mentee_id INTO _mr FROM public.mentorship_requests WHERE id = NEW.request_id;
  IF _mr IS NULL THEN RETURN NEW; END IF;
  IF _actor = _mr.mentor_id THEN
    PERFORM public.queue_email_alert('session_scheduled', _mr.mentee_id, _mr.mentor_id);
  ELSIF _actor = _mr.mentee_id THEN
    PERFORM public.queue_email_alert('session_scheduled', _mr.mentor_id, _mr.mentee_id);
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.email_alert_on_session() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS email_alert_on_session_trigger ON public.mentorship_sessions;
CREATE TRIGGER email_alert_on_session_trigger
  AFTER INSERT ON public.mentorship_sessions
  FOR EACH ROW EXECUTE FUNCTION public.email_alert_on_session();

NOTIFY pgrst, 'reload schema';
