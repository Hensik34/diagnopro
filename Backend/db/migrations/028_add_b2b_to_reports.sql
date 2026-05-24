-- ============================================
-- Migration 027: Add B2B fields to reports table
-- Links a report to a B2B partner lab with a charge amount.
-- Commission is calculated on (report_amount - b2b_charge).
-- ============================================

-- Add B2B reference and charge to reports
ALTER TABLE reports ADD COLUMN IF NOT EXISTS b2b_lab_id UUID REFERENCES b2b_labs(id);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS b2b_charge DECIMAL(10,2) DEFAULT 0;

-- Index for quick lookup of reports by B2B lab
CREATE INDEX IF NOT EXISTS idx_reports_b2b_lab ON reports(b2b_lab_id) WHERE b2b_lab_id IS NOT NULL;
