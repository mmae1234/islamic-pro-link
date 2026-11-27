-- =====================================================================
-- Invite a colleague: every member gets a personal link
-- (muslimprosnet.com/join/<code>). New members who sign up through it are
-- credited to the inviter; the inviter sees how many joined.
-- =====================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS invite_code text,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_invite_code_key ON public.profiles (invite_code);

-- Members can't write these columns directly (RPCs below only).
CREATE OR REPLACE FUNCTION public.guard_invite_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND current_setting('app.invite_rpc', true) IS DISTINCT FROM 'on' THEN
    NEW.invite_code := OLD.invite_code;
    NEW.referred_by := OLD.referred_by;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.guard_invite_columns() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_invite_columns_trg ON public.profiles;
CREATE TRIGGER guard_invite_columns_trg
  BEFORE UPDATE OF invite_code, referred_by ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_invite_columns();

-- My invite link code (created on first use) and how many joined with it.
CREATE OR REPLACE FUNCTION public.get_my_invite()
RETURNS TABLE (code text, joined integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _code text;
  _try int := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT p.invite_code INTO _code FROM public.profiles p WHERE p.user_id = auth.uid();
  WHILE _code IS NULL AND _try < 5 LOOP
    _try := _try + 1;
    BEGIN
      PERFORM set_config('app.invite_rpc', 'on', true);
      UPDATE public.profiles
      SET invite_code = lower(substr(translate(encode(gen_random_bytes(8), 'base64'), '+/=', ''), 1, 8))
      WHERE user_id = auth.uid()
      RETURNING invite_code INTO _code;
      PERFORM set_config('app.invite_rpc', 'off', true);
    EXCEPTION WHEN unique_violation THEN _code := NULL;
    END;
  END LOOP;
  RETURN QUERY SELECT _code, (SELECT count(*)::int FROM public.profiles r WHERE r.referred_by = auth.uid());
END;
$$;

-- Called once by a new member's browser after sign-up with the code they
-- arrived with. Only for accounts created in the last 14 days, never self,
-- and only once.
CREATE OR REPLACE FUNCTION public.claim_invite(_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _inviter uuid;
BEGIN
  IF auth.uid() IS NULL OR _code IS NULL OR length(_code) > 32 THEN RETURN false; END IF;
  SELECT p.user_id INTO _inviter FROM public.profiles p WHERE p.invite_code = lower(btrim(_code));
  IF _inviter IS NULL OR _inviter = auth.uid() THEN RETURN false; END IF;
  PERFORM set_config('app.invite_rpc', 'on', true);
  UPDATE public.profiles
  SET referred_by = _inviter
  WHERE user_id = auth.uid() AND referred_by IS NULL AND created_at > now() - interval '14 days';
  PERFORM set_config('app.invite_rpc', 'off', true);
  RETURN FOUND;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_invite() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_invite() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.claim_invite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_invite(text) TO authenticated;

NOTIFY pgrst, 'reload schema';
