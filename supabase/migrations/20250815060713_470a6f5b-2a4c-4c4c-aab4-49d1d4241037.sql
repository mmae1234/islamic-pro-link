-- Create messaging privacy enum
CREATE TYPE public.messaging_privacy AS ENUM ('open', 'mentorship_only', 'closed');

-- Create conversation status enum
CREATE TYPE public.conversation_status AS ENUM ('request', 'active', 'blocked');

-- Add messaging_privacy to profiles table
ALTER TABLE public.profiles 
ADD COLUMN messaging_privacy messaging_privacy NOT NULL DEFAULT 'closed';

-- Create conversations table
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_a uuid NOT NULL,
  user_b uuid NOT NULL,
  status conversation_status NOT NULL DEFAULT 'request',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_a, user_b)
);

-- Enable RLS on conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for conversations
CREATE POLICY "Users can view their own conversations" 
ON public.conversations 
FOR SELECT 
USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "Users can create conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "Users can update their own conversations" 
ON public.conversations 
FOR UPDATE 
USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Add conversation_id to messages table
ALTER TABLE public.messages 
ADD COLUMN conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE;

-- Create abuse_reports table
CREATE TABLE public.abuse_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid NOT NULL,
  accused_id uuid NOT NULL,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  reason text NOT NULL,
  details text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on abuse_reports
ALTER TABLE public.abuse_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for abuse_reports
CREATE POLICY "Users can create their own reports" 
ON public.abuse_reports 
FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" 
ON public.abuse_reports 
FOR SELECT 
USING (auth.uid() = reporter_id);

-- Create user_message_limits table for rate limiting
CREATE TABLE public.user_message_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  requests_sent integer NOT NULL DEFAULT 0,
  requests_declined integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS on user_message_limits
ALTER TABLE public.user_message_limits ENABLE ROW LEVEL SECURITY;

-- Create policies for user_message_limits
CREATE POLICY "Users can view their own message limits" 
ON public.user_message_limits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own message limits" 
ON public.user_message_limits 
FOR ALL 
USING (auth.uid() = user_id);

-- Create trigger for updating conversations updated_at
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updating user_message_limits updated_at
CREATE TRIGGER update_user_message_limits_updated_at
  BEFORE UPDATE ON public.user_message_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill messaging_privacy based on mentorship status
UPDATE public.profiles 
SET messaging_privacy = 'mentorship_only'
WHERE user_id IN (
  SELECT DISTINCT user_id 
  FROM public.professional_profiles 
  WHERE is_mentor = true OR is_seeking_mentor = true
);

-- Function to get or create conversation
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  user_a_param uuid,
  user_b_param uuid
) RETURNS uuid AS $$
DECLARE
  conversation_id uuid;
  ordered_user_a uuid;
  ordered_user_b uuid;
BEGIN
  -- Order users consistently (smaller UUID first)
  IF user_a_param < user_b_param THEN
    ordered_user_a := user_a_param;
    ordered_user_b := user_b_param;
  ELSE
    ordered_user_a := user_b_param;
    ordered_user_b := user_a_param;
  END IF;
  
  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM public.conversations
  WHERE user_a = ordered_user_a AND user_b = ordered_user_b;
  
  -- If not found, create new conversation
  IF conversation_id IS NULL THEN
    INSERT INTO public.conversations (user_a, user_b, status)
    VALUES (ordered_user_a, ordered_user_b, 'request')
    RETURNING id INTO conversation_id;
  END IF;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;