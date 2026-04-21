-- Migration: Add test_data and missing workflow fields
-- Date: 2026-03-26
-- Description: Adds test_data JSON column to reports, ensures workflow fields exist

-- ==========================================
-- Add test_data column to reports
-- Stores dynamic test results as JSON
-- ==========================================
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS test_data JSONB DEFAULT '{}';

-- ==========================================
-- Ensure status column has CHECK constraint
-- ==========================================
ALTER TABLE reports 
DROP CONSTRAINT IF EXISTS reports_status_check;

ALTER TABLE reports 
ADD CONSTRAINT reports_status_check 
CHECK (status IN ('draft', 'under_review', 'approved', 'rejected', 'created', 'collected', 'processing', 'completed'));

-- ==========================================
-- Add submitted_at timestamp for workflow tracking
-- ==========================================
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;

ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES users(id);

-- ==========================================
-- Add rejection fields
-- ==========================================
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;

ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES users(id);

ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- ==========================================
-- Add test parameters for result tracking
-- ==========================================
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS test_parameters JSONB DEFAULT '[]';

-- ==========================================
-- Update samples table for better workflow
-- ==========================================
ALTER TABLE samples 
DROP CONSTRAINT IF EXISTS samples_status_check;

ALTER TABLE samples 
ADD CONSTRAINT samples_status_check 
CHECK (status IN ('pending', 'collected', 'processing', 'completed', 'rejected'));

-- ==========================================
-- Create indexes for performance
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_reports_test_data ON reports USING GIN (test_data);
CREATE INDEX IF NOT EXISTS idx_reports_submitted_at ON reports (submitted_at);
CREATE INDEX IF NOT EXISTS idx_reports_status_updated ON reports (status, updated_at);

-- ==========================================
-- Add comments for documentation
-- ==========================================
COMMENT ON COLUMN reports.test_data IS 'JSON storage for dynamic test results and parameters';
COMMENT ON COLUMN reports.test_parameters IS 'Array of test parameter definitions used for this report';
COMMENT ON COLUMN reports.submitted_at IS 'Timestamp when report was submitted for review';
COMMENT ON COLUMN reports.rejection_reason IS 'Reason provided when report is rejected';
