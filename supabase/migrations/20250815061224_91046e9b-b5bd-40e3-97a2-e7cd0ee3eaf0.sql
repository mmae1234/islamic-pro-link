-- Create helper function for rate limiting
CREATE OR REPLACE FUNCTION public.check_message_rate_limit(user_id_param uuid)
RETURNS boolean AS $$
DECLARE
  rate_limits record;
BEGIN
  -- Get today's rate limits
  SELECT requests_sent, requests_declined INTO rate_limits
  FROM public.user_message_limits
  WHERE user_id = user_id_param AND date = CURRENT_DATE;
  
  -- Check if user has exceeded daily limit (10 requests)
  IF rate_limits.requests_sent >= 10 THEN
    RETURN false;
  END IF;
  
  -- Check if user has been declined too many times (3 declines = throttle)
  IF rate_limits.requests_declined >= 3 THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create function to check if users have active mentorship
CREATE OR REPLACE FUNCTION public.has_active_mentorship(user_a_param uuid, user_b_param uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if users have an accepted mentorship request between them
  RETURN EXISTS (
    SELECT 1 FROM public.mentorship_requests
    WHERE status = 'accepted'
    AND (
      (mentor_id = user_a_param AND mentee_id = user_b_param) OR
      (mentor_id = user_b_param AND mentee_id = user_a_param)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create function to check messaging permissions
CREATE OR REPLACE FUNCTION public.can_send_message(sender_id_param uuid, recipient_id_param uuid)
RETURNS text AS $$
DECLARE
  recipient_privacy text;
  existing_conv record;
  has_mentorship boolean;
BEGIN
  -- Get recipient's messaging privacy setting
  SELECT messaging_privacy INTO recipient_privacy
  FROM public.profiles
  WHERE user_id = recipient_id_param;
  
  -- Check for existing conversation
  SELECT id, status INTO existing_conv
  FROM public.conversations
  WHERE (user_a = sender_id_param AND user_b = recipient_id_param)
     OR (user_a = recipient_id_param AND user_b = sender_id_param);
  
  -- If conversation is blocked, deny
  IF existing_conv.status = 'blocked' THEN
    RETURN 'blocked';
  END IF;
  
  -- If conversation is active, allow
  IF existing_conv.status = 'active' THEN
    RETURN 'allowed';
  END IF;
  
  -- If privacy is closed and no existing conversation, deny
  IF recipient_privacy = 'closed' AND existing_conv.id IS NULL THEN
    RETURN 'closed';
  END IF;
  
  -- If privacy is mentorship_only, check for active mentorship
  IF recipient_privacy = 'mentorship_only' THEN
    SELECT public.has_active_mentorship(sender_id_param, recipient_id_param) INTO has_mentorship;
    IF has_mentorship THEN
      RETURN 'allowed';
    ELSE
      RETURN 'request';
    END IF;
  END IF;
  
  -- If privacy is open, allow as request
  IF recipient_privacy = 'open' THEN
    RETURN 'request';
  END IF;
  
  -- Default to request
  RETURN 'request';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';