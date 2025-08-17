-- Create blocked_users table for user blocking functionality
CREATE TABLE public.blocked_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Enable RLS
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Create policies for blocked_users
CREATE POLICY "Users can view their blocked list" 
ON public.blocked_users 
FOR SELECT 
USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block other users" 
ON public.blocked_users 
FOR INSERT 
WITH CHECK (auth.uid() = blocker_id AND blocker_id != blocked_id);

CREATE POLICY "Users can unblock other users" 
ON public.blocked_users 
FOR DELETE 
USING (auth.uid() = blocker_id);

-- Add index for performance
CREATE INDEX idx_blocked_users_blocker_id ON public.blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked_id ON public.blocked_users(blocked_id);