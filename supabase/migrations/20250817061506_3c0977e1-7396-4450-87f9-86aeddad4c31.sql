-- Add foreign key constraints to blocked_users table
ALTER TABLE public.blocked_users 
ADD CONSTRAINT blocked_users_blocker_id_fkey 
FOREIGN KEY (blocker_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.blocked_users 
ADD CONSTRAINT blocked_users_blocked_id_fkey 
FOREIGN KEY (blocked_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add unique constraint to prevent duplicate blocks
ALTER TABLE public.blocked_users 
ADD CONSTRAINT blocked_users_blocker_blocked_unique 
UNIQUE (blocker_id, blocked_id);