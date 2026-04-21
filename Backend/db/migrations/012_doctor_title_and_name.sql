-- Migration: Replace firstname/lastname with title + name for doctors
-- title: Dr, Mr, Mrs, Ms, Prof
-- name: single full name field

-- Add new columns
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS title VARCHAR(10) DEFAULT 'Dr';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS name VARCHAR(200);

-- Migrate existing data: merge firstname + lastname into name
UPDATE doctors SET name = TRIM(firstname || ' ' || lastname) WHERE name IS NULL;

-- Make name NOT NULL after backfill
ALTER TABLE doctors ALTER COLUMN name SET NOT NULL;

-- Make firstname/lastname nullable (keep for backward compat, stop using)
ALTER TABLE doctors ALTER COLUMN firstname DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN lastname DROP NOT NULL;
