-- Create helper functions that are called by RLS policies
-- These are non-SECURITY DEFINER versions that can be used in RLS policies without bypassing them

CREATE OR REPLACE FUNCTION public.is_business_owner(_user_id uuid, _business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM business_accounts 
    WHERE id = _business_id AND owner_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_business_team_member(_user_id uuid, _business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT is_business_owner(_user_id, _business_id)
     OR EXISTS (
       SELECT 1 FROM business_members 
       WHERE business_id = _business_id AND user_id = _user_id
     );
$$;

CREATE OR REPLACE FUNCTION public.has_business_role(_user_id uuid, _business_id uuid, _roles business_member_role[])
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT is_business_owner(_user_id, _business_id)
     OR EXISTS (
       SELECT 1 FROM business_members 
       WHERE business_id = _business_id 
         AND user_id = _user_id 
         AND role = ANY(_roles)
     );
$$;