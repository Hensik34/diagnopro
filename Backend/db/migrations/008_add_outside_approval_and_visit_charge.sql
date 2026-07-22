-- Migration 008: Add fields for outside checkin/checkout approvals, penalty hours, request timestamps, and patient sample collection visit charge

ALTER TABLE time_logs ADD COLUMN IF NOT EXISTS approval_status VARCHAR(30) DEFAULT 'approved';
ALTER TABLE time_logs ADD COLUMN IF NOT EXISTS is_outside BOOLEAN DEFAULT false;
ALTER TABLE time_logs ADD COLUMN IF NOT EXISTS outside_reason TEXT;
ALTER TABLE time_logs ADD COLUMN IF NOT EXISTS rejection_note TEXT;
ALTER TABLE time_logs ADD COLUMN IF NOT EXISTS penalty_hours DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE time_logs ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE time_logs ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE time_logs ADD COLUMN IF NOT EXISTS start_meter_image TEXT;
ALTER TABLE time_logs ADD COLUMN IF NOT EXISTS requested_clock_in TIMESTAMP;
ALTER TABLE time_logs ADD COLUMN IF NOT EXISTS requested_clock_out TIMESTAMP;

-- Add sample collection visit charge to patients
ALTER TABLE patients ADD COLUMN IF NOT EXISTS sample_collection_visit_charge DECIMAL(10, 2) DEFAULT 0;
