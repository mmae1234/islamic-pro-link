-- =====================================================================
-- Business accounts usually have no personal name, so messages, requests,
-- notifications and admin reports showed them as "Unknown".
-- display_name(profiles) is a PostgREST computed field: selecting
-- `display_name` on any profiles row/embed returns the person's name, or
-- their business's name when they haven't set one.
-- get_member_profiles and get_my_blocked_users return it too.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.display_name(p public.profiles)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT coalesce(
    nullif(btrim(concat_ws(' ', nullif(btrim(p.first_name), ''), nullif(btrim(p.last_name), ''))), ''),
    (SELECT b.name FROM public.business_accounts b
     WHERE b.owner_id = p.user_id ORDER BY b.created_at LIMIT 1)
  );
$$;
REVOKE EXECUTE ON FUNCTION public.display_name(public.profiles) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.display_name(public.profiles) TO authenticated, service_role;

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
      'messaging_privacy', p.messaging_privacy,
      -- Business accounts often have no personal name: show the business.
      'business_name', (SELECT b.name FROM public.business_accounts b
                        WHERE b.owner_id = p.user_id ORDER BY b.created_at LIMIT 1),
      'display_name', public.display_name(p)
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

DROP FUNCTION IF EXISTS public.get_my_blocked_users();
CREATE OR REPLACE FUNCTION public.get_my_blocked_users()
RETURNS TABLE (
  id uuid,
  blocked_id uuid,
  created_at timestamptz,
  first_name text,
  last_name text,
  avatar_url text,
  display_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT b.id, b.blocked_id, b.created_at, p.first_name, p.last_name, p.avatar_url, public.display_name(p)
  FROM public.blocked_users b
  LEFT JOIN public.profiles p ON p.user_id = b.blocked_id
  WHERE b.blocker_id = auth.uid()
  ORDER BY b.created_at DESC;
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_blocked_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_blocked_users() TO authenticated;


NOTIFY pgrst, 'reload schema';
