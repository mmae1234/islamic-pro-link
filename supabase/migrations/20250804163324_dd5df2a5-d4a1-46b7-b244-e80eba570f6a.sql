-- Fix mentorship_requests status constraint to include 'cancelled'
ALTER TABLE mentorship_requests DROP CONSTRAINT mentorship_requests_status_check;
ALTER TABLE mentorship_requests ADD CONSTRAINT mentorship_requests_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text, 'completed'::text, 'cancelled'::text]));

-- Create profile_views table for tracking profile views
CREATE TABLE public.profile_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  viewer_id UUID, -- Can be null for anonymous views
  viewed_profile_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET, -- For tracking unique anonymous views
  user_agent TEXT -- For additional uniqueness tracking
);

-- Enable RLS for profile_views
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Create policies for profile_views
CREATE POLICY "Users can view their own profile views" 
ON public.profile_views 
FOR SELECT 
USING (viewed_profile_id = auth.uid());

CREATE POLICY "Anyone can insert profile views" 
ON public.profile_views 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_profile_views_viewed_profile_id ON public.profile_views(viewed_profile_id);
CREATE INDEX idx_profile_views_viewer_viewed ON public.profile_views(viewer_id, viewed_profile_id);
CREATE INDEX idx_profile_views_ip_viewed ON public.profile_views(ip_address, viewed_profile_id);