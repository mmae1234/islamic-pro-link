-- Create a security definer function to check if users have a relationship
-- (conversation, mentorship, or are the same user)
CREATE OR REPLACE FUNCTION public.can_view_profile(_viewer_id uuid, _profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Can always view own profile
    _viewer_id = _profile_user_id
    OR
    -- Can view profiles of users in conversations
    EXISTS (
      SELECT 1 FROM conversations
      WHERE (user_a = _viewer_id AND user_b = _profile_user_id)
         OR (user_a = _profile_user_id AND user_b = _viewer_id)
    )
    OR
    -- Can view profiles of mentorship connections
    EXISTS (
      SELECT 1 FROM mentorship_requests
      WHERE (mentor_id = _viewer_id AND mentee_id = _profile_user_id)
         OR (mentor_id = _profile_user_id AND mentee_id = _viewer_id)
    )
    OR
    -- Can view profiles of users in same business team
    EXISTS (
      SELECT 1 FROM business_members bm1
      JOIN business_members bm2 ON bm1.business_id = bm2.business_id
      WHERE bm1.user_id = _viewer_id AND bm2.user_id = _profile_user_id
    )
    OR
    -- Can view profiles linked to businesses you own/manage
    EXISTS (
      SELECT 1 FROM professional_business_links pbl
      JOIN business_accounts ba ON pbl.business_id = ba.id
      WHERE pbl.professional_user_id = _profile_user_id
        AND (ba.owner_id = _viewer_id OR EXISTS (
          SELECT 1 FROM business_members WHERE business_id = ba.id AND user_id = _viewer_id
        ))
    )
$$;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- Create a more restrictive policy that only allows viewing related profiles
CREATE POLICY "Users can view related profiles"
ON public.profiles
FOR SELECT
USING (
  public.can_view_profile(auth.uid(), user_id)
);