-- Add GPS location fields to branches
ALTER TABLE branches ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS geofence_radius_meters INTEGER DEFAULT 150;

-- Add shift meter readings, end meter image, and location_meta JSON to time_logs
ALTER TABLE time_logs ADD COLUMN IF NOT EXISTS start_km DECIMAL(10, 2);
ALTER TABLE time_logs ADD COLUMN IF NOT EXISTS end_km DECIMAL(10, 2);
ALTER TABLE time_logs ADD COLUMN IF NOT EXISTS total_km DECIMAL(10, 2);
ALTER TABLE time_logs ADD COLUMN IF NOT EXISTS end_meter_image TEXT;
ALTER TABLE time_logs ADD COLUMN IF NOT EXISTS location_meta JSONB DEFAULT '{}'::jsonb;
