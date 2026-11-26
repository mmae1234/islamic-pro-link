-- =====================================================================
-- Settings → Blocked members showed every entry as "Unknown User":
-- profiles RLS (can_view_profile) hides anyone in a block pair, so the
-- embedded profiles join came back empty. This returns the caller's own
-- block list with just the names/photos needed to recognise and unblock.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_my_blocked_users()
RETURNS TABLE (
  id uuid,
  blocked_id uuid,
  created_at timestamptz,
  first_name text,
  last_name text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT b.id, b.blocked_id, b.created_at, p.first_name, p.last_name, p.avatar_url
  FROM public.blocked_users b
  LEFT JOIN public.profiles p ON p.user_id = b.blocked_id
  WHERE b.blocker_id = auth.uid()
  ORDER BY b.created_at DESC;
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_blocked_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_blocked_users() TO authenticated;

NOTIFY pgrst, 'reload schema';
