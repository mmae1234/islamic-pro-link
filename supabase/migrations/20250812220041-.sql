-- Add social media fields to professional profiles for linking accounts
ALTER TABLE public.professional_profiles
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS twitter_url text,
  ADD COLUMN IF NOT EXISTS youtube_url text,
  ADD COLUMN IF NOT EXISTS tiktok_url text,
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS telegram_url text,
  ADD COLUMN IF NOT EXISTS website text;