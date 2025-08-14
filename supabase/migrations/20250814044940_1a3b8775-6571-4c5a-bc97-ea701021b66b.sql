-- Update remaining policies to use safe functions to prevent recursion

-- Drop and recreate business_members policies
DROP POLICY IF EXISTS "Team can view business members" ON public.business_members;
DROP POLICY IF EXISTS "Owner or admin can manage members" ON public.business_members;
DROP POLICY IF EXISTS "Owner or admin can update members" ON public.business_members;
DROP POLICY IF EXISTS "Owner or admin can delete members" ON public.business_members;

CREATE POLICY "Team can view business members" 
ON public.business_members 
FOR SELECT 
USING (is_business_team_member_safe(auth.uid(), business_id));

CREATE POLICY "Owner or admin can manage members" 
ON public.business_members 
FOR INSERT 
WITH CHECK (is_business_owner_safe(auth.uid(), business_id) OR has_business_role_safe(auth.uid(), business_id, ARRAY['admin'::business_member_role]));

CREATE POLICY "Owner or admin can update members" 
ON public.business_members 
FOR UPDATE 
USING (is_business_owner_safe(auth.uid(), business_id) OR has_business_role_safe(auth.uid(), business_id, ARRAY['admin'::business_member_role]))
WITH CHECK (is_business_owner_safe(auth.uid(), business_id) OR has_business_role_safe(auth.uid(), business_id, ARRAY['admin'::business_member_role]));

CREATE POLICY "Owner or admin can delete members" 
ON public.business_members 
FOR DELETE 
USING (is_business_owner_safe(auth.uid(), business_id) OR has_business_role_safe(auth.uid(), business_id, ARRAY['admin'::business_member_role]));

-- Drop and recreate professional_business_links policies
DROP POLICY IF EXISTS "Participants can view links" ON public.professional_business_links;
DROP POLICY IF EXISTS "Public can view approved links" ON public.professional_business_links;
DROP POLICY IF EXISTS "Professional or admin can create link" ON public.professional_business_links;
DROP POLICY IF EXISTS "Admin or professional can update link" ON public.professional_business_links;
DROP POLICY IF EXISTS "Either party can delete link" ON public.professional_business_links;

CREATE POLICY "Participants can view links" 
ON public.professional_business_links 
FOR SELECT 
USING ((auth.uid() = professional_user_id) OR is_business_team_member_safe(auth.uid(), business_id));

CREATE POLICY "Public can view approved links" 
ON public.professional_business_links 
FOR SELECT 
USING (status = 'approved'::link_status);

CREATE POLICY "Professional or admin can create link" 
ON public.professional_business_links 
FOR INSERT 
WITH CHECK ((auth.uid() = professional_user_id) OR has_business_role_safe(auth.uid(), business_id, ARRAY['admin'::business_member_role]));

CREATE POLICY "Admin or professional can update link" 
ON public.professional_business_links 
FOR UPDATE 
USING ((auth.uid() = professional_user_id) OR has_business_role_safe(auth.uid(), business_id, ARRAY['admin'::business_member_role]))
WITH CHECK ((auth.uid() = professional_user_id) OR has_business_role_safe(auth.uid(), business_id, ARRAY['admin'::business_member_role]));

CREATE POLICY "Either party can delete link" 
ON public.professional_business_links 
FOR DELETE 
USING ((auth.uid() = professional_user_id) OR is_business_team_member_safe(auth.uid(), business_id));