-- Enable RLS and restrict access on business_directory_internal
ALTER TABLE public.business_directory_internal ENABLE ROW LEVEL SECURITY;

-- Allow only authenticated users to read internal business directory
CREATE POLICY "Authenticated users can view internal business directory"
ON public.business_directory_internal
FOR SELECT
USING (auth.uid() IS NOT NULL);
