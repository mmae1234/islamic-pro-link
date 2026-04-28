-- =========================================================================
-- 1. ABUSE REPORT HARDENING
-- =========================================================================

CREATE OR REPLACE FUNCTION public.guard_abuse_report_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _trimmed_reason text;
  _recent_count integer;
  _duplicate_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NEW.reporter_id <> auth.uid() THEN
    RAISE EXCEPTION 'Reporter must match the authenticated user';
  END IF;

  IF NEW.accused_id IS NULL OR NEW.accused_id = NEW.reporter_id THEN
    RAISE EXCEPTION 'Invalid accused user';
  END IF;

  _trimmed_reason := btrim(coalesce(NEW.reason, ''));
  IF length(_trimmed_reason) = 0 THEN
    RAISE EXCEPTION 'Report reason cannot be empty';
  END IF;
  IF length(_trimmed_reason) > 200 THEN
    RAISE EXCEPTION 'Report reason too long (max 200 characters)';
  END IF;
  NEW.reason := _trimmed_reason;

  IF NEW.details IS NOT NULL AND length(NEW.details) > 2000 THEN
    RAISE EXCEPTION 'Report details too long (max 2000 characters)';
  END IF;

  -- Per-day cap: max 5 reports in any rolling 24h window
  SELECT count(*) INTO _recent_count
  FROM public.abuse_reports
  WHERE reporter_id = NEW.reporter_id
    AND created_at > now() - interval '24 hours';

  IF _recent_count >= 5 THEN
    RAISE EXCEPTION 'Daily report limit reached (5 per 24 hours)';
  END IF;

  -- No duplicate reports against same person within 24h
  SELECT count(*) INTO _duplicate_count
  FROM public.abuse_reports
  WHERE reporter_id = NEW.reporter_id
    AND accused_id = NEW.accused_id
    AND created_at > now() - interval '24 hours';

  IF _duplicate_count > 0 THEN
    RAISE EXCEPTION 'You have already reported this user recently';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_abuse_report_insert_trg ON public.abuse_reports;
CREATE TRIGGER guard_abuse_report_insert_trg
  BEFORE INSERT ON public.abuse_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_abuse_report_insert();

-- Helpful index for the rate-limit lookup
CREATE INDEX IF NOT EXISTS idx_abuse_reports_reporter_created
  ON public.abuse_reports (reporter_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_abuse_reports_reporter_accused_created
  ON public.abuse_reports (reporter_id, accused_id, created_at DESC);

-- =========================================================================
-- 2. REVOKE ANON EXECUTE ON INTERNAL HELPERS
-- =========================================================================
-- These functions perform permission/identity checks or maintenance work and
-- have no legitimate anonymous use case. Authenticated users keep access.
-- Trigger functions are revoked too for hygiene (they run as table owner
-- regardless of caller).

-- Permission/identity checks (the main probing surface)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_active_mentorship(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.can_send_message(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.can_view_profile(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.check_message_rate_limit(uuid) FROM anon, public;

-- Business membership checks
REVOKE EXECUTE ON FUNCTION public.has_business_role(uuid, uuid, business_member_role[]) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_business_role_safe(uuid, uuid, business_member_role[]) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_business_owner(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_business_owner_safe(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_business_team_member(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_business_team_member_safe(uuid, uuid) FROM anon, public;

-- Directory helpers (already have inline auth checks, but no reason to expose)
REVOKE EXECUTE ON FUNCTION public.get_business_sectors() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.search_business_directory(text, text, text, text, text, boolean, integer) FROM anon, public;

-- Maintenance — never callable from a client
REVOKE EXECUTE ON FUNCTION public.consolidate_conversations() FROM anon, public;

-- Trigger functions — defense in depth
REVOKE EXECUTE ON FUNCTION public.assign_conversation_id() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.guard_business_owner_change() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.limit_rejected_link_requests() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.link_update_guard() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.mark_not_first_login() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.sync_profile_names() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.guard_abuse_report_insert() FROM anon, public;

-- Re-grant to authenticated for the helpers that ARE called from authenticated
-- client code paths (RLS policies use SECURITY DEFINER, so they don't need
-- caller EXECUTE — but in case anything is called via supabase.rpc()).
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_mentorship(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_send_message(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_profile(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_message_rate_limit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_business_role(uuid, uuid, business_member_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_business_role_safe(uuid, uuid, business_member_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_business_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_business_owner_safe(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_business_team_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_business_team_member_safe(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_business_sectors() TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_business_directory(text, text, text, text, text, boolean, integer) TO authenticated;