-- Fix foreign key relationships for favorites and mentorship_requests
ALTER TABLE public.favorites 
DROP CONSTRAINT IF EXISTS favorites_professional_id_fkey;

ALTER TABLE public.favorites 
ADD CONSTRAINT favorites_professional_id_fkey 
FOREIGN KEY (professional_id) REFERENCES public.professional_profiles(user_id);

-- Also ensure mentorship_requests has proper foreign keys
ALTER TABLE public.mentorship_requests 
DROP CONSTRAINT IF EXISTS mentorship_requests_mentor_id_fkey;

ALTER TABLE public.mentorship_requests 
ADD CONSTRAINT mentorship_requests_mentor_id_fkey 
FOREIGN KEY (mentor_id) REFERENCES public.professional_profiles(user_id);

ALTER TABLE public.mentorship_requests 
DROP CONSTRAINT IF EXISTS mentorship_requests_mentee_id_fkey;

ALTER TABLE public.mentorship_requests 
ADD CONSTRAINT mentorship_requests_mentee_id_fkey 
FOREIGN KEY (mentee_id) REFERENCES public.professional_profiles(user_id);