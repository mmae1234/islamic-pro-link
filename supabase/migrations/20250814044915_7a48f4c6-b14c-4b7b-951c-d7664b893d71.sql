-- Fix infinite recursion in RLS policies by creating security definer functions
-- that bypass RLS when checking business relationships

-- Drop existing problematic functions with CASCADE to remove dependent policies
DROP FUNCTION IF EXISTS public.is_business_owner(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_business_team_member(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.has_business_role(uuid, uuid, business_member_role[]) CASCADE;

-- Drop all existing policies that might conflict
DROP POLICY IF EXISTS "Owners can view their business accounts" ON public.business_accounts;
DROP POLICY IF EXISTS "Team members can view business accounts" ON public.business_accounts;
DROP POLICY IF EXISTS "Approved partners can view contact info" ON public.business_accounts;
DROP POLICY IF EXISTS "Owners can insert their business account" ON public.business_accounts;
DROP POLICY IF EXISTS "Owners can update their business accounts" ON public.business_accounts;
DROP POLICY IF EXISTS "Admins can update business accounts" ON public.business_accounts;
DROP POLICY IF EXISTS "Owners can delete their business accounts" ON public.business_accounts;

-- Create new security definer functions that bypass RLS
CREATE OR REPLACE FUNCTION public.is_business_owner_safe(_user_id uuid, _business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- This function bypasses RLS by using security definer
  SELECT EXISTS (
    SELECT 1 FROM business_accounts 
    WHERE id = _business_id AND owner_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_business_team_member_safe(_user_id uuid, _business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- This function bypasses RLS by using security definer
  SELECT is_business_owner_safe(_user_id, _business_id)
     OR EXISTS (
       SELECT 1 FROM business_members 
       WHERE business_id = _business_id AND user_id = _user_id
     );
$$;

CREATE OR REPLACE FUNCTION public.has_business_role_safe(_user_id uuid, _business_id uuid, _roles business_member_role[])
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- This function bypasses RLS by using security definer
  SELECT is_business_owner_safe(_user_id, _business_id)
     OR EXISTS (
       SELECT 1 FROM business_members 
       WHERE business_id = _business_id 
         AND user_id = _user_id 
         AND role = ANY(_roles)
     );
$$;

-- Recreate Business Accounts policies with safe functions
CREATE POLICY "Owners can view their business accounts" 
ON public.business_accounts 
FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Team members can view business accounts" 
ON public.business_accounts 
FOR SELECT 
USING (is_business_team_member_safe(auth.uid(), id));

CREATE POLICY "Approved partners can view contact info" 
ON public.business_accounts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM professional_business_links pbl
    WHERE pbl.business_id = id 
      AND pbl.professional_user_id = auth.uid() 
      AND pbl.status = 'approved'::link_status
  )
);

CREATE POLICY "Owners can insert their business account" 
ON public.business_accounts 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their business accounts" 
ON public.business_accounts 
FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Admins can update business accounts" 
ON public.business_accounts 
FOR UPDATE 
USING (has_business_role_safe(auth.uid(), id, ARRAY['admin'::business_member_role]));

CREATE POLICY "Owners can delete their business accounts" 
ON public.business_accounts 
FOR DELETE 
USING (auth.uid() = owner_id);