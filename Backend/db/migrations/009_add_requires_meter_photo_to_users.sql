-- Migration 009: Add requires_meter_photo column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS requires_meter_photo BOOLEAN DEFAULT true;
