-- =====================================================================
-- Work-email verification: a member proves they have an address at their
-- employer's domain (6-digit code by email) and gets a "Verified at
-- <domain>" badge. Free webmail domains are refused by the sender function.
--   * work_email_codes: pending code (hash only), written by the
--     verify-work-email edge function (service role)
--   * confirm_work_email(code): checks the hash (5 tries, 15 minutes) and
--     sets professional_profiles.verified_work_domain
-- =====================================================================
ALTER TABLE public.professional_profiles
  ADD COLUMN IF NOT EXISTS verified_work_domain text,
  ADD COLUMN IF NOT EXISTS verified_work_at timestamptz;

CREATE TABLE IF NOT EXISTS public.work_email_codes (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  domain text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  sends_window_start timestamptz NOT NULL DEFAULT now(),
  sends_in_window integer NOT NULL DEFAULT 1
);
ALTER TABLE public.work_email_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.work_email_codes FROM anon, authenticated;

-- Members can't set the badge themselves.
CREATE OR REPLACE FUNCTION public.guard_work_domain()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND current_setting('app.work_email_rpc', true) IS DISTINCT FROM 'on'
     AND NOT public.is_admin(auth.uid()) THEN
    IF TG_OP = 'INSERT' THEN
      NEW.verified_work_domain := NULL;
      NEW.verified_work_at := NULL;
    ELSE
      NEW.verified_work_domain := OLD.verified_work_domain;
      NEW.verified_work_at := OLD.verified_work_at;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.guard_work_domain() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_work_domain_trg ON public.professional_profiles;
CREATE TRIGGER guard_work_domain_trg
  BEFORE INSERT OR UPDATE ON public.professional_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_work_domain();

CREATE OR REPLACE FUNCTION public.confirm_work_email(_code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _row public.work_email_codes;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO _row FROM public.work_email_codes WHERE user_id = auth.uid() FOR UPDATE;
  IF _row IS NULL THEN RAISE EXCEPTION 'Request a new code first'; END IF;
  IF _row.expires_at < now() THEN RAISE EXCEPTION 'That code has expired. Request a new one.'; END IF;
  IF _row.attempts >= 5 THEN RAISE EXCEPTION 'Too many tries. Request a new code.'; END IF;
  IF encode(extensions.digest(btrim(coalesce(_code, '')) || ':' || auth.uid()::text, 'sha256'), 'hex') <> _row.code_hash THEN
    UPDATE public.work_email_codes SET attempts = attempts + 1 WHERE user_id = auth.uid();
    RETURN NULL;
  END IF;
  PERFORM set_config('app.work_email_rpc', 'on', true);
  UPDATE public.professional_profiles
  SET verified_work_domain = _row.domain, verified_work_at = now()
  WHERE user_id = auth.uid();
  PERFORM set_config('app.work_email_rpc', 'off', true);
  DELETE FROM public.work_email_codes WHERE user_id = auth.uid();
  RETURN _row.domain;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.confirm_work_email(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_work_email(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.remove_work_verification()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  PERFORM set_config('app.work_email_rpc', 'on', true);
  UPDATE public.professional_profiles SET verified_work_domain = NULL, verified_work_at = NULL WHERE user_id = auth.uid();
  PERFORM set_config('app.work_email_rpc', 'off', true);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.remove_work_verification() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_work_verification() TO authenticated;

NOTIFY pgrst, 'reload schema';
