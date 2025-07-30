-- Create mentorship requests table
CREATE TABLE public.mentorship_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES public.profiles(user_id),
  mentee_id UUID NOT NULL REFERENCES public.profiles(user_id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  message TEXT,
  skills_requested TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mentor_id, mentee_id)
);

-- Create mentorship sessions table
CREATE TABLE public.mentorship_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.mentorship_requests(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT,
  meeting_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table for communication
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(user_id),
  recipient_id UUID NOT NULL REFERENCES public.profiles(user_id),
  request_id UUID REFERENCES public.mentorship_requests(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for mentorship_requests
CREATE POLICY "Users can view their own mentorship requests"
ON public.mentorship_requests
FOR SELECT
USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);

CREATE POLICY "Users can create mentorship requests as mentee"
ON public.mentorship_requests
FOR INSERT
WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "Users can update their own mentorship requests"
ON public.mentorship_requests
FOR UPDATE
USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);

-- RLS policies for mentorship_sessions
CREATE POLICY "Users can view sessions for their requests"
ON public.mentorship_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.mentorship_requests 
    WHERE id = request_id 
    AND (mentor_id = auth.uid() OR mentee_id = auth.uid())
  )
);

CREATE POLICY "Users can create sessions for accepted requests"
ON public.mentorship_sessions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.mentorship_requests 
    WHERE id = request_id 
    AND status = 'accepted'
    AND (mentor_id = auth.uid() OR mentee_id = auth.uid())
  )
);

CREATE POLICY "Users can update sessions for their requests"
ON public.mentorship_sessions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.mentorship_requests 
    WHERE id = request_id 
    AND (mentor_id = auth.uid() OR mentee_id = auth.uid())
  )
);

-- RLS policies for messages
CREATE POLICY "Users can view their own messages"
ON public.messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update read status of received messages"
ON public.messages
FOR UPDATE
USING (auth.uid() = recipient_id);

-- Add updated_at triggers
CREATE TRIGGER update_mentorship_requests_updated_at
BEFORE UPDATE ON public.mentorship_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentorship_sessions_updated_at
BEFORE UPDATE ON public.mentorship_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add skills and availability to professional_profiles
ALTER TABLE public.professional_profiles 
ADD COLUMN skills TEXT[],
ADD COLUMN availability TEXT,
ADD COLUMN is_mentor BOOLEAN DEFAULT false,
ADD COLUMN is_seeking_mentor BOOLEAN DEFAULT false,
ADD COLUMN preferred_communication TEXT[] DEFAULT ARRAY['in_app_messaging'];

-- Create indexes for better performance
CREATE INDEX idx_mentorship_requests_mentor_id ON public.mentorship_requests(mentor_id);
CREATE INDEX idx_mentorship_requests_mentee_id ON public.mentorship_requests(mentee_id);
CREATE INDEX idx_mentorship_requests_status ON public.mentorship_requests(status);
CREATE INDEX idx_messages_sender_recipient ON public.messages(sender_id, recipient_id);
CREATE INDEX idx_messages_request_id ON public.messages(request_id);
CREATE INDEX idx_professional_profiles_skills ON public.professional_profiles USING GIN(skills);
CREATE INDEX idx_professional_profiles_mentor ON public.professional_profiles(is_mentor) WHERE is_mentor = true;