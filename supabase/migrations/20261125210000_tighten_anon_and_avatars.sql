-- =====================================================================
-- Defense in depth (review items "anon write permission" + "avatar listing")
--
-- 1. Signed-out visitors (anon) had INSERT/UPDATE/DELETE/TRUNCATE on every
--    public table; RLS blocked them, but the grants were a needless second
--    door. The only legitimate signed-out write is the signup funnel event
--    (Signup.tsx inserts into signup_events before the account exists).
-- 2. The avatars bucket let anyone LIST every uploaded file. Photos are
--    served through public URLs (public bucket), which do not need a SELECT
--    policy, so listing is limited to a user's own folder (needed for
--    upsert/remove of their own photo).
-- =====================================================================

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon;
GRANT INSERT ON public.signup_events TO anon;

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own avatar files" ON storage.objects;
CREATE POLICY "Users can read their own avatar files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
