-- Update mentorship_requests status constraint to include 'disconnected'
ALTER TABLE mentorship_requests DROP CONSTRAINT mentorship_requests_status_check;
ALTER TABLE mentorship_requests ADD CONSTRAINT mentorship_requests_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text, 'completed'::text, 'cancelled'::text, 'disconnected'::text]));