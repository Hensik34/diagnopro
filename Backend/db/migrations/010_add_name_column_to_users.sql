-- Migration 010: Add name column to users table and make firstname/lastname optional
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Populate name for existing users
UPDATE users SET name = TRIM(CONCAT(COALESCE(firstname, ''), ' ', COALESCE(lastname, ''))) WHERE name IS NULL OR name = '';

-- Make firstname and lastname optional
ALTER TABLE users ALTER COLUMN firstname DROP NOT NULL;
ALTER TABLE users ALTER COLUMN lastname DROP NOT NULL;
