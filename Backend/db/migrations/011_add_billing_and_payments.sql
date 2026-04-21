-- Migration 011: Add billing fields to reports and create payments table

-- Add billing fields to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS base_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS lab_discount_type VARCHAR(10) DEFAULT 'percent' CHECK (lab_discount_type IN ('percent', 'amount'));
ALTER TABLE reports ADD COLUMN IF NOT EXISTS lab_discount_value DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS doctor_discount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS final_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS payment_status VARCHAR(10) DEFAULT 'pending' CHECK (payment_status IN ('paid', 'partial', 'pending'));

-- Backfill existing reports: set base_amount from report_amount, final_amount = report_amount
UPDATE reports SET base_amount = COALESCE(report_amount, 0), final_amount = COALESCE(report_amount, 0) WHERE base_amount = 0 OR base_amount IS NULL;

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    payment_mode VARCHAR(20) NOT NULL CHECK (payment_mode IN ('cash', 'upi', 'card')),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookup of payments by report
CREATE INDEX IF NOT EXISTS idx_payments_report_id ON payments(report_id);
