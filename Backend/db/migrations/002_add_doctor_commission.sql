-- Migration: Add commission tracking for doctors
-- This adds commission_percentage to track doctor's share on referred reports
-- Commission is tracked internally and not shown on reports

-- Add commission_percentage to doctors table (stored as percentage, e.g., 10.00 = 10%)
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5, 2) DEFAULT 0.00;

-- Add report_amount to track the billing amount for each report
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS report_amount DECIMAL(10, 2) DEFAULT 0.00;

-- Add doctor_commission to store the calculated commission for each report
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS doctor_commission DECIMAL(10, 2) DEFAULT 0.00;

-- Add is_self_report flag to indicate if report has no referring doctor
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS is_self_report BOOLEAN DEFAULT FALSE;

-- Create index for doctor-based report queries (for statement generation)
CREATE INDEX IF NOT EXISTS idx_reports_doctor_id ON reports(doctor_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

-- Comment for future reference
COMMENT ON COLUMN doctors.commission_percentage IS 'Doctor commission percentage on referred reports (e.g., 10.00 = 10%)';
COMMENT ON COLUMN reports.report_amount IS 'Total report billing amount';
COMMENT ON COLUMN reports.doctor_commission IS 'Calculated commission for referring doctor (not shown on report)';
COMMENT ON COLUMN reports.is_self_report IS 'True if patient came directly without doctor referral';
