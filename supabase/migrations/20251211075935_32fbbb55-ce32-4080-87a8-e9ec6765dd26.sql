-- Update business_directory view to show all active/published businesses (not just verified)
-- This allows new businesses to appear in search results while still showing verified badge
CREATE OR REPLACE VIEW business_directory AS
SELECT 
    id,
    name,
    sector,
    bio,
    services,
    country,
    state,
    city,
    website,
    logo_url,
    verified,
    created_at
FROM business_accounts
WHERE status = ANY (ARRAY['published'::text, 'active'::text]);