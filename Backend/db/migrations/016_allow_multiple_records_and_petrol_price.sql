-- Migration: Allow multiple collection records per day & add petrol price per user
-- 1. Drop the UNIQUE constraint on (staff_id, date) to allow multiple entries per day
-- 2. Add petrol_price_per_km to users table for per-user petrol cost

-- Drop unique constraint to allow multiple records per staff per day
ALTER TABLE sample_collection_tracking DROP CONSTRAINT IF EXISTS sample_collection_tracking_staff_id_date_key;

-- Add petrol_price_per_km column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS petrol_price_per_km NUMERIC(10, 2) DEFAULT 0;

-- Change image columns comment: these will now store file paths instead of base64
COMMENT ON COLUMN sample_collection_tracking.start_meter_image IS 'File path to uploaded start meter image';
COMMENT ON COLUMN sample_collection_tracking.end_meter_image IS 'File path to uploaded end meter image';
COMMENT ON COLUMN sample_collection_tracking.bike_image IS 'File path to uploaded bike image';
