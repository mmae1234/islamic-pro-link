-- Add RLS policy to allow users to delete their own conversations
CREATE POLICY "Users can delete their own conversations" 
ON public.conversations 
FOR DELETE 
USING ((auth.uid() = user_a) OR (auth.uid() = user_b));