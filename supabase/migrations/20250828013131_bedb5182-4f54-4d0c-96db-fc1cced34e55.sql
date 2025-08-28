-- Secure public business directory tables by enabling RLS and restricting access to authenticated users only

-- 1) business_directory
ALTER TABLE IF EXISTS public.business_directory ENABLE ROW LEVEL SECURITY;

-- Ensure idempotency
DROP POLICY IF EXISTS "Authenticated users can view business directory" ON public.business_directory;

CREATE POLICY "Authenticated users can view business directory"
ON public.business_directory
FOR SELECT
USING (auth.uid() IS NOT NULL);


-- 2) business_directory_internal
ALTER TABLE IF EXISTS public.business_directory_internal ENABLE ROW LEVEL SECURITY;

-- Ensure idempotency
DROP POLICY IF EXISTS "Authenticated users can view business directory internal" ON public.business_directory_internal;

CREATE POLICY "Authenticated users can view business directory internal"
ON public.business_directory_internal
FOR SELECT
USING (auth.uid() IS NOT NULL);
