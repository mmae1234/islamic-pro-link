-- Create business_accounts table and signup_events table for role-based onboarding and analytics

-- 1) business_accounts table
CREATE TABLE IF NOT EXISTS public.business_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_accounts ENABLE ROW LEVEL SECURITY;

-- Policies: Only owners can manage their business account
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'business_accounts' AND policyname = 'Owners can insert their business account'
  ) THEN
    CREATE POLICY "Owners can insert their business account"
    ON public.business_accounts
    FOR INSERT
    WITH CHECK (auth.uid() = owner_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'business_accounts' AND policyname = 'Owners can view their business accounts'
  ) THEN
    CREATE POLICY "Owners can view their business accounts"
    ON public.business_accounts
    FOR SELECT
    USING (auth.uid() = owner_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'business_accounts' AND policyname = 'Owners can update their business accounts'
  ) THEN
    CREATE POLICY "Owners can update their business accounts"
    ON public.business_accounts
    FOR UPDATE
    USING (auth.uid() = owner_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'business_accounts' AND policyname = 'Owners can delete their business accounts'
  ) THEN
    CREATE POLICY "Owners can delete their business accounts"
    ON public.business_accounts
    FOR DELETE
    USING (auth.uid() = owner_id);
  END IF;
END$$;

-- Updated_at trigger
CREATE OR REPLACE TRIGGER trg_business_accounts_updated_at
BEFORE UPDATE ON public.business_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2) signup_events table for basic analytics
CREATE TABLE IF NOT EXISTS public.signup_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  source text NOT NULL, -- e.g., 'header', 'business_cta', 'generic'
  account_type text,    -- e.g., 'visitor', 'professional', 'business'
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.signup_events ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including guests) to insert analytics events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'signup_events' AND policyname = 'Anyone can insert signup events'
  ) THEN
    CREATE POLICY "Anyone can insert signup events"
    ON public.signup_events
    FOR INSERT
    WITH CHECK (true);
  END IF;

  -- Optional: users can view their own events (not strictly required)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'signup_events' AND policyname = 'Users can view their own signup events'
  ) THEN
    CREATE POLICY "Users can view their own signup events"
    ON public.signup_events
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END$$;