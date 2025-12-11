-- Fix Elian Law PLLC account - set role to business
UPDATE profiles 
SET role = 'business'
WHERE user_id = 'e3744d1e-46ec-4745-a88b-47ea1ebbd517';

-- Create business account for them if it doesn't exist
INSERT INTO business_accounts (owner_id, name, status)
SELECT 'e3744d1e-46ec-4745-a88b-47ea1ebbd517', 'Elian Law PLLC', 'draft'
WHERE NOT EXISTS (
  SELECT 1 FROM business_accounts WHERE owner_id = 'e3744d1e-46ec-4745-a88b-47ea1ebbd517'
);