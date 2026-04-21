-- Migration: Remove redundant test_parameters column and add missing approved_at
-- Date: 2026-03-27
-- Description: Removes the unused test_parameters column from reports table
--              Adds missing approved_at column for workflow tracking
--              All test data should be stored in test_data.parameters instead

-- ==========================================
-- Add missing approved_at column
-- ==========================================
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- ==========================================
-- Drop the unused test_parameters column
-- ==========================================
ALTER TABLE reports 
DROP COLUMN IF EXISTS test_parameters;

-- ==========================================
-- Update comment on test_data to clarify usage
-- ==========================================
COMMENT ON COLUMN reports.test_data IS 'JSON storage for test results. Structure: { testType, testName, parameters: [{ name, result, unit, reference_range, status }], remarks }';
COMMENT ON COLUMN reports.approved_at IS 'Timestamp when report was approved by doctor/admin';
