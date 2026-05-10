-- Migration: Add multiple lab signatures (up to 4) and default signature selection
-- Removes doctor-specific signatures from the workflow
-- Created: 2026-05-07

-- 1. Add signature columns (signature_1 through signature_4) to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS signature_1_url TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS signature_1_label TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS signature_2_url TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS signature_2_label TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS signature_3_url TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS signature_3_label TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS signature_4_url TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS signature_4_label TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS default_signature_index INTEGER DEFAULT 1;

-- Migrate existing owner_signature_url to signature_1_url
UPDATE settings 
SET signature_1_url = owner_signature_url,
    signature_1_label = 'Lab Owner'
WHERE owner_signature_url IS NOT NULL AND signature_1_url IS NULL;
