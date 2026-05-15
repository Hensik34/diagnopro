-- ==========================================
-- COMPREHENSIVE MIGRATION: Create All Tables
-- ==========================================
-- This migration creates the entire database schema in one go.
-- All tables are organized in dependency order.
-- Date: 2026-05-11

-- ==========================================
-- 1. USERS TABLE - Core user data
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'staff', -- admin, doctor, staff, lab_technician
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. BRANCHES TABLE - Lab branches/locations
-- ==========================================
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. USER_BRANCHES TABLE - Many-to-Many relationship
-- ==========================================
CREATE TABLE IF NOT EXISTS user_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'staff', -- branch_manager, staff, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, branch_id)
);

-- ==========================================
-- 4. PATIENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    age INTEGER,
    gender VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    blood_type VARCHAR(10),
    branch_id UUID NOT NULL REFERENCES branches(id),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 5. DOCTORS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(10) DEFAULT 'Dr',
    name VARCHAR(200) NOT NULL,
    firstname VARCHAR(100),
    lastname VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    specialization VARCHAR(255),
    license_number VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    branch_id UUID REFERENCES branches(id),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    commission_percentage DECIMAL(5, 2) DEFAULT 0.00,
    signature_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 6. DOCTOR_BRANCHES TABLE - Many-to-Many relationship
-- ==========================================
CREATE TABLE IF NOT EXISTS doctor_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(doctor_id, branch_id)
);

-- ==========================================
-- 7. SAMPLES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    sample_type VARCHAR(100), -- Blood, Urine, Stool, etc.
    sample_id_code VARCHAR(100) UNIQUE NOT NULL,
    collection_date TIMESTAMP,
    collected_by UUID NOT NULL REFERENCES users(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT samples_status_check CHECK (status IN ('pending', 'collected', 'processing', 'completed', 'rejected'))
);

-- ==========================================
-- 8. SAMPLE_ID_COUNTER TABLE - For monthly auto-increment
-- ==========================================
CREATE TABLE IF NOT EXISTS sample_id_counter (
    id SERIAL PRIMARY KEY,
    year_month VARCHAR(7) NOT NULL UNIQUE,  -- e.g. '2026-03'
    last_number INTEGER NOT NULL DEFAULT 0
);

-- ==========================================
-- 9. TESTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_name VARCHAR(255) NOT NULL,
    test_code VARCHAR(100) NOT NULL,
    category VARCHAR(100), -- Hematology, Biochemistry, etc.
    sample_type VARCHAR(100), -- Required sample type
    price DECIMAL(10, 2),
    turnaround_time INT, -- in hours
    description TEXT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tests_test_code_branch_unique UNIQUE (test_code, branch_id)
);

-- ==========================================
-- 10. SAMPLE_TESTS TABLE - Many-to-Many
-- ==========================================
CREATE TABLE IF NOT EXISTS sample_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id UUID NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES tests(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed
    result TEXT,
    result_unit VARCHAR(50),
    reference_range VARCHAR(100),
    performed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sample_id, test_id)
);

-- ==========================================
-- 11. REPORTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID REFERENCES doctors(id),
    technician_id UUID REFERENCES users(id),
    report_type VARCHAR(100), -- Lab Report, Pathology Report, etc.
    sample_id UUID REFERENCES samples(id),
    status VARCHAR(50) DEFAULT 'created',
    clinical_notes TEXT,
    findings TEXT,
    recommendations TEXT,
    reviewed_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    test_data JSONB DEFAULT '{}',
    submitted_at TIMESTAMP,
    submitted_by UUID REFERENCES users(id),
    rejected_at TIMESTAMP,
    rejected_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    approved_at TIMESTAMP,
    delivery_preferences JSONB DEFAULT '{}',
    base_amount DECIMAL(10, 2) DEFAULT 0,
    lab_discount_type VARCHAR(10) DEFAULT 'percent',
    lab_discount_value DECIMAL(10, 2) DEFAULT 0,
    doctor_discount DECIMAL(10, 2) DEFAULT 0,
    final_amount DECIMAL(10, 2) DEFAULT 0,
    payment_status VARCHAR(10) DEFAULT 'pending',
    report_amount DECIMAL(10, 2) DEFAULT 0.00,
    doctor_commission DECIMAL(10, 2) DEFAULT 0.00,
    is_self_report BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reports_status_check CHECK (status IN ('draft', 'under_review', 'approved', 'rejected', 'created', 'collected', 'processing', 'completed')),
    CONSTRAINT reports_discount_type_check CHECK (lab_discount_type IN ('percent', 'amount')),
    CONSTRAINT reports_payment_status_check CHECK (payment_status IN ('paid', 'partial', 'pending'))
);

-- ==========================================
-- 12. INVENTORY TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Reagent', -- Reagent, Kit
    quantity INT NOT NULL DEFAULT 0,
    alert_threshold INT NOT NULL DEFAULT 0,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    last_restocked TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 13. SAMPLE_COLLECTION_TRACKING TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS sample_collection_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES users(id),
    branch_id UUID REFERENCES branches(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_km NUMERIC(10, 2),
    end_km NUMERIC(10, 2),
    total_km NUMERIC(10, 2) GENERATED ALWAYS AS (COALESCE(end_km, 0) - COALESCE(start_km, 0)) STORED,
    start_meter_image TEXT,
    end_meter_image TEXT,
    bike_image TEXT,
    visit_charge NUMERIC(10, 2) DEFAULT 0,
    per_km_rate NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(staff_id, date)
);

-- ==========================================
-- 14. TEST_FIELDS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS test_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    field_name VARCHAR(255) NOT NULL,
    unit VARCHAR(50),
    min_value DECIMAL(12, 4),
    max_value DECIMAL(12, 4),
    input_type VARCHAR(30) DEFAULT 'number',  -- number, text, select
    options TEXT,                               -- comma-separated options for select type
    order_index INT DEFAULT 0,
    field_type VARCHAR(20) DEFAULT 'input',
    formula TEXT,
    depends_on TEXT,
    section_group VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 15. PAYMENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    payment_mode VARCHAR(20) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payments_mode_check CHECK (payment_mode IN ('cash', 'upi', 'card')),
    CONSTRAINT payments_amount_check CHECK (amount > 0)
);

-- ==========================================
-- 16. TIME_LOGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS time_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clock_in TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    clock_out TIMESTAMP,
    total_hours DECIMAL(5, 2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 17. USER_TESTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS user_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    test_id UUID NOT NULL,
    test_name TEXT,
    category TEXT,
    sample_type TEXT,
    price NUMERIC,
    turnaround_time INTEGER,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, test_id)
);

-- ==========================================
-- 18. USER_TEST_FIELDS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS user_test_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    test_id UUID NOT NULL,
    field_name TEXT NOT NULL,
    unit TEXT,
    min_value NUMERIC,
    max_value NUMERIC,
    input_type TEXT,
    options TEXT,
    order_index INTEGER,
    field_type TEXT,
    formula TEXT,
    depends_on TEXT,
    section_group TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 19. SETTINGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL UNIQUE REFERENCES branches(id) ON DELETE CASCADE,
    letterhead_url TEXT,
    owner_signature_url TEXT,
    header_url TEXT,
    footer_url TEXT,
    report_margin_top INTEGER DEFAULT 160,
    report_margin_bottom INTEGER DEFAULT 120,
    report_margin_left INTEGER DEFAULT 28,
    report_margin_right INTEGER DEFAULT 28,
    signature_1_url TEXT,
    signature_1_label TEXT,
    signature_2_url TEXT,
    signature_2_label TEXT,
    signature_3_url TEXT,
    signature_3_label TEXT,
    signature_4_url TEXT,
    signature_4_label TEXT,
    default_signature_index INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);

-- Branches indexes (if needed)
CREATE INDEX IF NOT EXISTS idx_branches_city ON branches(city);

-- User-Branches indexes
CREATE INDEX IF NOT EXISTS idx_user_branches_user_id ON user_branches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_branches_branch_id ON user_branches(branch_id);

-- Patients indexes
CREATE INDEX IF NOT EXISTS idx_patients_branch_id ON patients(branch_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);

-- Doctors indexes
CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);

-- Doctor-Branches indexes
CREATE INDEX IF NOT EXISTS idx_doctor_branches_doctor_id ON doctor_branches(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_branches_branch_id ON doctor_branches(branch_id);

-- Samples indexes
CREATE INDEX IF NOT EXISTS idx_samples_patient_id ON samples(patient_id);
CREATE INDEX IF NOT EXISTS idx_samples_branch_id ON samples(branch_id);

-- Tests indexes
CREATE INDEX IF NOT EXISTS idx_tests_branch_id ON tests(branch_id);
CREATE INDEX IF NOT EXISTS idx_tests_category ON tests(category);

-- Sample-Tests indexes
CREATE INDEX IF NOT EXISTS idx_sample_tests_sample_id ON sample_tests(sample_id);
CREATE INDEX IF NOT EXISTS idx_sample_tests_test_id ON sample_tests(test_id);

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_patient_id ON reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_reports_doctor_id ON reports(doctor_id);
CREATE INDEX IF NOT EXISTS idx_reports_technician_id ON reports(technician_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_submitted_at ON reports(submitted_at);
CREATE INDEX IF NOT EXISTS idx_reports_status_updated ON reports(status, updated_at);
CREATE INDEX IF NOT EXISTS idx_reports_test_data ON reports USING GIN (test_data);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_branch_id ON inventory(branch_id);

-- Sample Collection Tracking indexes
CREATE INDEX IF NOT EXISTS idx_collection_tracking_staff_date ON sample_collection_tracking(staff_id, date);
CREATE INDEX IF NOT EXISTS idx_collection_tracking_date ON sample_collection_tracking(date);
CREATE INDEX IF NOT EXISTS idx_collection_tracking_branch ON sample_collection_tracking(branch_id);

-- Test Fields indexes
CREATE INDEX IF NOT EXISTS idx_test_fields_test_id ON test_fields(test_id);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_report_id ON payments(report_id);

-- Time Logs indexes
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_clock_in ON time_logs(clock_in);

-- User Tests indexes
CREATE INDEX IF NOT EXISTS idx_user_tests_user_id ON user_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tests_test_id ON user_tests(test_id);
CREATE INDEX IF NOT EXISTS idx_user_tests_user_test ON user_tests(user_id, test_id);

-- User Test Fields indexes
CREATE INDEX IF NOT EXISTS idx_user_test_fields_user_id ON user_test_fields(user_id);
CREATE INDEX IF NOT EXISTS idx_user_test_fields_test_id ON user_test_fields(test_id);
CREATE INDEX IF NOT EXISTS idx_user_test_fields_user_test ON user_test_fields(user_id, test_id);

-- Settings indexes
CREATE INDEX IF NOT EXISTS idx_settings_branch_id ON settings(branch_id);

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Function to generate next sample ID (format: SM-YYMM-1001, SM-YYMM-1002, ...)
CREATE OR REPLACE FUNCTION generate_sample_id()
RETURNS TEXT AS $$
DECLARE
    current_ym TEXT;
    short_ym TEXT;
    next_num INTEGER;
BEGIN
    current_ym := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
    short_ym := TO_CHAR(CURRENT_DATE, 'YYMM');
    
    -- Upsert counter for current month
    INSERT INTO sample_id_counter (year_month, last_number)
    VALUES (current_ym, 1001)
    ON CONFLICT (year_month) 
    DO UPDATE SET last_number = sample_id_counter.last_number + 1
    RETURNING last_number INTO next_num;
    
    RETURN 'SM-' || short_ym || '-' || next_num::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- COMMENTS FOR DOCUMENTATION
-- ==========================================

COMMENT ON COLUMN doctors.commission_percentage IS 'Doctor commission percentage on referred reports (e.g., 10.00 = 10%)';
COMMENT ON COLUMN reports.report_amount IS 'Total report billing amount';
COMMENT ON COLUMN reports.doctor_commission IS 'Calculated commission for referring doctor (not shown on report)';
COMMENT ON COLUMN reports.is_self_report IS 'True if patient came directly without doctor referral';
COMMENT ON COLUMN reports.test_data IS 'JSON storage for test results. Structure: { testType, testName, parameters: [{ name, result, unit, reference_range, status }], remarks }';
COMMENT ON COLUMN reports.approved_at IS 'Timestamp when report was approved by doctor/admin';
COMMENT ON COLUMN test_fields.field_type IS 'input = manual entry, calculated = derived from formula, flag = input with only High/Low/Normal display';
COMMENT ON COLUMN test_fields.formula IS 'JavaScript-style math expression, e.g. "TotalCholesterol / HDL". Field names must match exactly.';
COMMENT ON COLUMN test_fields.depends_on IS 'JSON array of field_name strings this calculated field depends on, e.g. ["TotalCholesterol","HDL"]';
COMMENT ON COLUMN test_fields.section_group IS 'Sub-section heading within a test, e.g. HEMOGLOBIN, RBC COUNT. Rendered as bold row header in report.';
