-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view all professional profiles" ON public.professional_profiles;

-- Create a more restrictive policy that only allows viewing related profiles
-- Uses the same can_view_profile function we created earlier
CREATE POLICY "Users can view related professional profiles"
ON public.professional_profiles
FOR SELECT
USING (
  public.can_view_profile(auth.uid(), user_id)
);