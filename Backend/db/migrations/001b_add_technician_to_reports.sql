-- Migration: Add technician_id to reports table
-- Run this migration if you have an existing database

-- Add technician_id column to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS technician_id UUID REFERENCES users(id);

-- Update existing reports status from 'draft' to 'created' if needed
UPDATE reports SET status = 'created' WHERE status = 'draft';

-- Create index for technician_id for better query performance
CREATE INDEX IF NOT EXISTS idx_reports_technician_id ON reports(technician_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
