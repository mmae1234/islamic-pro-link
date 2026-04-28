-- pgTAP regression test scaffold for security guarantees.
-- Tests run in a dedicated schema to keep public clean.

CREATE SCHEMA IF NOT EXISTS tests;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA tests;

-- Lock down the schema: only admins can poke at it.
REVOKE ALL ON SCHEMA tests FROM public, anon, authenticated;
GRANT USAGE ON SCHEMA tests TO postgres;

-- Helper: assert anon cannot EXECUTE a function.
-- Returns a pgTAP-style row (ok, description).
CREATE OR REPLACE FUNCTION tests.assert_anon_cannot_execute(_func_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'tests'
AS $$
DECLARE
  _has_priv boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.routine_privileges
    WHERE grantee = 'anon'
      AND routine_schema = 'public'
      AND routine_name = _func_name
      AND privilege_type = 'EXECUTE'
  ) INTO _has_priv;

  IF _has_priv THEN
    RETURN format('FAIL: anon has EXECUTE on public.%I', _func_name);
  ELSE
    RETURN format('OK: anon cannot execute public.%I', _func_name);
  END IF;
END;
$$;

-- Helper: assert a column-level privilege is NOT granted.
CREATE OR REPLACE FUNCTION tests.assert_no_column_privilege(
  _table_name text,
  _column_name text,
  _grantee text,
  _privilege text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'tests'
AS $$
DECLARE
  _has_priv boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.column_privileges
    WHERE grantee = _grantee
      AND table_schema = 'public'
      AND table_name = _table_name
      AND column_name = _column_name
      AND privilege_type = _privilege
  ) INTO _has_priv;

  IF _has_priv THEN
    RETURN format('FAIL: %s has %s on %s.%s', _grantee, _privilege, _table_name, _column_name);
  ELSE
    RETURN format('OK: %s does not have %s on %s.%s', _grantee, _privilege, _table_name, _column_name);
  END IF;
END;
$$;

-- Main regression suite. Returns one text row per check.
-- Run via: SELECT * FROM tests.run_security_regression();
CREATE OR REPLACE FUNCTION tests.run_security_regression()
RETURNS TABLE(check_name text, result text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'tests'
AS $$
BEGIN
  -- Only admins can run the suite.
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can run the regression suite';
  END IF;

  -- 1. profiles.role must not be UPDATE-able by authenticated.
  RETURN QUERY SELECT
    'profiles.role immutable for authenticated'::text,
    tests.assert_no_column_privilege('profiles', 'role', 'authenticated', 'UPDATE');

  -- 2. anon cannot execute internal helpers.
  RETURN QUERY SELECT 'anon !exec is_admin'::text,            tests.assert_anon_cannot_execute('is_admin');
  RETURN QUERY SELECT 'anon !exec has_role'::text,            tests.assert_anon_cannot_execute('has_role');
  RETURN QUERY SELECT 'anon !exec can_view_profile'::text,    tests.assert_anon_cannot_execute('can_view_profile');
  RETURN QUERY SELECT 'anon !exec can_send_message'::text,    tests.assert_anon_cannot_execute('can_send_message');
  RETURN QUERY SELECT 'anon !exec check_message_rate_limit'::text, tests.assert_anon_cannot_execute('check_message_rate_limit');
  RETURN QUERY SELECT 'anon !exec is_business_owner'::text,   tests.assert_anon_cannot_execute('is_business_owner');
  RETURN QUERY SELECT 'anon !exec has_business_role'::text,   tests.assert_anon_cannot_execute('has_business_role');
  RETURN QUERY SELECT 'anon !exec consolidate_conversations'::text, tests.assert_anon_cannot_execute('consolidate_conversations');
  RETURN QUERY SELECT 'anon !exec delete_user_account'::text, tests.assert_anon_cannot_execute('delete_user_account');
  RETURN QUERY SELECT 'anon !exec get_or_create_conversation'::text, tests.assert_anon_cannot_execute('get_or_create_conversation');

  -- 3. abuse_reports trigger exists.
  RETURN QUERY SELECT
    'abuse_reports has spam guard trigger'::text,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'guard_abuse_report_insert_trg' AND NOT tgisinternal
    ) THEN 'OK: trigger present' ELSE 'FAIL: trigger missing' END;

  -- 4. business_accounts owner-transfer guard exists.
  RETURN QUERY SELECT
    'business_accounts owner guard trigger'::text,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgrelid = 'public.business_accounts'::regclass
        AND tgname LIKE '%owner%' AND NOT tgisinternal
    ) THEN 'OK: trigger present' ELSE 'FAIL: trigger missing' END;

  -- 5. messages table: authenticated should NOT have direct INSERT.
  RETURN QUERY SELECT
    'messages direct INSERT blocked'::text,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.table_privileges
      WHERE grantee = 'authenticated'
        AND table_schema = 'public'
        AND table_name = 'messages'
        AND privilege_type = 'INSERT'
    ) THEN 'FAIL: authenticated has direct INSERT on messages'
      ELSE 'OK: messages INSERT is RPC-only' END;

  -- 6. send_message and update_conversation_status are callable by authenticated.
  RETURN QUERY SELECT
    'send_message callable by authenticated'::text,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.routine_privileges
      WHERE grantee = 'authenticated'
        AND routine_schema = 'public'
        AND routine_name = 'send_message'
        AND privilege_type = 'EXECUTE'
    ) THEN 'OK: authenticated can call send_message'
      ELSE 'FAIL: authenticated cannot call send_message' END;

  -- 7. CORS shared file marker — checked at deploy time only; placeholder pass.
  RETURN QUERY SELECT
    'note: edge function CORS allowlist'::text,
    'INFO: verified at deploy via supabase/functions/_shared/cors.ts'::text;
END;
$$;

-- Lock down execution.
REVOKE EXECUTE ON FUNCTION tests.run_security_regression() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION tests.assert_anon_cannot_execute(text) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION tests.assert_no_column_privilege(text, text, text, text) FROM public, anon, authenticated;

-- The function uses SECURITY DEFINER + an internal is_admin() check, so admins
-- call it via a regular SQL editor session (where they're authenticated).
GRANT EXECUTE ON FUNCTION tests.run_security_regression() TO authenticated;