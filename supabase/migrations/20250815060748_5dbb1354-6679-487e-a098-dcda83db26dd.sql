-- Fix function search path for security
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';