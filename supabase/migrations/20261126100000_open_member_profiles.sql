-- =====================================================================
-- Open professional profiles to all signed-in members (owner decision,
-- Nov 25 2026): the network exists so people can find and contact each
-- other. Before this, full profiles were visible only after a message or
-- mentorship request, which hid favorited professionals, showed every
-- profile as "limited", and broke the message picker and Block button.
--
-- get_member_profiles(ids):
--   * signed-in callers only; never returns members either side has blocked
--   * profile basics + the full professional profile
--   * whatsapp_number only for yourself, an ACTIVE conversation, or an
--     accepted/completed mentorship (held back otherwise)
--   * returns jsonb rows in the order of the ids passed in (max 200)
-- Table RLS is unchanged (direct reads stay relationship-scoped).
-- =====================================================================

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
        ELSE to_jsonb(pp) - 'whatsapp_number'
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
