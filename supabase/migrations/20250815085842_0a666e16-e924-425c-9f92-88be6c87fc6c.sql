-- Fix the foreign key relationships for conversations table
ALTER TABLE conversations
ADD CONSTRAINT conversations_user_a_fkey 
FOREIGN KEY (user_a) REFERENCES profiles(user_id);

ALTER TABLE conversations
ADD CONSTRAINT conversations_user_b_fkey 
FOREIGN KEY (user_b) REFERENCES profiles(user_id);