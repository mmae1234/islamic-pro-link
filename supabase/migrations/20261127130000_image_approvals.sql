-- =====================================================================
-- Profile photos / logos: server-enforced content check (part 1 of 2)
--
-- Before: the explicit-image check ran only inside the upload button. Anyone
-- could upload straight to storage, point avatar_url at any outside URL, or
-- overwrite an approved file (every photo was <uid>/avatar.jpg, upsert).
--
-- Part 1 (safe to apply before the site update):
--   * image_approvals: one row per checked file, tied to the storage object
--     id, written only by the moderate-image function (service role)
--   * avatars bucket: images only (jpeg/png/webp/gif), max 5 MB
-- Part 2 (20261127131000, after Publish): files become immutable and
-- photo/logo fields only accept checked files.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.image_approvals (
  path text PRIMARY KEY,
  object_id uuid NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approved_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.image_approvals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.image_approvals FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.record_image_approval(_path text, _owner uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'storage'
AS $$
DECLARE
  _obj uuid;
BEGIN
  IF _path IS NULL OR _owner IS NULL OR split_part(_path, '/', 1) <> _owner::text THEN
    RAISE EXCEPTION 'Path must be in the owner''s folder';
  END IF;
  SELECT o.id INTO _obj FROM storage.objects o WHERE o.bucket_id = 'avatars' AND o.name = _path;
  IF _obj IS NULL THEN
    RAISE EXCEPTION 'File not found';
  END IF;
  INSERT INTO public.image_approvals (path, object_id, owner_id)
  VALUES (_path, _obj, _owner)
  ON CONFLICT (path) DO UPDATE SET object_id = EXCLUDED.object_id, owner_id = EXCLUDED.owner_id, approved_at = now();
END;
$$;
REVOKE EXECUTE ON FUNCTION public.record_image_approval(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_image_approval(text, uuid) TO service_role;

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    file_size_limit = 5242880
WHERE id = 'avatars';
