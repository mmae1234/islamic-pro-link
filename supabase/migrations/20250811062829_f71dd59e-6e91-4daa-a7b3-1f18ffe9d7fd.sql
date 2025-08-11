-- Add services field to business accounts for listing offered services
ALTER TABLE public.business_accounts
ADD COLUMN IF NOT EXISTS services text;