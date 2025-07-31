-- Add columns for message actions
ALTER TABLE public.messages ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.messages ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.messages ADD COLUMN reported_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.messages ADD COLUMN report_reason TEXT;

-- Create a function to properly delete user account
CREATE OR REPLACE FUNCTION public.delete_user_account(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Delete user data from all related tables
  DELETE FROM public.mentorship_sessions 
  WHERE request_id IN (
    SELECT id FROM public.mentorship_requests 
    WHERE mentor_id = user_id_param OR mentee_id = user_id_param
  );
  
  DELETE FROM public.mentorship_requests 
  WHERE mentor_id = user_id_param OR mentee_id = user_id_param;
  
  DELETE FROM public.messages 
  WHERE sender_id = user_id_param OR recipient_id = user_id_param;
  
  DELETE FROM public.favorites 
  WHERE user_id = user_id_param;
  
  DELETE FROM public.professional_profiles 
  WHERE user_id = user_id_param;
  
  DELETE FROM public.profiles 
  WHERE user_id = user_id_param;
  
  -- Delete from auth.users (this requires service role permissions)
  DELETE FROM auth.users WHERE id = user_id_param;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Create RLS policies for message actions
CREATE POLICY "Users can update message status for their own messages" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Create indexes for better performance on new columns
CREATE INDEX idx_messages_deleted_at ON public.messages(deleted_at);
CREATE INDEX idx_messages_archived_at ON public.messages(archived_at);
CREATE INDEX idx_messages_reported_at ON public.messages(reported_at);