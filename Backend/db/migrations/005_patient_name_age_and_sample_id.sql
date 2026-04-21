-- Migration 005: Patient name/age changes + auto-increment sample_id
-- 1. Merge firstname+lastname into single "name" column for patients
-- 2. Replace date_of_birth with age (integer)
-- 3. Add auto-incrementing monthly sample_id system

-- ==========================================
-- PATIENTS TABLE CHANGES
-- ==========================================

-- Add new "name" column
ALTER TABLE patients ADD COLUMN IF NOT EXISTS name VARCHAR(200);

-- Migrate existing data: merge firstname + lastname into name
UPDATE patients SET name = TRIM(CONCAT(firstname, ' ', COALESCE(lastname, '')));

-- Add age column (integer)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS age INTEGER;

-- Migrate existing DOB data to age
UPDATE patients SET age = EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth))::INTEGER
WHERE date_of_birth IS NOT NULL;

-- Make name NOT NULL after migration
ALTER TABLE patients ALTER COLUMN name SET NOT NULL;

-- Drop old columns (firstname, lastname, date_of_birth)
ALTER TABLE patients DROP COLUMN IF EXISTS firstname;
ALTER TABLE patients DROP COLUMN IF EXISTS lastname;
ALTER TABLE patients DROP COLUMN IF EXISTS date_of_birth;

-- ==========================================
-- SAMPLE ID SEQUENCE TABLE (monthly reset)
-- ==========================================

-- Table to track monthly sample counters
CREATE TABLE IF NOT EXISTS sample_id_counter (
    id SERIAL PRIMARY KEY,
    year_month VARCHAR(7) NOT NULL UNIQUE,  -- e.g. '2026-03'
    last_number INTEGER NOT NULL DEFAULT 0
);

-- Function to generate next sample ID (format: SM-YYMM-1001, SM-YYMM-1002, ...)
CREATE OR REPLACE FUNCTION generate_sample_id()
RETURNS TEXT AS $$
DECLARE
    current_ym TEXT;
    short_ym TEXT;
    next_num INTEGER;
BEGIN
    current_ym := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
    short_ym := TO_CHAR(CURRENT_DATE, 'YYMM');
    
    -- Upsert counter for current month
    INSERT INTO sample_id_counter (year_month, last_number)
    VALUES (current_ym, 1001)
    ON CONFLICT (year_month) 
    DO UPDATE SET last_number = sample_id_counter.last_number + 1
    RETURNING last_number INTO next_num;
    
    RETURN 'SM-' || short_ym || '-' || next_num::TEXT;
END;
$$ LANGUAGE plpgsql;
