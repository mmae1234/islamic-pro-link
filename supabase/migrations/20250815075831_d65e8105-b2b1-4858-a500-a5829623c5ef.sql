-- Create a function to consolidate conversations
CREATE OR REPLACE FUNCTION consolidate_conversations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  msg_record record;
  conv_id uuid;
BEGIN
  -- For each unique pair of users that have exchanged messages
  FOR msg_record IN
    SELECT DISTINCT
      LEAST(sender_id, recipient_id) as user_a,
      GREATEST(sender_id, recipient_id) as user_b
    FROM messages
    WHERE messages.conversation_id IS NULL
  LOOP
    -- Get or create conversation for this pair
    SELECT get_or_create_conversation(msg_record.user_a, msg_record.user_b) INTO conv_id;
    
    -- Update all messages between these users to use this conversation
    UPDATE messages 
    SET conversation_id = conv_id
    WHERE messages.conversation_id IS NULL
      AND ((sender_id = msg_record.user_a AND recipient_id = msg_record.user_b)
           OR (sender_id = msg_record.user_b AND recipient_id = msg_record.user_a));
  END LOOP;
END;
$$;

-- Run the consolidation
SELECT consolidate_conversations();

-- Add a trigger to automatically assign conversation_id to new messages
CREATE OR REPLACE FUNCTION assign_conversation_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only assign if conversation_id is not already set
  IF NEW.conversation_id IS NULL THEN
    NEW.conversation_id := get_or_create_conversation(NEW.sender_id, NEW.recipient_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS assign_conversation_id_trigger ON messages;
CREATE TRIGGER assign_conversation_id_trigger
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION assign_conversation_id();