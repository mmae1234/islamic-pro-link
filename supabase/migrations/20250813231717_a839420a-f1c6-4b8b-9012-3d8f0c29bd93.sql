-- Fix security issue: Remove public access to profiles table
-- Replace with authenticated-only access while preserving guest functionality

-- 1. Drop the overly permissive policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anonymous users can view basic profiles" ON public.profiles;

-- 2. Create secure policies for profiles table
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 3. Create a secure function for guest access to limited profile data
CREATE OR REPLACE FUNCTION public.get_guest_profiles()
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  avatar_url text
) 
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  -- Only return minimal profile data for guests, limited to specific profiles
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.avatar_url
  FROM public.profiles p
  WHERE p.id IN (
    SELECT unnest(public.get_guest_viewable_profile_ids())
  )
  LIMIT 2;
$function$;