-- =====================================================================
-- Profile photos / logos: server-enforced content check (part 2 of 2)
-- Apply AFTER the site update (new upload names + moderate-image recording
-- approvals) is published.
--   * Uploaded files can't be overwritten (no UPDATE on avatars objects);
--     a re-upload to the same name after delete gets a new object id, which
--     has no approval.
--   * profiles.avatar_url, professional_profiles.avatar_url and
--     business_accounts.logo_url / cover_url only accept a file in the
--     user's own folder of the avatars bucket that passed the check and is
--     unchanged since. Clearing a photo is always allowed. Existing photos
--     are untouched until changed. Admins and server jobs are exempt.
-- =====================================================================

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;

CREATE OR REPLACE FUNCTION public.image_is_approved(_url text, _owner uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'storage'
AS $$
  WITH p AS (
    SELECT substring(_url FROM '^https://zhtfygjxnyxqsmeoipst\.supabase\.co/storage/v1/object/public/avatars/([^?#]+)$') AS path
  )
  SELECT EXISTS (
    SELECT 1
    FROM p
    JOIN public.image_approvals a ON a.path = p.path
    JOIN storage.objects o ON o.bucket_id = 'avatars' AND o.name = a.path AND o.id = a.object_id
    WHERE p.path IS NOT NULL
      AND split_part(p.path, '/', 1) = _owner::text
      AND a.owner_id = _owner
  );
$$;
REVOKE EXECUTE ON FUNCTION public.image_is_approved(text, uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.require_approved_image()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _owner uuid;
  _col text;
  _old text;
  _new text;
BEGIN
  IF auth.uid() IS NULL OR public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  _owner := auth.uid();
  FOREACH _col IN ARRAY TG_ARGV LOOP
    _new := to_jsonb(NEW) ->> _col;
    _old := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ->> _col END;
    IF _new IS NOT NULL AND _new <> '' AND _new IS DISTINCT FROM _old
       AND NOT public.image_is_approved(_new, _owner) THEN
      RAISE EXCEPTION 'Please upload the image with the upload button (it is checked before it is shown)';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.require_approved_image() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS require_approved_avatar ON public.profiles;
CREATE TRIGGER require_approved_avatar
  BEFORE INSERT OR UPDATE OF avatar_url ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.require_approved_image('avatar_url');

DROP TRIGGER IF EXISTS require_approved_avatar ON public.professional_profiles;
CREATE TRIGGER require_approved_avatar
  BEFORE INSERT OR UPDATE OF avatar_url ON public.professional_profiles
  FOR EACH ROW EXECUTE FUNCTION public.require_approved_image('avatar_url');

DROP TRIGGER IF EXISTS require_approved_logo ON public.business_accounts;
CREATE TRIGGER require_approved_logo
  BEFORE INSERT OR UPDATE OF logo_url, cover_url ON public.business_accounts
  FOR EACH ROW EXECUTE FUNCTION public.require_approved_image('logo_url', 'cover_url');
