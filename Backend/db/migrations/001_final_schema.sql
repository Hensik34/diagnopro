-- Create Database (run manually first: CREATE DATABASE lab_management_db;)
-- Then run this schema file

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- USERS TABLE - Core user data
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'staff', -- admin, doctor, staff, lab_technician
    is_active BOOLEAN DEFAULT TRUE,
    petrol_price_per_km DECIMAL(10, 2) DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BRANCHES TABLE - Lab branches/locations
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

-- USER_BRANCHES TABLE - Many-to-Many relationship (User can manage multiple branches)
CREATE TABLE IF NOT EXISTS user_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'staff', -- branch_manager, staff, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, branch_id)
);

-- PATIENTS TABLE
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    date_of_birth DATE,
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

-- DOCTORS TABLE
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    specialization VARCHAR(255),
    license_number VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    branch_id UUID REFERENCES branches(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DOCTOR_BRANCHES TABLE - Many-to-Many relationship (Doctor can be linked to multiple branches)
CREATE TABLE IF NOT EXISTS doctor_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(doctor_id, branch_id)
);

-- SAMPLES TABLE
CREATE TABLE IF NOT EXISTS samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    sample_type VARCHAR(100), -- Blood, Urine, Stool, etc.
    sample_id_code VARCHAR(100) UNIQUE NOT NULL,
    collection_date TIMESTAMP,
    collected_by UUID NOT NULL REFERENCES users(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, rejected
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TESTS TABLE
CREATE TABLE IF NOT EXISTS tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_name VARCHAR(255) NOT NULL,
    test_code VARCHAR(100) NOT NULL,
    category VARCHAR(100), -- Hematology, Biochemistry, etc.
    sample_type VARCHAR(100), -- Required sample type
    price DECIMAL(10, 2),
    turnaround_time INT, -- in hours
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(test_code)
);

-- SAMPLE_TESTS TABLE - Many-to-Many (A sample can have multiple tests)
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

-- REPORTS TABLE
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID REFERENCES doctors(id),
    technician_id UUID REFERENCES users(id), -- Assigned lab technician
    report_type VARCHAR(100), -- Lab Report, Pathology Report, etc.
    sample_id UUID REFERENCES samples(id),
    status VARCHAR(50) DEFAULT 'created', -- created, collected, processing, completed, approved
    clinical_notes TEXT,
    findings TEXT,
    recommendations TEXT,
    reviewed_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_patients_branch_id ON patients(branch_id);
CREATE INDEX idx_samples_patient_id ON samples(patient_id);
CREATE INDEX idx_samples_branch_id ON samples(branch_id);
CREATE INDEX idx_sample_tests_sample_id ON sample_tests(sample_id);
CREATE INDEX idx_reports_patient_id ON reports(patient_id);
CREATE INDEX idx_user_branches_user_id ON user_branches(user_id);
CREATE INDEX idx_user_branches_branch_id ON user_branches(branch_id);
CREATE INDEX idx_doctor_branches_doctor_id ON doctor_branches(doctor_id);
CREATE INDEX idx_doctor_branches_branch_id ON doctor_branches(branch_id);
CREATE INDEX idx_doctors_email ON doctors(email);

-- ============================================
-- B2B PARTNER LABS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS b2b_labs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_name VARCHAR(255) NOT NULL,
    lab_code VARCHAR(50) UNIQUE NOT NULL,
    contact_person VARCHAR(255),
    mobile VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    gst_number VARCHAR(50),
    commission_type VARCHAR(20) DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
    commission_value DECIMAL(10,2) DEFAULT 0,
    credit_limit DECIMAL(12,2) DEFAULT 0,
    current_balance DECIMAL(12,2) DEFAULT 0,
    lab_type VARCHAR(20) DEFAULT 'collection' CHECK (lab_type IN ('collection', 'processing')),
    owner_branch_id UUID REFERENCES branches(id),
    user_id UUID REFERENCES users(id),
    logo_url TEXT,
    show_processing_lab BOOLEAN DEFAULT false,
    custom_footer TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP,
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_b2b_labs_owner ON b2b_labs(owner_branch_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_b2b_labs_status ON b2b_labs(status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_b2b_labs_user ON b2b_labs(user_id);
CREATE INDEX IF NOT EXISTS idx_b2b_labs_code ON b2b_labs(lab_code);

-- ============================================
-- TEST FIELDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS test_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    field_name VARCHAR(255) NOT NULL,
    unit VARCHAR(100),
    min_value DECIMAL(10, 2),
    max_value DECIMAL(10, 2),
    input_type VARCHAR(50) DEFAULT 'number', -- text, number, date, select, etc.
    options TEXT,
    order_index INT DEFAULT 0,
    field_type VARCHAR(50) DEFAULT 'input', -- input, calculated
    formula TEXT,
    depends_on TEXT,
    section_group VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_test_fields_test_id ON test_fields(test_id);
CREATE INDEX IF NOT EXISTS idx_test_fields_section ON test_fields(section_group);

-- ============================================
-- INVENTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name VARCHAR(255) NOT NULL,
    item_code VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    quantity INT DEFAULT 0,
    reorder_level INT DEFAULT 0,
    unit_price DECIMAL(10, 2),
    supplier VARCHAR(255),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(item_code, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_branch_id ON inventory(branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);

-- ============================================
-- COLLECTION TRACKING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS collection_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id UUID NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
    collection_point VARCHAR(255),
    scheduled_date DATE,
    collection_date DATE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, collected, failed
    collected_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_collection_tracking_sample_id ON collection_tracking(sample_id);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id),
    doctor_id UUID REFERENCES doctors(id),
    amount DECIMAL(12, 2) NOT NULL,
    payment_mode VARCHAR(50), -- cash, card, cheque, transfer
    payment_date TIMESTAMP,
    reference_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_doctor_id ON payments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ============================================
-- TIME LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS time_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    duration INT, -- in minutes
    branch_id UUID REFERENCES branches(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_date ON time_logs(created_at);

-- ============================================
-- SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    key VARCHAR(255) NOT NULL,
    value TEXT,
    data_type VARCHAR(50) DEFAULT 'string', -- string, number, boolean, json
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, key)
);

CREATE INDEX IF NOT EXISTS idx_settings_branch_id ON settings(branch_id);

-- ============================================
-- BRANCH TESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS branch_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    test_name VARCHAR(255),
    category VARCHAR(100),
    sample_type VARCHAR(100),
    price DECIMAL(10,2),
    turnaround_time INT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, test_id)
);

CREATE INDEX IF NOT EXISTS idx_branch_tests_branch_id ON branch_tests(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_tests_test_id ON branch_tests(test_id);

-- ============================================
-- BRANCH TEST FIELDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS branch_test_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    test_field_id UUID REFERENCES test_fields(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    field_name VARCHAR(255),
    unit VARCHAR(100),
    min_value DECIMAL(10,2),
    max_value DECIMAL(10,2),
    input_type VARCHAR(50) DEFAULT 'number',
    options TEXT,
    order_index INT DEFAULT 0,
    field_type VARCHAR(50) DEFAULT 'input',
    formula TEXT,
    depends_on TEXT,
    section_group VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, test_id, field_name)
);

CREATE INDEX IF NOT EXISTS idx_branch_test_fields_test_id ON branch_test_fields(test_id);
CREATE INDEX IF NOT EXISTS idx_branch_test_fields_branch_id ON branch_test_fields(branch_id);

-- ============================================
-- Post-schema normalization for model compatibility
-- ============================================

-- Ensure a default branch exists (required by test seed migration)
INSERT INTO branches (id, name, location, city, state, phone, email, created_at, updated_at)
SELECT gen_random_uuid(), 'Main Branch', 'Headquarters', 'Default City', 'Default State', '+1234567890', 'main@lab.com', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM branches);

-- Patients: use model-compatible name + age
ALTER TABLE patients ADD COLUMN IF NOT EXISTS name VARCHAR(200);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS age INTEGER;
UPDATE patients
SET name = TRIM(CONCAT(COALESCE(firstname, ''), ' ', COALESCE(lastname, '')))
WHERE name IS NULL;
ALTER TABLE patients DROP COLUMN IF EXISTS firstname;
ALTER TABLE patients DROP COLUMN IF EXISTS lastname;
ALTER TABLE patients DROP COLUMN IF EXISTS date_of_birth;

-- Doctors: add model fields
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS title VARCHAR(20) DEFAULT 'Dr';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS name VARCHAR(200);
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5,2) DEFAULT 0;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
UPDATE doctors
SET name = TRIM(CONCAT(COALESCE(firstname, ''), ' ', COALESCE(lastname, '')))
WHERE name IS NULL;
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);

-- Reports: billing + workflow columns used by services/controllers
ALTER TABLE reports ADD COLUMN IF NOT EXISTS report_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS doctor_commission DECIMAL(12,2) DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS is_self_report BOOLEAN DEFAULT false;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS test_data JSONB DEFAULT '{}';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS delivery_preferences JSONB DEFAULT '{}';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS base_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS lab_discount_type VARCHAR(20) DEFAULT 'percent';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS lab_discount_value DECIMAL(10,2) DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS doctor_discount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS final_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'pending';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS b2b_lab_id UUID REFERENCES b2b_labs(id);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS b2b_charge DECIMAL(10,2) DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES users(id);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES users(id);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE reports ALTER COLUMN status SET DEFAULT 'draft';
CREATE INDEX IF NOT EXISTS idx_reports_b2b_lab ON reports(b2b_lab_id) WHERE b2b_lab_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_payment_status ON reports(payment_status);
CREATE INDEX IF NOT EXISTS idx_reports_branch ON reports(branch_id) WHERE branch_id IS NOT NULL;

-- Payments: report relation used for billing tracking
ALTER TABLE payments ADD COLUMN IF NOT EXISTS report_id UUID REFERENCES reports(id);

-- Test fields: add dynamic field metadata columns
ALTER TABLE test_fields ADD COLUMN IF NOT EXISTS options TEXT;
ALTER TABLE test_fields ADD COLUMN IF NOT EXISTS depends_on TEXT;
ALTER TABLE test_fields ADD COLUMN IF NOT EXISTS section_group VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
            AND table_name = 'test_fields'
            AND column_name = 'section_name'
    ) THEN
        EXECUTE 'UPDATE test_fields SET section_group = section_name WHERE section_group IS NULL AND section_name IS NOT NULL';
    END IF;
END $$;
ALTER TABLE test_fields DROP COLUMN IF EXISTS section_name;

-- Settings: flatten into explicit columns used by settings service
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_branch_id_key_key;
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_branch_id_key;
ALTER TABLE settings DROP COLUMN IF EXISTS key;
ALTER TABLE settings DROP COLUMN IF EXISTS value;
ALTER TABLE settings DROP COLUMN IF EXISTS data_type;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS letterhead_url TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS owner_signature_url TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS header_url TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS footer_url TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS report_margin_top VARCHAR(20) DEFAULT '10mm';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS report_margin_bottom VARCHAR(20) DEFAULT '10mm';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS report_margin_left VARCHAR(20) DEFAULT '10mm';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS report_margin_right VARCHAR(20) DEFAULT '10mm';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS signature_1_url TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS signature_1_label VARCHAR(255);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS signature_2_url TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS signature_2_label VARCHAR(255);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS signature_3_url TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS signature_3_label VARCHAR(255);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS signature_4_url TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS signature_4_label VARCHAR(255);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS default_signature_index INTEGER DEFAULT 0;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'settings_branch_id_key'
  ) THEN
    ALTER TABLE settings ADD CONSTRAINT settings_branch_id_key UNIQUE (branch_id);
  END IF;
END $$;

-- Branch test tables: include override columns expected by models
ALTER TABLE branch_tests ADD COLUMN IF NOT EXISTS test_name VARCHAR(255);
ALTER TABLE branch_tests ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE branch_tests ADD COLUMN IF NOT EXISTS sample_type VARCHAR(100);
ALTER TABLE branch_tests ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);
ALTER TABLE branch_tests ADD COLUMN IF NOT EXISTS turnaround_time INT;
ALTER TABLE branch_tests ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE branch_tests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE branch_test_fields ADD COLUMN IF NOT EXISTS test_id UUID REFERENCES tests(id) ON DELETE CASCADE;
ALTER TABLE branch_test_fields ADD COLUMN IF NOT EXISTS field_name VARCHAR(255);
ALTER TABLE branch_test_fields ADD COLUMN IF NOT EXISTS unit VARCHAR(100);
ALTER TABLE branch_test_fields ADD COLUMN IF NOT EXISTS min_value DECIMAL(10,2);
ALTER TABLE branch_test_fields ADD COLUMN IF NOT EXISTS max_value DECIMAL(10,2);
ALTER TABLE branch_test_fields ADD COLUMN IF NOT EXISTS input_type VARCHAR(50) DEFAULT 'number';
ALTER TABLE branch_test_fields ADD COLUMN IF NOT EXISTS options TEXT;
ALTER TABLE branch_test_fields ADD COLUMN IF NOT EXISTS order_index INT DEFAULT 0;
ALTER TABLE branch_test_fields ADD COLUMN IF NOT EXISTS field_type VARCHAR(50) DEFAULT 'input';
ALTER TABLE branch_test_fields ADD COLUMN IF NOT EXISTS formula TEXT;
ALTER TABLE branch_test_fields ADD COLUMN IF NOT EXISTS depends_on TEXT;
ALTER TABLE branch_test_fields ADD COLUMN IF NOT EXISTS section_group VARCHAR(255);
ALTER TABLE branch_test_fields ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_branch_test_fields_test_id ON branch_test_fields(test_id);

-- Inventory: recreate with current model schema
DROP TABLE IF EXISTS inventory CASCADE;
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  quantity INT DEFAULT 0,
  alert_threshold INT DEFAULT 0,
  unit VARCHAR(50) DEFAULT 'packs',
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  last_restocked TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, branch_id)
);
CREATE INDEX IF NOT EXISTS idx_inventory_branch_id ON inventory(branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);

-- Collection tracking: use model table and columns
DROP TABLE IF EXISTS collection_tracking CASCADE;
CREATE TABLE IF NOT EXISTS sample_collection_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES users(id),
  branch_id UUID REFERENCES branches(id),
  date DATE DEFAULT CURRENT_DATE,
  start_km DECIMAL(10,2),
  end_km DECIMAL(10,2),
  total_km DECIMAL(10,2),
  start_meter_image TEXT,
  end_meter_image TEXT,
  bike_image TEXT,
  visit_charge DECIMAL(10,2) DEFAULT 0,
  per_km_rate DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sample_collection_staff_id ON sample_collection_tracking(staff_id);
CREATE INDEX IF NOT EXISTS idx_sample_collection_date ON sample_collection_tracking(date);

-- Time logs: ensure model-compatible columns
DROP TABLE IF EXISTS time_logs CASCADE;
CREATE TABLE IF NOT EXISTS time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  clock_in TIMESTAMP,
  clock_out TIMESTAMP,
  total_hours DECIMAL(10,2),
  branch_id UUID REFERENCES branches(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_clock_in ON time_logs(clock_in);

-- Monthly sample ID counter + generator function
CREATE TABLE IF NOT EXISTS sample_id_counter (
  id SERIAL PRIMARY KEY,
  year_month VARCHAR(7) NOT NULL UNIQUE,
  last_number INTEGER NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION generate_sample_id()
RETURNS TEXT AS $$
DECLARE
  current_ym TEXT;
  short_ym TEXT;
  next_num INTEGER;
BEGIN
  current_ym := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  short_ym := TO_CHAR(CURRENT_DATE, 'YYMM');

  INSERT INTO sample_id_counter (year_month, last_number)
  VALUES (current_ym, 1001)
  ON CONFLICT (year_month)
  DO UPDATE SET last_number = sample_id_counter.last_number + 1
  RETURNING last_number INTO next_num;

  RETURN 'SM-' || short_ym || '-' || next_num::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Default tests seed data
-- ============================================

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Complete Blood Count (CBC)', 'CBC-01', 'Hematology', 'Blood', 250, 4, 'Measures red cells, white cells, hemoglobin, hematocrit, and platelets', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'ESR (Erythrocyte Sedimentation Rate)', 'ESR-01', 'Hematology', 'Blood', 100, 2, 'Measures the rate at which red blood cells settle', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Blood Group & Rh Typing', 'BG-01', 'Hematology', 'Blood', 150, 1, 'Determines ABO blood group and Rh factor', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Peripheral Blood Smear', 'PBS-01', 'Hematology', 'Blood', 200, 6, 'Microscopic examination of blood cells morphology', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Lipid Profile', 'LIPID-01', 'Biochemistry', 'Blood', 350, 6, 'Measures cholesterol, triglycerides, HDL, LDL, VLDL', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Liver Function Test (LFT)', 'LFT-01', 'Biochemistry', 'Blood', 400, 6, 'Evaluates liver health - bilirubin, AST, ALT, ALP, proteins', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Kidney Function Test (KFT)', 'KFT-01', 'Biochemistry', 'Blood', 450, 6, 'Evaluates kidney health - urea, creatinine, uric acid, electrolytes', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Blood Sugar Fasting (FBS)', 'FBS-01', 'Biochemistry', 'Blood', 80, 2, 'Measures fasting blood glucose level', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Blood Sugar PP (Post Prandial)', 'PPBS-01', 'Biochemistry', 'Blood', 80, 2, 'Measures blood glucose 2 hours after meal', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Random Blood Sugar (RBS)', 'RBS-01', 'Biochemistry', 'Blood', 80, 1, 'Measures blood glucose at any time of day', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'HbA1c (Glycated Hemoglobin)', 'HBA1C-01', 'Biochemistry', 'Blood', 350, 4, 'Average blood sugar control over past 2-3 months', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Thyroid Profile (T3, T4, TSH)', 'THYROID-01', 'Hormone', 'Blood', 500, 6, 'Measures thyroid hormones T3, T4 and TSH', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'TSH (Thyroid Stimulating Hormone)', 'TSH-01', 'Hormone', 'Blood', 200, 4, 'Screens for thyroid disorders', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Urine Routine & Microscopy', 'URINE-01', 'Urinalysis', 'Urine', 150, 3, 'Physical, chemical and microscopic examination of urine', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Stool Routine & Microscopy', 'STOOL-01', 'Microbiology', 'Stool', 150, 3, 'Microscopic examination of stool for ova, cysts, parasites', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Widal Test', 'WIDAL-01', 'Serology', 'Blood', 200, 4, 'Serological test for typhoid fever', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'VDRL (Syphilis Screening)', 'VDRL-01', 'Serology', 'Blood', 200, 4, 'Screening test for syphilis', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'HIV I & II (ELISA)', 'HIV-01', 'Serology', 'Blood', 300, 6, 'Screening test for HIV antibodies', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'HBsAg (Hepatitis B Surface Antigen)', 'HBSAG-01', 'Serology', 'Blood', 250, 4, 'Screening test for Hepatitis B infection', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Anti-HCV (Hepatitis C)', 'HCV-01', 'Serology', 'Blood', 300, 6, 'Screening test for Hepatitis C infection', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'CRP (C-Reactive Protein)', 'CRP-01', 'Biochemistry', 'Blood', 250, 4, 'Marker of inflammation in the body', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'RA Factor (Rheumatoid Factor)', 'RAF-01', 'Immunology', 'Blood', 300, 4, 'Test for rheumatoid arthritis and autoimmune conditions', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'ASO Titre (Anti-Streptolysin O)', 'ASO-01', 'Immunology', 'Blood', 250, 4, 'Detects streptococcal infection antibodies', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Serum Electrolytes (Na/K/Cl)', 'ELEC-01', 'Biochemistry', 'Blood', 300, 4, 'Measures sodium, potassium, chloride levels', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Serum Calcium', 'CALC-01', 'Biochemistry', 'Blood', 150, 4, 'Measures calcium level in blood', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Serum Iron & TIBC', 'IRON-01', 'Biochemistry', 'Blood', 350, 6, 'Evaluates iron status and iron binding capacity', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Vitamin D (25-Hydroxy)', 'VITD-01', 'Biochemistry', 'Blood', 600, 12, 'Measures vitamin D levels', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Vitamin B12', 'VITB12-01', 'Biochemistry', 'Blood', 500, 12, 'Measures vitamin B12 levels in blood', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Serum Uric Acid', 'URIC-01', 'Biochemistry', 'Blood', 150, 4, 'Measures uric acid levels for gout screening', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'PT/INR (Prothrombin Time)', 'PTINR-01', 'Hematology', 'Blood', 250, 4, 'Measures blood clotting time', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Dengue NS1 Antigen', 'DENGNS1-01', 'Serology', 'Blood', 500, 4, 'Early detection of dengue infection', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Dengue IgM / IgG', 'DENGIGG-01', 'Serology', 'Blood', 500, 4, 'Detects dengue antibodies for current or past infection', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Malaria Antigen (Rapid Card)', 'MALAR-01', 'Microbiology', 'Blood', 250, 1, 'Rapid test for Plasmodium falciparum and vivax', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Urine Culture & Sensitivity', 'UCULT-01', 'Microbiology', 'Urine', 500, 48, 'Culture to identify urinary tract pathogens and antibiotic sensitivity', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Blood Culture & Sensitivity', 'BCULT-01', 'Microbiology', 'Blood', 700, 72, 'Culture to detect bloodstream infections', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Semen Analysis', 'SEMEN-01', 'Andrology', 'Semen', 400, 4, 'Evaluates sperm count, motility, morphology', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Pregnancy Test (Urine)', 'UPT-01', 'Hormone', 'Urine', 100, 1, 'Detects hCG hormone in urine', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Serum Amylase', 'AMYL-01', 'Biochemistry', 'Blood', 250, 4, 'Evaluates pancreatic function', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Serum Lipase', 'LIPAS-01', 'Biochemistry', 'Blood', 300, 4, 'Diagnoses pancreatitis', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Troponin I (Cardiac Marker)', 'TROP-01', 'Biochemistry', 'Blood', 500, 2, 'Cardiac marker for myocardial infarction', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- ============================================
-- Default test field seed data
-- ============================================

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index, NOW(), NOW()
FROM tests t
CROSS JOIN (VALUES
    ('Hemoglobin', 'g/dL', 12.0, 15.5, 0),
    ('RBC Count', 'mil/uL', 3.5, 5.5, 1),
    ('HCT', '%', 37.0, 47.0, 2),
    ('MCV', 'fL', 80.0, 100.0, 3),
    ('MCH', 'pg', 27.0, 31.0, 4),
    ('MCHC', 'g/dL', 32.0, 36.0, 5),
    ('RDW', '%', 11.5, 14.5, 6),
    ('Platelet Count', 'thou/uL', 150.0, 450.0, 7),
    ('WBC Count', 'thou/uL', 4.5, 11.0, 8)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE (t.test_name ILIKE '%Complete Blood Count%' OR t.test_name ILIKE '%CBC%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Total Cholesterol', 'mg/dL', 0.0, 200.0, 0),
    ('HDL Cholesterol', 'mg/dL', 40.0, 60.0, 1),
    ('LDL Cholesterol', 'mg/dL', 0.0, 100.0, 2),
    ('VLDL Cholesterol', 'mg/dL', 5.0, 40.0, 3),
    ('Triglycerides', 'mg/dL', 0.0, 150.0, 4),
    ('TC/HDL Ratio', '', 0.0, 5.0, 5)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE t.test_name ILIKE '%Lipid%'
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('TSH', 'uIU/mL', 0.4, 4.0, 0),
    ('T3', 'ng/dL', 80.0, 200.0, 1),
    ('T4', 'ug/dL', 4.5, 12.5, 2),
    ('FT3', 'pg/mL', 2.0, 4.4, 3),
    ('FT4', 'ng/dL', 0.8, 1.8, 4)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE t.test_name ILIKE '%Thyroid%'
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Total Bilirubin', 'mg/dL', 0.1, 1.2, 0),
    ('Direct Bilirubin', 'mg/dL', 0.0, 0.3, 1),
    ('Indirect Bilirubin', 'mg/dL', 0.1, 0.9, 2),
    ('SGOT (AST)', 'U/L', 0.0, 40.0, 3),
    ('SGPT (ALT)', 'U/L', 0.0, 40.0, 4),
    ('Alkaline Phosphatase', 'U/L', 44.0, 147.0, 5),
    ('Total Protein', 'g/dL', 6.0, 8.3, 6),
    ('Albumin', 'g/dL', 3.5, 5.5, 7),
    ('Globulin', 'g/dL', 2.0, 3.5, 8),
    ('A/G Ratio', '', 1.0, 2.5, 9)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE (t.test_name ILIKE '%Liver%' OR t.test_name ILIKE '%LFT%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Blood Urea', 'mg/dL', 15.0, 40.0, 0),
    ('BUN', 'mg/dL', 7.0, 20.0, 1),
    ('Serum Creatinine', 'mg/dL', 0.6, 1.2, 2),
    ('Uric Acid', 'mg/dL', 3.5, 7.2, 3),
    ('Sodium', 'mEq/L', 136.0, 145.0, 4),
    ('Potassium', 'mEq/L', 3.5, 5.1, 5),
    ('Chloride', 'mEq/L', 98.0, 106.0, 6),
    ('Calcium', 'mg/dL', 8.5, 10.5, 7)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE (t.test_name ILIKE '%Kidney%' OR t.test_name ILIKE '%KFT%' OR t.test_name ILIKE '%Renal%' OR t.test_name ILIKE '%RFT%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('HbA1c', '%', 4.0, 5.6, 0),
    ('Estimated Avg Glucose', 'mg/dL', 68.0, 114.0, 1),
    ('Fasting Blood Sugar', 'mg/dL', 70.0, 100.0, 2)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE (t.test_name ILIKE '%HbA1c%' OR t.test_name ILIKE '%Glycated%' OR t.test_name ILIKE '%Diabetes%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Color', '', NULL, NULL, 'text', 0),
    ('Appearance', '', NULL, NULL, 'text', 1),
    ('pH', '', 4.5, 8.0, 'number', 2),
    ('Specific Gravity', '', 1.005, 1.030, 'number', 3),
    ('Protein', '', NULL, NULL, 'text', 4),
    ('Glucose', '', NULL, NULL, 'text', 5),
    ('RBC', '/hpf', 0.0, 2.0, 'number', 6),
    ('WBC', '/hpf', 0.0, 5.0, 'number', 7),
    ('Epithelial Cells', '/hpf', 0.0, 5.0, 'number', 8),
    ('Casts', '/lpf', NULL, NULL, 'text', 9)
) AS f(field_name, unit, min_value, max_value, input_type, order_index)
WHERE (t.test_name ILIKE '%Urine%Routine%' OR t.test_name ILIKE '%Urinalysis%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

-- ESR, Blood Group, PBS - Qualitative
INSERT INTO test_fields (id, test_id, field_name, unit, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.input_type, f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('ESR Value', 'mm/hr', 'number', 0)
) AS f(field_name, unit, input_type, order_index)
WHERE (t.test_name ILIKE '%ESR%' OR t.test_name ILIKE '%Sedimentation%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.input_type, f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Blood Group', '', 'text', 0),
    ('Rh Factor', '', 'text', 1)
) AS f(field_name, unit, input_type, order_index)
WHERE (t.test_name ILIKE '%Blood Group%' OR t.test_name ILIKE '%Typing%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.input_type, f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('RBC Morphology', '', 'text', 0),
    ('WBC Morphology', '', 'text', 1),
    ('Platelet Morphology', '', 'text', 2)
) AS f(field_name, unit, input_type, order_index)
WHERE (t.test_name ILIKE '%Blood Smear%' OR t.test_name ILIKE '%PBS%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

-- Blood Sugar Tests
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Blood Sugar', 'mg/dL', 70.0, 100.0, 0)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE (t.test_name ILIKE '%FBS%' OR t.test_name ILIKE '%Fasting%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Blood Sugar PP', 'mg/dL', 100.0, 140.0, 0)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE (t.test_name ILIKE '%PPBS%' OR t.test_name ILIKE '%Post%Prandial%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Random Blood Sugar', 'mg/dL', 70.0, 140.0, 0)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE (t.test_name ILIKE '%RBS%' OR t.test_name ILIKE '%Random%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

-- TSH Only
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('TSH', 'uIU/mL', 0.4, 4.0, 0)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE (t.test_name ILIKE '%TSH%' AND NOT t.test_name ILIKE '%Thyroid Profile%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

-- Stool Routine
INSERT INTO test_fields (id, test_id, field_name, unit, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.input_type, f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Color', '', 'text', 0),
    ('Consistency', '', 'text', 1),
    ('Ova & Cysts', '', 'text', 2),
    ('Parasites', '', 'text', 3),
    ('RBC', '/hpf', 'text', 4),
    ('WBC', '/hpf', 'text', 5),
    ('Fat Globules', '', 'text', 6)
) AS f(field_name, unit, input_type, order_index)
WHERE (t.test_name ILIKE '%Stool%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

-- Serology Tests (Qualitative/Quantitative)
INSERT INTO test_fields (id, test_id, field_name, unit, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.input_type, f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Widal O', '', 'text', 0),
    ('Widal H', '', 'text', 1),
    ('Widal AO', '', 'text', 2),
    ('Widal AH', '', 'text', 3)
) AS f(field_name, unit, input_type, order_index)
WHERE (t.test_name ILIKE '%Widal%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.input_type, f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('VDRL', '', 'text', 0),
    ('Titre', '', 'text', 1)
) AS f(field_name, unit, input_type, order_index)
WHERE (t.test_name ILIKE '%VDRL%' OR t.test_name ILIKE '%Syphilis%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.input_type, f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('HIV Result', '', 'text', 0)
) AS f(field_name, unit, input_type, order_index)
WHERE (t.test_name ILIKE '%HIV%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.input_type, f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('HBsAg', '', 'text', 0)
) AS f(field_name, unit, input_type, order_index)
WHERE (t.test_name ILIKE '%HBsAg%' OR t.test_name ILIKE '%Hepatitis B%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.input_type, f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Anti-HCV', '', 'text', 0)
) AS f(field_name, unit, input_type, order_index)
WHERE (t.test_name ILIKE '%HCV%' OR t.test_name ILIKE '%Hepatitis C%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

-- Immunology & Inflammation
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('CRP', 'mg/L', 0.0, 3.0, 0)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE (t.test_name ILIKE '%CRP%' OR t.test_name ILIKE '%C-Reactive%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.input_type, f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('RA Factor', 'IU/mL', 'text', 0)
) AS f(field_name, unit, input_type, order_index)
WHERE (t.test_name ILIKE '%RA%' OR t.test_name ILIKE '%Rheumatoid%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.input_type, f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('ASO Titre', 'IU/mL', 'text', 0)
) AS f(field_name, unit, input_type, order_index)
WHERE (t.test_name ILIKE '%ASO%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

-- Electrolytes
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Sodium', 'mEq/L', 136.0, 145.0, 0),
    ('Potassium', 'mEq/L', 3.5, 5.1, 1),
    ('Chloride', 'mEq/L', 98.0, 106.0, 2)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE (t.test_name ILIKE '%Electrolytes%' OR t.test_name ILIKE '%Na%K%Cl%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

-- Minerals & Vitamins
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Serum Calcium', 'mg/dL', 8.5, 10.5, 0)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE (t.test_name ILIKE '%Calcium%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Serum Iron', 'ug/dL', 60.0, 170.0, 0),
    ('TIBC', 'ug/dL', 250.0, 425.0, 1)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE (t.test_name ILIKE '%Iron%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Vitamin D', 'ng/mL', 30.0, 100.0, 0)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE (t.test_name ILIKE '%Vitamin D%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Vitamin B12', 'pg/mL', 200.0, 900.0, 0)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE (t.test_name ILIKE '%B12%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

-- Uric Acid & Coagulation
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Serum Uric Acid', 'mg/dL', 3.5, 7.2, 0)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE (t.test_name ILIKE '%Uric Acid%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('PT', 'seconds', 11.0, 13.5, 0),
    ('INR', '', 0.8, 1.1, 1)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE (t.test_name ILIKE '%PT%' OR t.test_name ILIKE '%INR%' OR t.test_name ILIKE '%Prothrombin%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

-- Dengue, Malaria, Culture
INSERT INTO test_fields (id, test_id, field_name, unit, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.input_type, f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Dengue NS1', '', 'text', 0)
) AS f(field_name, unit, input_type, order_index)
WHERE (t.test_name ILIKE '%Dengue NS1%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.input_type, f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('IgM', '', 'text', 0),
    ('IgG', '', 'text', 1)
) AS f(field_name, unit, input_type, order_index)
WHERE (t.test_name ILIKE '%Dengue IgM%' OR t.test_name ILIKE '%Dengue IgG%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.input_type, f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Malaria', '', 'text', 0)
) AS f(field_name, unit, input_type, order_index)
WHERE (t.test_name ILIKE '%Malaria%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.input_type, f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Organism', '', 'text', 0),
    ('Sensitivity', '', 'text', 1)
) AS f(field_name, unit, input_type, order_index)
WHERE (t.test_name ILIKE '%Culture%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

-- Andrology & Pregnancy
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Count', 'million/mL', 15.0, 200.0, 0),
    ('Motility', '%', 40.0, 100.0, 1),
    ('Morphology', '%', 30.0, 100.0, 2)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE (t.test_name ILIKE '%Semen%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.input_type, f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('hCG Result', '', 'text', 0)
) AS f(field_name, unit, input_type, order_index)
WHERE (t.test_name ILIKE '%Pregnancy%' OR t.test_name ILIKE '%UPT%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

-- Pancreatic & Cardiac
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Serum Amylase', 'U/L', 30.0, 110.0, 0)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE (t.test_name ILIKE '%Amylase%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Serum Lipase', 'U/L', 30.0, 110.0, 0)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE (t.test_name ILIKE '%Lipase%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Troponin I', 'ng/mL', 0.0, 0.04, 0)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE (t.test_name ILIKE '%Troponin%' OR t.test_name ILIKE '%Cardiac%')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

-- ============================================
-- Calculated default formulas
-- ============================================

UPDATE test_fields
SET field_type = 'calculated',
        formula = 'Triglycerides / 5',
        depends_on = '["Triglycerides"]'
WHERE field_name = 'VLDL Cholesterol'
    AND test_id IN (SELECT id FROM tests WHERE LOWER(test_name) LIKE '%lipid%');

UPDATE test_fields
SET field_type = 'calculated',
        formula = 'Total Cholesterol - HDL Cholesterol - Triglycerides / 5',
        depends_on = '["Total Cholesterol", "HDL Cholesterol", "Triglycerides"]'
WHERE field_name = 'LDL Cholesterol'
    AND test_id IN (SELECT id FROM tests WHERE LOWER(test_name) LIKE '%lipid%');

UPDATE test_fields
SET field_type = 'calculated',
        formula = 'Total Cholesterol / HDL Cholesterol',
        depends_on = '["Total Cholesterol", "HDL Cholesterol"]'
WHERE (field_name ILIKE '%tc/hdl%' OR field_name ILIKE '%cholesterol ratio%')
    AND test_id IN (SELECT id FROM tests WHERE LOWER(test_name) LIKE '%lipid%');

UPDATE test_fields
SET field_type = 'calculated',
        formula = 'LDL Cholesterol / HDL Cholesterol',
        depends_on = '["LDL Cholesterol", "HDL Cholesterol"]'
WHERE field_name ILIKE '%ldl/hdl%'
    AND test_id IN (SELECT id FROM tests WHERE LOWER(test_name) LIKE '%lipid%');

UPDATE test_fields
SET field_type = 'calculated',
        formula = '28.7 * HbA1c - 46.7',
        depends_on = '["HbA1c"]'
WHERE (field_name ILIKE '%estimated%glucose%' OR field_name ILIKE '%eAG%')
    AND test_id IN (SELECT id FROM tests WHERE LOWER(test_name) LIKE '%hba1c%' OR LOWER(test_name) LIKE '%glycated%');

UPDATE test_fields
SET field_type = 'calculated',
        formula = 'Albumin / Globulin',
        depends_on = '["Albumin", "Globulin"]'
WHERE (field_name ILIKE '%a/g ratio%' OR field_name ILIKE '%albumin globulin ratio%')
    AND test_id IN (SELECT id FROM tests WHERE LOWER(test_name) LIKE '%liver%' OR LOWER(test_name) LIKE '%lft%');

UPDATE test_fields
SET field_type = 'calculated',
        formula = 'Total Protein - Albumin',
        depends_on = '["Total Protein", "Albumin"]'
WHERE field_name = 'Globulin'
    AND test_id IN (SELECT id FROM tests WHERE LOWER(test_name) LIKE '%liver%' OR LOWER(test_name) LIKE '%lft%');

UPDATE test_fields
SET field_type = 'calculated',
        formula = 'Blood Urea / 2.14',
        depends_on = '["Blood Urea"]'
WHERE field_name = 'BUN'
    AND test_id IN (SELECT id FROM tests WHERE LOWER(test_name) LIKE '%renal%' OR LOWER(test_name) LIKE '%kft%' OR LOWER(test_name) LIKE '%kidney%');

UPDATE test_fields
SET field_type = 'calculated',
        formula = '(Hematocrit / RBC Count) * 10',
        depends_on = '["Hematocrit", "RBC Count"]'
WHERE field_name = 'MCV'
    AND test_id IN (SELECT id FROM tests WHERE LOWER(test_name) LIKE '%cbc%' OR LOWER(test_name) LIKE '%complete blood count%');

UPDATE test_fields
SET field_type = 'calculated',
        formula = '(Hemoglobin / RBC Count) * 10',
        depends_on = '["Hemoglobin", "RBC Count"]'
WHERE field_name = 'MCH'
    AND test_id IN (SELECT id FROM tests WHERE LOWER(test_name) LIKE '%cbc%' OR LOWER(test_name) LIKE '%complete blood count%');

UPDATE test_fields
SET field_type = 'calculated',
        formula = '(Hemoglobin / Hematocrit) * 100',
        depends_on = '["Hemoglobin", "Hematocrit"]'
WHERE field_name = 'MCHC'
    AND test_id IN (SELECT id FROM tests WHERE LOWER(test_name) LIKE '%cbc%' OR LOWER(test_name) LIKE '%complete blood count%');

-- ============================================
-- Backfill missing parameters for seeded tests
-- ============================================

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value::numeric, f.max_value::numeric, f.input_type, f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Result', '', NULL, NULL, 'text', 0),
    ('Interpretation', '', NULL, NULL, 'text', 1)
) AS f(field_name, unit, min_value, max_value, input_type, order_index)
WHERE t.test_code IN ('WIDAL-01', 'VDRL-01', 'HIV-01', 'HBSAG-01', 'HCV-01', 'DENGNS1-01', 'DENGIGG-01', 'MALAR-01', 'UPT-01')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value::numeric, f.max_value::numeric, f.input_type, f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('O Titer', '', NULL, NULL, 'text', 0),
    ('H Titer', '', NULL, NULL, 'text', 1),
    ('Interpretation', '', NULL, NULL, 'text', 2)
) AS f(field_name, unit, min_value, max_value, input_type, order_index)
WHERE t.test_code = 'WIDAL-01'
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value::numeric, f.max_value::numeric, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('CRP', 'mg/L', 0.0, 100.0, 0)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE t.test_code = 'CRP-01'
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value::numeric, f.max_value::numeric, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Rheumatoid Factor', 'IU/mL', 0.0, 200.0, 0)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE t.test_code = 'RAF-01'
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value::numeric, f.max_value::numeric, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('ASO Titer', 'IU/mL', 0.0, 1000.0, 0)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE t.test_code = 'ASO-01'
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value::numeric, f.max_value::numeric, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Sodium', 'mEq/L', 135.0, 145.0, 0),
    ('Potassium', 'mEq/L', 3.5, 5.1, 1),
    ('Chloride', 'mEq/L', 98.0, 106.0, 2)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE t.test_code = 'ELEC-01'
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value::numeric, f.max_value::numeric, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Serum Calcium', 'mg/dL', 8.5, 10.5, 0)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE t.test_code = 'CALC-01'
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Serum Iron', 'ug/dL', 50.0, 170.0, 0),
    ('TIBC', 'ug/dL', 250.0, 450.0, 1),
    ('UIBC', 'ug/dL', 150.0, 375.0, 2)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE t.test_code = 'IRON-01'
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Vitamin D', 'ng/mL', 0.0, 100.0, 0)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE t.test_code = 'VITD-01'
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Vitamin B12', 'pg/mL', 100.0, 900.0, 0)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE t.test_code = 'VITB12-01'
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Serum Uric Acid', 'mg/dL', 3.5, 7.2, 0)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE t.test_code = 'URIC-01'
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('PT', 'seconds', 9.0, 13.5, 0),
    ('INR', '', 0.8, 1.2, 1)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE t.test_code = 'PTINR-01'
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Troponin I', 'ng/mL', 0.0, 0.04, 0)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE t.test_code = 'TROP-01'
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value::numeric, f.max_value::numeric, f.input_type, f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Result', '', NULL, NULL, 'text', 0),
    ('Remarks', '', NULL, NULL, 'text', 1)
) AS f(field_name, unit, min_value, max_value, input_type, order_index)
WHERE t.test_code IN ('UCULT-01', 'BCULT-01', 'MALAR-01')
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value::numeric, f.max_value::numeric, f.input_type, f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Volume', 'mL', 1.5, 6.0, 'number', 0),
    ('Sperm Count', 'million/mL', 15.0, 300.0, 'number', 1),
    ('Motility', '%', 40.0, 100.0, 'number', 2),
    ('Morphology', '%', 4.0, 100.0, 'number', 3),
    ('Liquefaction Time', 'minutes', 15.0, 60.0, 'number', 4)
) AS f(field_name, unit, min_value, max_value, input_type, order_index)
WHERE t.test_code = 'SEMEN-01'
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value::numeric, f.max_value::numeric, f.input_type, f.order_index
FROM tests t
CROSS JOIN (VALUES
    ('Color', '', NULL, NULL, 'text', 0),
    ('Appearance', '', NULL, NULL, 'text', 1),
    ('pH', '', 4.5, 8.0, 'number', 2),
    ('Specific Gravity', '', 1.005, 1.030, 'number', 3),
    ('Sediment', '', NULL, NULL, 'text', 4)
) AS f(field_name, unit, min_value, max_value, input_type, order_index)
WHERE t.test_code = 'STOOL-01'
    AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT
    gen_random_uuid(),
    t.id,
    'Result',
    '',
    NULL::numeric,
    NULL::numeric,
    'text',
    0
FROM tests t
WHERE NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);


-- ============================================
-- PRODUCTION PATHOLOGY TEST CATALOG EXPANSION
-- ============================================

-- ============================================
-- PRODUCTION-GRADE PATHOLOGY LABORATORY EXPANSION
-- Migration 006: Comprehensive Test Catalog (100+ Tests)
-- ============================================
-- Purpose: Expand from 40 to 100+ tests with comprehensive test fields,
--          reference ranges by age/gender, test packages, and calculated fields
-- Idempotent: Safe to run multiple times
-- ============================================

-- ============================================
-- 1. CREATE NEW TABLES FOR REFERENCE RANGES
-- ============================================

CREATE TABLE IF NOT EXISTS test_reference_ranges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_field_id UUID NOT NULL REFERENCES test_fields(id) ON DELETE CASCADE,
    gender VARCHAR(20) DEFAULT 'Any', -- Male, Female, Any
    age_min INTEGER DEFAULT 0,
    age_max INTEGER DEFAULT 120,
    min_value DECIMAL(15,4),
    max_value DECIMAL(15,4),
    critical_low DECIMAL(15,4),
    critical_high DECIMAL(15,4),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(test_field_id, gender, age_min, age_max)
);

CREATE INDEX IF NOT EXISTS idx_test_reference_ranges_test_field ON test_reference_ranges(test_field_id);
CREATE INDEX IF NOT EXISTS idx_test_reference_ranges_gender_age ON test_reference_ranges(gender, age_min, age_max);

-- ============================================
-- 2. CREATE TEST PACKAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS test_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_name VARCHAR(255) NOT NULL,
    package_code VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100),
    description TEXT,
    price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_test_packages_code ON test_packages(package_code);
CREATE INDEX IF NOT EXISTS idx_test_packages_active ON test_packages(is_active);

-- ============================================
-- 3. CREATE PACKAGE-TEST MAPPING TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS package_test_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES test_packages(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(package_id, test_id)
);

CREATE INDEX IF NOT EXISTS idx_package_test_mapping_package ON package_test_mapping(package_id);
CREATE INDEX IF NOT EXISTS idx_package_test_mapping_test ON package_test_mapping(test_id);

-- ============================================
-- 4. ADD FORMULA SUPPORT TO TEST_FIELDS
-- ============================================

ALTER TABLE test_fields ADD COLUMN IF NOT EXISTS formula TEXT;
ALTER TABLE test_fields ADD COLUMN IF NOT EXISTS depends_on JSONB DEFAULT '[]';
ALTER TABLE test_fields ADD COLUMN IF NOT EXISTS field_type VARCHAR(50) DEFAULT 'input'; -- input, calculated, reference

-- ============================================
-- SECTION 5: INSERT 100+ PATHOLOGY TESTS
-- ============================================

-- HEMATOLOGY TESTS --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Complete Blood Count (CBC)', 'CBC-01', 'Hematology', 'Blood', 250, 4, 'Comprehensive blood cell count including RBC, WBC, platelets', NOW(), NOW()),
  (gen_random_uuid(), 'ESR (Erythrocyte Sedimentation Rate)', 'ESR-01', 'Hematology', 'Blood', 100, 2, 'Measures inflammatory response', NOW(), NOW()),
  (gen_random_uuid(), 'Blood Group & Rh Typing', 'BG-01', 'Hematology', 'Blood', 150, 1, 'ABO blood group and Rh factor determination', NOW(), NOW()),
  (gen_random_uuid(), 'Peripheral Blood Smear', 'PBS-01', 'Hematology', 'Blood', 200, 6, 'Microscopic examination of blood cells', NOW(), NOW()),
  (gen_random_uuid(), 'PT/INR (Prothrombin Time)', 'PTINR-01', 'Hematology', 'Blood', 250, 4, 'Coagulation profile - PT/INR', NOW(), NOW()),
  (gen_random_uuid(), 'aPTT (Activated Partial Thromboplastin Time)', 'APTT-01', 'Hematology', 'Blood', 250, 4, 'Intrinsic coagulation pathway test', NOW(), NOW()),
  (gen_random_uuid(), 'Bleeding Time', 'BT-01', 'Hematology', 'Blood', 150, 2, 'Platelet function screening test', NOW(), NOW()),
  (gen_random_uuid(), 'Clotting Time', 'CT-01', 'Hematology', 'Blood', 150, 2, 'Extrinsic coagulation pathway test', NOW(), NOW()),
  (gen_random_uuid(), 'Fibrinogen', 'FIBR-01', 'Hematology', 'Blood', 300, 4, 'Blood clotting factor measurement', NOW(), NOW()),
  (gen_random_uuid(), 'D-Dimer', 'DD-01', 'Hematology', 'Blood', 400, 4, 'Thrombosis and fibrinolysis marker', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- BIOCHEMISTRY - ROUTINE TESTS --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Lipid Profile', 'LIPID-01', 'Biochemistry', 'Blood', 350, 6, 'Cholesterol, HDL, LDL, VLDL, Triglycerides', NOW(), NOW()),
  (gen_random_uuid(), 'Liver Function Test (LFT)', 'LFT-01', 'Biochemistry', 'Blood', 400, 6, 'Bilirubin, SGOT, SGPT, ALP, Proteins', NOW(), NOW()),
  (gen_random_uuid(), 'Kidney Function Test (KFT)', 'KFT-01', 'Biochemistry', 'Blood', 450, 6, 'Urea, Creatinine, Electrolytes, eGFR', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Electrolytes (Na/K/Cl)', 'ELEC-01', 'Biochemistry', 'Blood', 300, 4, 'Sodium, Potassium, Chloride, CO2', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Calcium', 'CALC-01', 'Biochemistry', 'Blood', 150, 4, 'Total and ionized calcium measurement', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Phosphorus', 'PHOS-01', 'Biochemistry', 'Blood', 150, 4, 'Inorganic phosphorus level', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Magnesium', 'MAG-01', 'Biochemistry', 'Blood', 150, 4, 'Magnesium level measurement', NOW(), NOW()),
  (gen_random_uuid(), 'CRP (C-Reactive Protein)', 'CRP-01', 'Biochemistry', 'Blood', 250, 4, 'Inflammation marker', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Amylase', 'AMYL-01', 'Biochemistry', 'Blood', 250, 4, 'Pancreatic enzyme measurement', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Lipase', 'LIPAS-01', 'Biochemistry', 'Blood', 300, 4, 'Pancreatic lipase measurement', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- BLOOD SUGAR TESTS --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Blood Sugar Fasting (FBS)', 'FBS-01', 'Biochemistry', 'Blood', 80, 2, 'Fasting glucose level', NOW(), NOW()),
  (gen_random_uuid(), 'Blood Sugar PP (Post Prandial)', 'PPBS-01', 'Biochemistry', 'Blood', 80, 2, 'Post-meal glucose measurement', NOW(), NOW()),
  (gen_random_uuid(), 'Random Blood Sugar (RBS)', 'RBS-01', 'Biochemistry', 'Blood', 80, 1, 'Random glucose level', NOW(), NOW()),
  (gen_random_uuid(), 'HbA1c (Glycated Hemoglobin)', 'HBA1C-01', 'Biochemistry', 'Blood', 350, 4, 'Average blood sugar over 3 months', NOW(), NOW()),
  (gen_random_uuid(), 'Oral Glucose Tolerance Test (OGTT)', 'OGTT-01', 'Biochemistry', 'Blood', 400, 4, 'Glucose tolerance assessment', NOW(), NOW()),
  (gen_random_uuid(), 'GTT (2-hour)', 'GTT-01', 'Biochemistry', 'Blood', 350, 4, '2-hour glucose tolerance test', NOW(), NOW()),
  (gen_random_uuid(), 'Fasting Insulin', 'INS-F-01', 'Biochemistry', 'Blood', 300, 4, 'Fasting insulin level', NOW(), NOW()),
  (gen_random_uuid(), 'C-Peptide', 'CPEP-01', 'Biochemistry', 'Blood', 350, 4, 'Beta cell function assessment', NOW(), NOW()),
  (gen_random_uuid(), 'Microalbumin (Urine)', 'MALB-01', 'Biochemistry', 'Urine', 200, 4, 'Urine microalbumin for diabetes screening', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- THYROID TESTS --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'TSH (Thyroid Stimulating Hormone)', 'TSH-01', 'Hormone', 'Blood', 200, 4, 'Thyroid function screening', NOW(), NOW()),
  (gen_random_uuid(), 'Free T3', 'FT3-01', 'Hormone', 'Blood', 300, 4, 'Free triiodothyronine level', NOW(), NOW()),
  (gen_random_uuid(), 'Free T4', 'FT4-01', 'Hormone', 'Blood', 300, 4, 'Free thyroxine level', NOW(), NOW()),
  (gen_random_uuid(), 'Total T3', 'T3-01', 'Hormone', 'Blood', 250, 4, 'Total triiodothyronine level', NOW(), NOW()),
  (gen_random_uuid(), 'Total T4', 'T4-01', 'Hormone', 'Blood', 250, 4, 'Total thyroxine level', NOW(), NOW()),
  (gen_random_uuid(), 'Anti-TPO (Thyroid Peroxidase Antibodies)', 'ATPO-01', 'Immunology', 'Blood', 400, 4, 'Autoimmune thyroid marker', NOW(), NOW()),
  (gen_random_uuid(), 'Anti-Thyroglobulin', 'ATG-01', 'Immunology', 'Blood', 400, 4, 'Thyroid antibodies', NOW(), NOW()),
  (gen_random_uuid(), 'Thyroglobulin', 'TG-01', 'Hormone', 'Blood', 350, 4, 'Thyroid hormone precursor', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- REPRODUCTIVE HORMONES --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'FSH (Follicle Stimulating Hormone)', 'FSH-01', 'Hormone', 'Blood', 350, 4, 'Reproductive hormone - pituitary', NOW(), NOW()),
  (gen_random_uuid(), 'LH (Luteinizing Hormone)', 'LH-01', 'Hormone', 'Blood', 350, 4, 'Reproductive hormone - pituitary', NOW(), NOW()),
  (gen_random_uuid(), 'Prolactin', 'PROL-01', 'Hormone', 'Blood', 350, 4, 'Milk production hormone', NOW(), NOW()),
  (gen_random_uuid(), 'Testosterone', 'TEST-01', 'Hormone', 'Blood', 400, 4, 'Male reproductive hormone', NOW(), NOW()),
  (gen_random_uuid(), 'Free Testosterone', 'FTEST-01', 'Hormone', 'Blood', 450, 4, 'Bioavailable testosterone', NOW(), NOW()),
  (gen_random_uuid(), 'Estradiol', 'ESTR-01', 'Hormone', 'Blood', 400, 4, 'Female reproductive hormone', NOW(), NOW()),
  (gen_random_uuid(), 'Progesterone', 'PROG-01', 'Hormone', 'Blood', 400, 4, 'Luteal phase hormone', NOW(), NOW()),
  (gen_random_uuid(), 'AMH (Anti-Müllerian Hormone)', 'AMH-01', 'Hormone', 'Blood', 500, 4, 'Ovarian reserve marker', NOW(), NOW()),
  (gen_random_uuid(), 'Beta-HCG (Quantitative)', 'BHCG-Q-01', 'Hormone', 'Blood', 250, 2, 'Pregnancy hormone (quantitative)', NOW(), NOW()),
  (gen_random_uuid(), 'Beta-HCG (Qualitative)', 'BHCG-QL-01', 'Hormone', 'Blood', 100, 1, 'Pregnancy hormone (yes/no)', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- ADRENAL & PITUITARY HORMONES --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Cortisol (8 AM)', 'CORT-AM-01', 'Hormone', 'Blood', 400, 4, 'Morning cortisol level', NOW(), NOW()),
  (gen_random_uuid(), 'Cortisol (4 PM)', 'CORT-PM-01', 'Hormone', 'Blood', 400, 4, 'Afternoon cortisol level', NOW(), NOW()),
  (gen_random_uuid(), 'ACTH (Adrenocorticotropic Hormone)', 'ACTH-01', 'Hormone', 'Blood', 450, 4, 'Pituitary hormone', NOW(), NOW()),
  (gen_random_uuid(), 'PTH (Parathyroid Hormone)', 'PTH-01', 'Hormone', 'Blood', 400, 4, 'Calcium-regulating hormone', NOW(), NOW()),
  (gen_random_uuid(), 'Growth Hormone', 'GH-01', 'Hormone', 'Blood', 450, 4, 'Somatotropin hormone', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- SERUM IRON STUDIES --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Serum Iron', 'IRON-01', 'Biochemistry', 'Blood', 200, 4, 'Iron level measurement', NOW(), NOW()),
  (gen_random_uuid(), 'TIBC (Total Iron Binding Capacity)', 'TIBC-01', 'Biochemistry', 'Blood', 200, 4, 'Iron binding protein capacity', NOW(), NOW()),
  (gen_random_uuid(), 'Ferritin', 'FERR-01', 'Biochemistry', 'Blood', 300, 4, 'Iron storage protein', NOW(), NOW()),
  (gen_random_uuid(), 'Iron Saturation', 'IROS-01', 'Biochemistry', 'Blood', 200, 4, 'Percentage saturation', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- VITAMINS & NUTRITION --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Vitamin D (25-Hydroxy)', 'VITD-01', 'Biochemistry', 'Blood', 600, 12, 'Vitamin D status assessment', NOW(), NOW()),
  (gen_random_uuid(), 'Vitamin B12', 'VITB12-01', 'Biochemistry', 'Blood', 500, 12, 'Cobalamin level', NOW(), NOW()),
  (gen_random_uuid(), 'Folic Acid', 'FOLIC-01', 'Biochemistry', 'Blood', 450, 12, 'Folate level assessment', NOW(), NOW()),
  (gen_random_uuid(), 'Vitamin B1 (Thiamine)', 'VITB1-01', 'Biochemistry', 'Blood', 400, 12, 'Thiamine level', NOW(), NOW()),
  (gen_random_uuid(), 'Vitamin B6 (Pyridoxine)', 'VITB6-01', 'Biochemistry', 'Blood', 400, 12, 'Pyridoxine level', NOW(), NOW()),
  (gen_random_uuid(), 'Vitamin C', 'VITC-01', 'Biochemistry', 'Blood', 450, 12, 'Ascorbic acid level', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- CARDIAC MARKERS --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Troponin I (Cardiac Marker)', 'TROP-01', 'Biochemistry', 'Blood', 500, 2, 'Cardiac muscle damage marker', NOW(), NOW()),
  (gen_random_uuid(), 'CK-MB (Creatine Kinase MB)', 'CKMB-01', 'Biochemistry', 'Blood', 350, 4, 'Cardiac enzyme', NOW(), NOW()),
  (gen_random_uuid(), 'MyoGlobin', 'MYO-01', 'Biochemistry', 'Blood', 300, 4, 'Myocardial injury marker', NOW(), NOW()),
  (gen_random_uuid(), 'NT-ProBNP', 'NTPNB-01', 'Biochemistry', 'Blood', 600, 4, 'Heart failure marker', NOW(), NOW()),
  (gen_random_uuid(), 'BNP (B-type Natriuretic Peptide)', 'BNP-01', 'Biochemistry', 'Blood', 500, 4, 'Cardiac stress marker', NOW(), NOW()),
  (gen_random_uuid(), 'Homocysteine', 'HCYS-01', 'Biochemistry', 'Blood', 400, 4, 'Cardiovascular risk marker', NOW(), NOW()),
  (gen_random_uuid(), 'Apolipoprotein A1 (Apo A1)', 'APOA1-01', 'Biochemistry', 'Blood', 350, 4, 'HDL component', NOW(), NOW()),
  (gen_random_uuid(), 'Apolipoprotein B (Apo B)', 'APOB-01', 'Biochemistry', 'Blood', 350, 4, 'LDL component', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- URIC ACID & GOUT --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Serum Uric Acid', 'URIC-01', 'Biochemistry', 'Blood', 150, 4, 'Uric acid for gout screening', NOW(), NOW()),
  (gen_random_uuid(), 'Urine Uric Acid (24-hour)', 'U-URIC-24-01', 'Biochemistry', 'Urine', 200, 4, 'Urine uric acid excretion', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- TUMOR MARKERS --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'PSA (Prostate Specific Antigen)', 'PSA-01', 'Biochemistry', 'Blood', 400, 4, 'Prostate cancer marker', NOW(), NOW()),
  (gen_random_uuid(), 'Free PSA', 'FREE-PSA-01', 'Biochemistry', 'Blood', 450, 4, 'Free PSA percentage', NOW(), NOW()),
  (gen_random_uuid(), 'CA-125', 'CA125-01', 'Biochemistry', 'Blood', 500, 4, 'Ovarian cancer marker', NOW(), NOW()),
  (gen_random_uuid(), 'CA 19-9', 'CA199-01', 'Biochemistry', 'Blood', 500, 4, 'Pancreatic cancer marker', NOW(), NOW()),
  (gen_random_uuid(), 'CEA (Carcinoembryonic Antigen)', 'CEA-01', 'Biochemistry', 'Blood', 450, 4, 'Colorectal cancer marker', NOW(), NOW()),
  (gen_random_uuid(), 'AFP (Alpha-Fetoprotein)', 'AFP-01', 'Biochemistry', 'Blood', 450, 4, 'Liver cancer marker', NOW(), NOW()),
  (gen_random_uuid(), 'Beta-HCG (Tumor Marker)', 'BHCG-TM-01', 'Biochemistry', 'Blood', 300, 4, 'Germ cell tumor marker', NOW(), NOW()),
  (gen_random_uuid(), 'HER2/neu', 'HER2-01', 'Biochemistry', 'Blood', 600, 4, 'Breast cancer marker', NOW(), NOW()),
  (gen_random_uuid(), 'S100 Protein', 'S100-01', 'Biochemistry', 'Blood', 400, 4, 'Melanoma marker', NOW(), NOW()),
  (gen_random_uuid(), 'Calcitonin', 'CALC-TM-01', 'Hormone', 'Blood', 500, 4, 'Thyroid medullary cancer marker', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- SEROLOGY - INFECTIOUS DISEASES --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Widal Test', 'WIDAL-01', 'Serology', 'Blood', 200, 4, 'Typhoid fever antibodies', NOW(), NOW()),
  (gen_random_uuid(), 'VDRL (Syphilis Screening)', 'VDRL-01', 'Serology', 'Blood', 200, 4, 'Syphilis screening test', NOW(), NOW()),
  (gen_random_uuid(), 'RPR (Rapid Plasma Reagin)', 'RPR-01', 'Serology', 'Blood', 200, 4, 'Syphilis detection test', NOW(), NOW()),
  (gen_random_uuid(), 'FTA-ABS (Syphilis Confirmation)', 'FTAABS-01', 'Serology', 'Blood', 300, 4, 'Syphilis confirmation test', NOW(), NOW()),
  (gen_random_uuid(), 'HIV I & II (ELISA)', 'HIV-01', 'Serology', 'Blood', 300, 6, 'HIV antibody screening', NOW(), NOW()),
  (gen_random_uuid(), 'HIV Rapid Test', 'HIV-RAPID-01', 'Serology', 'Blood', 150, 1, 'Rapid HIV screening', NOW(), NOW()),
  (gen_random_uuid(), 'HBsAg (Hepatitis B Surface Antigen)', 'HBSAG-01', 'Serology', 'Blood', 250, 4, 'Hepatitis B screening', NOW(), NOW()),
  (gen_random_uuid(), 'Anti-HBc (Hepatitis B Core Antibodies)', 'AHBC-01', 'Serology', 'Blood', 250, 4, 'Hepatitis B exposure', NOW(), NOW()),
  (gen_random_uuid(), 'Anti-HBs (Hepatitis B Surface Antibodies)', 'AHBS-01', 'Serology', 'Blood', 250, 4, 'Hepatitis B immunity', NOW(), NOW()),
  (gen_random_uuid(), 'HBeAg (Hepatitis B E Antigen)', 'HBEAG-01', 'Serology', 'Blood', 300, 4, 'Hepatitis B viral load', NOW(), NOW()),
  (gen_random_uuid(), 'Anti-HCV (Hepatitis C)', 'HCV-01', 'Serology', 'Blood', 300, 6, 'Hepatitis C screening', NOW(), NOW()),
  (gen_random_uuid(), 'HCV RNA (Hepatitis C Viral Load)', 'HCV-RNA-01', 'Serology', 'Blood', 600, 4, 'Hepatitis C PCR quantification', NOW(), NOW()),
  (gen_random_uuid(), 'Anti-HAV IgM (Hepatitis A)', 'AHAV-IGM-01', 'Serology', 'Blood', 250, 4, 'Acute Hepatitis A infection', NOW(), NOW()),
  (gen_random_uuid(), 'Anti-HAV IgG (Hepatitis A)', 'AHAV-IGG-01', 'Serology', 'Blood', 250, 4, 'Hepatitis A immunity', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- SEROLOGY - VIRAL DISEASES --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Dengue NS1 Antigen', 'DENGNS1-01', 'Serology', 'Blood', 500, 4, 'Early dengue detection', NOW(), NOW()),
  (gen_random_uuid(), 'Dengue IgM / IgG', 'DENGIGG-01', 'Serology', 'Blood', 500, 4, 'Dengue antibodies', NOW(), NOW()),
  (gen_random_uuid(), 'Chikungunya IgM', 'CHIK-IGM-01', 'Serology', 'Blood', 400, 4, 'Acute chikungunya infection', NOW(), NOW()),
  (gen_random_uuid(), 'Zika IgM', 'ZIKA-IGM-01', 'Serology', 'Blood', 400, 4, 'Zika virus antibodies', NOW(), NOW()),
  (gen_random_uuid(), 'CMV IgM', 'CMV-IGM-01', 'Serology', 'Blood', 350, 4, 'Acute CMV infection', NOW(), NOW()),
  (gen_random_uuid(), 'CMV IgG', 'CMV-IGG-01', 'Serology', 'Blood', 350, 4, 'CMV immunity status', NOW(), NOW()),
  (gen_random_uuid(), 'EBV VCA IgM', 'EBV-VCA-IGM-01', 'Serology', 'Blood', 350, 4, 'Acute EBV infection', NOW(), NOW()),
  (gen_random_uuid(), 'EBV VCA IgG', 'EBV-VCA-IGG-01', 'Serology', 'Blood', 350, 4, 'Past EBV infection', NOW(), NOW()),
  (gen_random_uuid(), 'Measles IgM', 'MEASLES-IGM-01', 'Serology', 'Blood', 350, 4, 'Acute measles', NOW(), NOW()),
  (gen_random_uuid(), 'Mumps IgM', 'MUMPS-IGM-01', 'Serology', 'Blood', 350, 4, 'Acute mumps', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- IMMUNOLOGY --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'RA Factor (Rheumatoid Factor)', 'RAF-01', 'Immunology', 'Blood', 300, 4, 'Rheumatoid arthritis marker', NOW(), NOW()),
  (gen_random_uuid(), 'Anti-CCP (Cyclic Citrullinated Peptide)', 'ANTICCP-01', 'Immunology', 'Blood', 450, 4, 'RA-specific antibody', NOW(), NOW()),
  (gen_random_uuid(), 'ASO Titre (Anti-Streptolysin O)', 'ASO-01', 'Immunology', 'Blood', 250, 4, 'Streptococcal infection', NOW(), NOW()),
  (gen_random_uuid(), 'ANA (Antinuclear Antibodies)', 'ANA-01', 'Immunology', 'Blood', 400, 4, 'Autoimmune disease screening', NOW(), NOW()),
  (gen_random_uuid(), 'Anti-dsDNA', 'ANTIDSDNA-01', 'Immunology', 'Blood', 450, 4, 'SLE-specific antibody', NOW(), NOW()),
  (gen_random_uuid(), 'Complement C3', 'C3-01', 'Immunology', 'Blood', 400, 4, 'Complement system component', NOW(), NOW()),
  (gen_random_uuid(), 'Complement C4', 'C4-01', 'Immunology', 'Blood', 400, 4, 'Complement system component', NOW(), NOW()),
  (gen_random_uuid(), 'Immunoglobulin A (IgA)', 'IGA-01', 'Immunology', 'Blood', 350, 4, 'Immune response antibody', NOW(), NOW()),
  (gen_random_uuid(), 'Immunoglobulin G (IgG)', 'IGG-01', 'Immunology', 'Blood', 350, 4, 'Primary immune antibody', NOW(), NOW()),
  (gen_random_uuid(), 'Immunoglobulin M (IgM)', 'IGM-01', 'Immunology', 'Blood', 350, 4, 'Acute immune response', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- MICROBIOLOGY - CULTURE TESTS --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Malaria Antigen (Rapid Card)', 'MALAR-01', 'Microbiology', 'Blood', 250, 1, 'Rapid malaria screening', NOW(), NOW()),
  (gen_random_uuid(), 'Urine Routine & Microscopy', 'URINE-01', 'Clinical Pathology', 'Urine', 150, 3, 'Complete urine analysis', NOW(), NOW()),
  (gen_random_uuid(), 'Urine Culture & Sensitivity', 'UCULT-01', 'Microbiology', 'Urine', 500, 48, 'UTI pathogen identification', NOW(), NOW()),
  (gen_random_uuid(), 'Blood Culture & Sensitivity', 'BCULT-01', 'Microbiology', 'Blood', 700, 72, 'Bloodstream infection detection', NOW(), NOW()),
  (gen_random_uuid(), 'Stool Routine & Microscopy', 'STOOL-01', 'Clinical Pathology', 'Stool', 150, 3, 'Parasites and microbes', NOW(), NOW()),
  (gen_random_uuid(), 'Stool Culture & Sensitivity', 'SCULT-01', 'Microbiology', 'Stool', 600, 48, 'Bacterial pathogens', NOW(), NOW()),
  (gen_random_uuid(), 'Sputum Culture & Sensitivity', 'SPCULT-01', 'Microbiology', 'Sputum', 600, 48, 'Respiratory infection pathogens', NOW(), NOW()),
  (gen_random_uuid(), 'Pus Culture & Sensitivity', 'PCULT-01', 'Microbiology', 'Pus', 600, 48, 'Wound/abscess pathogens', NOW(), NOW()),
  (gen_random_uuid(), 'Throat Swab Culture', 'TCULT-01', 'Microbiology', 'Throat Swab', 500, 48, 'Streptococcus and pathogens', NOW(), NOW()),
  (gen_random_uuid(), 'Fungal Culture', 'FCULT-01', 'Microbiology', 'Various', 700, 72, 'Fungal pathogen identification', NOW(), NOW()),
  (gen_random_uuid(), 'KOH Preparation (Fungal)', 'KOH-01', 'Microbiology', 'Various', 200, 2, 'Fungal elements detection', NOW(), NOW()),
  (gen_random_uuid(), 'TB Culture (Sputum)', 'TBCULT-01', 'Microbiology', 'Sputum', 1000, 72, 'Tuberculosis detection', NOW(), NOW()),
  (gen_random_uuid(), 'TB GENE XPERT (Rapid TB)', 'TB-XPERT-01', 'Microbiology', 'Sputum', 800, 2, 'Rapid TB detection', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- HISTOPATHOLOGY & CYTOLOGY --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'FNAC (Fine Needle Aspiration Cytology)', 'FNAC-01', 'Histopathology', 'Tissue', 1500, 5, 'Needle aspiration cytology', NOW(), NOW()),
  (gen_random_uuid(), 'PAP Smear (Cervical Cytology)', 'PAP-01', 'Cytology', 'Cervical', 500, 3, 'Cervical cancer screening', NOW(), NOW()),
  (gen_random_uuid(), 'Biopsy Examination', 'BIOPSY-01', 'Histopathology', 'Tissue', 2000, 7, 'Tissue diagnosis', NOW(), NOW()),
  (gen_random_uuid(), 'Bone Marrow Examination', 'BM-01', 'Histopathology', 'Bone Marrow', 2500, 5, 'Hematologic malignancy investigation', NOW(), NOW()),
  (gen_random_uuid(), 'CSF Analysis', 'CSF-01', 'Clinical Pathology', 'CSF', 800, 4, 'Cerebrospinal fluid analysis', NOW(), NOW()),
  (gen_random_uuid(), 'Pleural Fluid Analysis', 'PLEURAL-01', 'Clinical Pathology', 'Pleural Fluid', 700, 4, 'Pleural fluid examination', NOW(), NOW()),
  (gen_random_uuid(), 'Ascitic Fluid Analysis', 'ASCITIC-01', 'Clinical Pathology', 'Ascitic Fluid', 700, 4, 'Ascites analysis', NOW(), NOW()),
  (gen_random_uuid(), 'Joint Fluid Analysis', 'JOINT-01', 'Clinical Pathology', 'Joint Fluid', 700, 4, 'Synovial fluid examination', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- SEMEN ANALYSIS --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Semen Analysis', 'SEMEN-01', 'Andrology', 'Semen', 400, 4, 'Sperm count, motility, morphology', NOW(), NOW()),
  (gen_random_uuid(), 'Semen Culture', 'SEMEN-CULT-01', 'Microbiology', 'Semen', 600, 48, 'Bacterial contamination', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- PREGNANCY & OBSTETRIC TESTS --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Pregnancy Test (Urine)', 'UPT-01', 'Hormone', 'Urine', 100, 1, 'Urine pregnancy test', NOW(), NOW()),
  (gen_random_uuid(), 'Pregnancy Test (Serum)', 'SPT-01', 'Hormone', 'Blood', 150, 2, 'Serum beta-HCG qualitative', NOW(), NOW()),
  (gen_random_uuid(), 'PAPP-A (Pregnancy Associated Plasma Protein)', 'PAPPA-01', 'Hormone', 'Blood', 500, 4, 'Down syndrome screening', NOW(), NOW()),
  (gen_random_uuid(), 'AFP (Maternal Serum)', 'AFP-MAT-01', 'Biochemistry', 'Blood', 450, 4, 'Neural tube defect screening', NOW(), NOW()),
  (gen_random_uuid(), 'uE3 (Unconjugated Estriol)', 'UE3-01', 'Hormone', 'Blood', 450, 4, 'Down syndrome screening', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- MISCELLANEOUS TESTS --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'ACE (Angiotensin Converting Enzyme)', 'ACE-01', 'Biochemistry', 'Blood', 400, 4, 'Sarcoidosis marker', NOW(), NOW()),
  (gen_random_uuid(), 'Lactate Dehydrogenase (LDH)', 'LDH-01', 'Biochemistry', 'Blood', 200, 4, 'Tissue damage marker', NOW(), NOW()),
  (gen_random_uuid(), 'Total Protein', 'TP-01', 'Biochemistry', 'Blood', 100, 2, 'Albumin and globulin', NOW(), NOW()),
  (gen_random_uuid(), 'Albumin', 'ALB-01', 'Biochemistry', 'Blood', 100, 2, 'Protein synthesis marker', NOW(), NOW()),
  (gen_random_uuid(), 'Globulin', 'GLOB-01', 'Biochemistry', 'Blood', 100, 2, 'Immune protein level', NOW(), NOW()),
  (gen_random_uuid(), 'Blood Alcohol Level', 'BAL-01', 'Toxicology', 'Blood', 300, 2, 'Ethanol concentration', NOW(), NOW()),
  (gen_random_uuid(), 'Ammonia', 'AMMON-01', 'Biochemistry', 'Blood', 400, 4, 'Hepatic encephalopathy marker', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- ============================================
-- SECTION 6: INSERT COMPREHENSIVE TEST FIELDS
-- ============================================

-- CBC Test Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, section_group, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, f.section, NOW(), NOW()
FROM tests t
CROSS JOIN (
  VALUES
    ('Hemoglobin', 'g/dL', 12.0, 15.5, 'number', 1, 'RBC Parameters'),
    ('RBC Count', 'million/uL', 4.0, 5.5, 'number', 2, 'RBC Parameters'),
    ('Hematocrit', '%', 36.0, 46.0, 'number', 3, 'RBC Parameters'),
    ('MCV', 'fL', 80.0, 100.0, 'number', 4, 'RBC Indices'),
    ('MCH', 'pg', 27.0, 33.0, 'number', 5, 'RBC Indices'),
    ('MCHC', 'g/dL', 32.0, 36.0, 'number', 6, 'RBC Indices'),
    ('RDW', '%', 11.5, 14.5, 'number', 7, 'RBC Indices'),
    ('WBC Count', 'thou/uL', 4.5, 11.0, 'number', 8, 'WBC Count'),
    ('Neutrophils', '%', 40.0, 75.0, 'number', 9, 'Differential'),
    ('Lymphocytes', '%', 20.0, 40.0, 'number', 10, 'Differential'),
    ('Monocytes', '%', 2.0, 8.0, 'number', 11, 'Differential'),
    ('Eosinophils', '%', 1.0, 4.0, 'number', 12, 'Differential'),
    ('Basophils', '%', 0.0, 1.0, 'number', 13, 'Differential'),
    ('Platelet Count', 'thou/uL', 150.0, 400.0, 'number', 14, 'Platelets')
) AS f(field_name, unit, min_value, max_value, input_type, order_index, section)
WHERE t.test_code = 'CBC-01' AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id AND tf.field_name = f.field_name);

-- LFT Test Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, section_group, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, f.section, NOW(), NOW()
FROM tests t
CROSS JOIN (
  VALUES
    ('Total Bilirubin', 'mg/dL', 0.1, 1.2, 'number', 1, 'Bilirubin'),
    ('Direct Bilirubin', 'mg/dL', 0.0, 0.3, 'number', 2, 'Bilirubin'),
    ('Indirect Bilirubin', 'mg/dL', 0.1, 0.9, 'number', 3, 'Bilirubin'),
    ('SGOT (AST)', 'U/L', 10.0, 40.0, 'number', 4, 'Transaminases'),
    ('SGPT (ALT)', 'U/L', 7.0, 56.0, 'number', 5, 'Transaminases'),
    ('ALP (Alkaline Phosphatase)', 'U/L', 44.0, 147.0, 'number', 6, 'Alkaline Phosphatase'),
    ('Total Protein', 'g/dL', 6.0, 8.3, 'number', 7, 'Proteins'),
    ('Albumin', 'g/dL', 3.5, 5.5, 'number', 8, 'Proteins'),
    ('Globulin', 'g/dL', 2.0, 3.5, 'number', 9, 'Proteins'),
    ('A/G Ratio', 'Ratio', 1.0, 2.5, 'number', 10, 'Proteins'),
    ('GGT', 'U/L', 9.0, 48.0, 'number', 11, 'Additional Enzymes')
) AS f(field_name, unit, min_value, max_value, input_type, order_index, section)
WHERE t.test_code = 'LFT-01' AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id AND tf.field_name = f.field_name);

-- KFT Test Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, section_group, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, f.section, NOW(), NOW()
FROM tests t
CROSS JOIN (
  VALUES
    ('Urea', 'mg/dL', 15.0, 45.0, 'number', 1, 'Nitrogen Metabolism'),
    ('Creatinine', 'mg/dL', 0.6, 1.2, 'number', 2, 'Nitrogen Metabolism'),
    ('Uric Acid', 'mg/dL', 3.5, 7.2, 'number', 3, 'Nitrogen Metabolism'),
    ('Sodium', 'mEq/L', 136.0, 145.0, 'number', 4, 'Electrolytes'),
    ('Potassium', 'mEq/L', 3.5, 5.0, 'number', 5, 'Electrolytes'),
    ('Chloride', 'mEq/L', 98.0, 107.0, 'number', 6, 'Electrolytes'),
    ('CO2 (Bicarbonate)', 'mEq/L', 23.0, 29.0, 'number', 7, 'Electrolytes'),
    ('Calcium', 'mg/dL', 8.5, 10.2, 'number', 8, 'Minerals'),
    ('Phosphorus', 'mg/dL', 2.5, 4.5, 'number', 9, 'Minerals'),
    ('Magnesium', 'mg/dL', 1.7, 2.2, 'number', 10, 'Minerals'),
    ('eGFR', 'mL/min/1.73m2', 60.0, 120.0, 'number', 11, 'Renal Function')
) AS f(field_name, unit, min_value, max_value, input_type, order_index, section)
WHERE t.test_code = 'KFT-01' AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id AND tf.field_name = f.field_name);

-- Lipid Profile Test Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, section_group, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, f.section, NOW(), NOW()
FROM tests t
CROSS JOIN (
  VALUES
    ('Total Cholesterol', 'mg/dL', 0.0, 200.0, 'number', 1, 'Lipids'),
    ('HDL', 'mg/dL', 40.0, 200.0, 'number', 2, 'Lipids'),
    ('LDL', 'mg/dL', 0.0, 130.0, 'number', 3, 'Lipids'),
    ('VLDL', 'mg/dL', 0.0, 40.0, 'number', 4, 'Lipids'),
    ('Triglycerides', 'mg/dL', 0.0, 150.0, 'number', 5, 'Lipids'),
    ('TC/HDL Ratio', 'Ratio', 0.0, 5.0, 'number', 6, 'Ratios')
) AS f(field_name, unit, min_value, max_value, input_type, order_index, section)
WHERE t.test_code = 'LIPID-01' AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id AND tf.field_name = f.field_name);

-- Thyroid Profile Test Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, section_group, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, f.section, NOW(), NOW()
FROM tests t
CROSS JOIN (
  VALUES
    ('TSH', 'mIU/L', 0.4, 4.0, 'number', 1, 'Thyroid Hormones'),
    ('T3', 'pg/mL', 80.0, 200.0, 'number', 2, 'Thyroid Hormones'),
    ('T4', 'ng/dL', 4.5, 12.0, 'number', 3, 'Thyroid Hormones'),
    ('Free T3', 'pg/mL', 2.3, 4.2, 'number', 4, 'Thyroid Hormones'),
    ('Free T4', 'ng/dL', 0.8, 1.8, 'number', 5, 'Thyroid Hormones')
) AS f(field_name, unit, min_value, max_value, input_type, order_index, section)
WHERE t.test_code = 'THYROID-01' AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id AND tf.field_name = f.field_name);

-- Urine Routine Test Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, section_group, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, f.section, NOW(), NOW()
FROM tests t
CROSS JOIN (
  VALUES
    ('Color', 'Text', 0, 0, 'text', 1, 'Physical'),
    ('Appearance', 'Text', 0, 0, 'text', 2, 'Physical'),
    ('Specific Gravity', 'Value', 1.005, 1.030, 'number', 3, 'Physical'),
    ('pH', 'Value', 4.5, 8.0, 'number', 4, 'Physical'),
    ('Protein', 'mg/dL', 0.0, 0.0, 'number', 5, 'Chemical'),
    ('Sugar', 'mg/dL', 0.0, 0.0, 'number', 6, 'Chemical'),
    ('Ketone', 'Text', 0, 0, 'text', 7, 'Chemical'),
    ('Bilirubin', 'Text', 0, 0, 'text', 8, 'Chemical'),
    ('Urobilinogen', 'mg/dL', 0.1, 1.0, 'number', 9, 'Chemical'),
    ('RBC', 'Cells/hpf', 0.0, 3.0, 'number', 10, 'Microscopy'),
    ('WBC', 'Cells/hpf', 0.0, 5.0, 'number', 11, 'Microscopy'),
    ('Epithelial Cells', 'Cells/lpf', 0.0, 3.0, 'number', 12, 'Microscopy'),
    ('Casts', 'per lpf', 0.0, 2.0, 'number', 13, 'Microscopy'),
    ('Crystals', 'Text', 0, 0, 'text', 14, 'Microscopy'),
    ('Bacteria', 'Text', 0, 0, 'text', 15, 'Microscopy')
) AS f(field_name, unit, min_value, max_value, input_type, order_index, section)
WHERE t.test_code = 'URINE-01' AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id AND tf.field_name = f.field_name);

-- Blood Glucose Test Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, section_group, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, f.section, NOW(), NOW()
FROM tests t
CROSS JOIN (
  VALUES
    ('Glucose', 'mg/dL', 70.0, 100.0, 'number', 1, 'Glucose')
) AS f(field_name, unit, min_value, max_value, input_type, order_index, section)
WHERE t.test_code IN ('FBS-01', 'PPBS-01', 'RBS-01')
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id AND tf.field_name = f.field_name);

-- HbA1c Test Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, section_group, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, f.section, NOW(), NOW()
FROM tests t
CROSS JOIN (
  VALUES
    ('HbA1c', '%', 0.0, 5.6, 'number', 1, 'Glycemic Control'),
    ('eAG (Estimated Average Glucose)', 'mg/dL', 0.0, 100.0, 'number', 2, 'Glycemic Control')
) AS f(field_name, unit, min_value, max_value, input_type, order_index, section)
WHERE t.test_code = 'HBA1C-01' AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id AND tf.field_name = f.field_name);

-- PT/INR Test Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, section_group, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, f.section, NOW(), NOW()
FROM tests t
CROSS JOIN (
  VALUES
    ('PT', 'seconds', 11.0, 13.5, 'number', 1, 'Coagulation'),
    ('INR', 'Ratio', 0.8, 1.1, 'number', 2, 'Coagulation')
) AS f(field_name, unit, min_value, max_value, input_type, order_index, section)
WHERE t.test_code = 'PTINR-01' AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id AND tf.field_name = f.field_name);

-- Lipase & Amylase Test Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, section_group, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, f.section, NOW(), NOW()
FROM tests t
CROSS JOIN (
  VALUES
    ('Amylase', 'U/L', 30.0, 110.0, 'number', 1, 'Pancreatic Enzymes')
) AS f(field_name, unit, min_value, max_value, input_type, order_index, section)
WHERE t.test_code = 'AMYL-01' AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id AND tf.field_name = f.field_name);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, section_group, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, f.section, NOW(), NOW()
FROM tests t
CROSS JOIN (
  VALUES
    ('Lipase', 'U/L', 0.0, 60.0, 'number', 1, 'Pancreatic Enzymes')
) AS f(field_name, unit, min_value, max_value, input_type, order_index, section)
WHERE t.test_code = 'LIPAS-01' AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id AND tf.field_name = f.field_name);

-- PSA Test Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, section_group, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, f.section, NOW(), NOW()
FROM tests t
CROSS JOIN (
  VALUES
    ('PSA Total', 'ng/mL', 0.0, 4.0, 'number', 1, 'PSA')
) AS f(field_name, unit, min_value, max_value, input_type, order_index, section)
WHERE t.test_code = 'PSA-01' AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id AND tf.field_name = f.field_name);

-- Cardiac Markers
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, section_group, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, f.section, NOW(), NOW()
FROM tests t
CROSS JOIN (
  VALUES
    ('Troponin I', 'ng/mL', 0.0, 0.04, 'number', 1, 'Cardiac')
) AS f(field_name, unit, min_value, max_value, input_type, order_index, section)
WHERE t.test_code = 'TROP-01' AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id AND tf.field_name = f.field_name);

-- TSH Single Test
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, section_group, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, f.section, NOW(), NOW()
FROM tests t
CROSS JOIN (
  VALUES
    ('TSH', 'mIU/L', 0.4, 4.0, 'number', 1, 'Thyroid')
) AS f(field_name, unit, min_value, max_value, input_type, order_index, section)
WHERE t.test_code = 'TSH-01' AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id AND tf.field_name = f.field_name);

-- ============================================
-- SECTION 7: INSERT TEST REFERENCE RANGES
-- ============================================

-- CBC Hemoglobin Reference Ranges
INSERT INTO test_reference_ranges (test_field_id, gender, age_min, age_max, min_value, max_value, critical_low, critical_high, remarks)
SELECT tf.id, 'Male', 18, 120, 13.5, 17.5, 7.0, 20.0, 'Adult males'
FROM test_fields tf
JOIN tests t ON tf.test_id = t.id
WHERE t.test_code = 'CBC-01' AND tf.field_name = 'Hemoglobin' AND NOT EXISTS (
  SELECT 1 FROM test_reference_ranges trr WHERE trr.test_field_id = tf.id AND trr.gender = 'Male'
);

INSERT INTO test_reference_ranges (test_field_id, gender, age_min, age_max, min_value, max_value, critical_low, critical_high, remarks)
SELECT tf.id, 'Female', 18, 120, 12.0, 15.5, 7.0, 20.0, 'Adult females'
FROM test_fields tf
JOIN tests t ON tf.test_id = t.id
WHERE t.test_code = 'CBC-01' AND tf.field_name = 'Hemoglobin' AND NOT EXISTS (
  SELECT 1 FROM test_reference_ranges trr WHERE trr.test_field_id = tf.id AND trr.gender = 'Female'
);

-- CBC WBC Reference Ranges
INSERT INTO test_reference_ranges (test_field_id, gender, age_min, age_max, min_value, max_value, critical_low, critical_high, remarks)
SELECT tf.id, 'Any', 18, 120, 4.5, 11.0, 2.0, 30.0, 'Adult WBC count'
FROM test_fields tf
JOIN tests t ON tf.test_id = t.id
WHERE t.test_code = 'CBC-01' AND tf.field_name = 'WBC Count' AND NOT EXISTS (
  SELECT 1 FROM test_reference_ranges trr WHERE trr.test_field_id = tf.id
);

-- CBC Platelets Reference Ranges
INSERT INTO test_reference_ranges (test_field_id, gender, age_min, age_max, min_value, max_value, critical_low, critical_high, remarks)
SELECT tf.id, 'Any', 18, 120, 150.0, 400.0, 50.0, 1000.0, 'Platelet count'
FROM test_fields tf
JOIN tests t ON tf.test_id = t.id
WHERE t.test_code = 'CBC-01' AND tf.field_name = 'Platelet Count' AND NOT EXISTS (
  SELECT 1 FROM test_reference_ranges trr WHERE trr.test_field_id = tf.id
);

-- Creatinine Reference Ranges
INSERT INTO test_reference_ranges (test_field_id, gender, age_min, age_max, min_value, max_value, critical_low, critical_high, remarks)
SELECT tf.id, 'Male', 18, 120, 0.7, 1.3, 0.4, 10.0, 'Adult male creatinine'
FROM test_fields tf
JOIN tests t ON tf.test_id = t.id
WHERE t.test_code = 'KFT-01' AND tf.field_name = 'Creatinine' AND NOT EXISTS (
  SELECT 1 FROM test_reference_ranges trr WHERE trr.test_field_id = tf.id AND trr.gender = 'Male'
);

INSERT INTO test_reference_ranges (test_field_id, gender, age_min, age_max, min_value, max_value, critical_low, critical_high, remarks)
SELECT tf.id, 'Female', 18, 120, 0.6, 1.2, 0.4, 10.0, 'Adult female creatinine'
FROM test_fields tf
JOIN tests t ON tf.test_id = t.id
WHERE t.test_code = 'KFT-01' AND tf.field_name = 'Creatinine' AND NOT EXISTS (
  SELECT 1 FROM test_reference_ranges trr WHERE trr.test_field_id = tf.id AND trr.gender = 'Female'
);

-- HbA1c Reference Ranges
INSERT INTO test_reference_ranges (test_field_id, gender, age_min, age_max, min_value, max_value, critical_low, critical_high, remarks)
SELECT tf.id, 'Any', 18, 120, 0.0, 5.6, 0.0, 14.0, 'Normal glucose control'
FROM test_fields tf
JOIN tests t ON tf.test_id = t.id
WHERE t.test_code = 'HBA1C-01' AND tf.field_name = 'HbA1c' AND NOT EXISTS (
  SELECT 1 FROM test_reference_ranges trr WHERE trr.test_field_id = tf.id
);

-- TSH Reference Ranges
INSERT INTO test_reference_ranges (test_field_id, gender, age_min, age_max, min_value, max_value, critical_low, critical_high, remarks)
SELECT tf.id, 'Any', 18, 120, 0.4, 4.0, 0.01, 100.0, 'Normal TSH'
FROM test_fields tf
JOIN tests t ON tf.test_id = t.id
WHERE t.test_code = 'TSH-01' AND NOT EXISTS (
  SELECT 1 FROM test_reference_ranges trr WHERE trr.test_field_id = tf.id
);

-- PSA Reference Ranges
INSERT INTO test_reference_ranges (test_field_id, gender, age_min, age_max, min_value, max_value, critical_low, critical_high, remarks)
SELECT tf.id, 'Male', 50, 120, 0.0, 4.0, 0.0, 10.0, 'PSA screening age 50+'
FROM test_fields tf
JOIN tests t ON tf.test_id = t.id
WHERE t.test_code = 'PSA-01' AND NOT EXISTS (
  SELECT 1 FROM test_reference_ranges trr WHERE trr.test_field_id = tf.id
);

-- Vitamin D Reference Ranges
INSERT INTO test_reference_ranges (test_field_id, gender, age_min, age_max, min_value, max_value, critical_low, critical_high, remarks)
SELECT tf.id, 'Any', 18, 120, 30.0, 100.0, 10.0, 150.0, 'Sufficient vitamin D'
FROM test_fields tf
JOIN tests t ON tf.test_id = t.id
WHERE t.test_code = 'VITD-01' AND NOT EXISTS (
  SELECT 1 FROM test_reference_ranges trr WHERE trr.test_field_id = tf.id
);

-- Vitamin B12 Reference Ranges
INSERT INTO test_reference_ranges (test_field_id, gender, age_min, age_max, min_value, max_value, critical_low, critical_high, remarks)
SELECT tf.id, 'Any', 18, 120, 200.0, 900.0, 100.0, 2000.0, 'Normal B12 levels'
FROM test_fields tf
JOIN tests t ON tf.test_id = t.id
WHERE t.test_code = 'VITB12-01' AND NOT EXISTS (
  SELECT 1 FROM test_reference_ranges trr WHERE trr.test_field_id = tf.id
);

-- ============================================
-- SECTION 8: INSERT TEST PACKAGES
-- ============================================

INSERT INTO test_packages (id, package_name, package_code, category, description, price, is_active)
VALUES
  (gen_random_uuid(), 'Fever Profile', 'PKG-FEVER-01', 'Infections', 'Complete fever workup with CBC, malaria, blood culture', 1200, true),
  (gen_random_uuid(), 'Diabetic Profile', 'PKG-DIA-01', 'Metabolic', 'FBS, PPBS, HbA1c, Lipid Profile', 1500, true),
  (gen_random_uuid(), 'Thyroid Profile Advanced', 'PKG-THY-ADV-01', 'Endocrine', 'TSH, Free T3, Free T4, Anti-TPO', 1800, true),
  (gen_random_uuid(), 'Executive Health Checkup', 'PKG-EXEC-01', 'Wellness', 'Comprehensive health screening package', 5000, true),
  (gen_random_uuid(), 'Women''s Health Package', 'PKG-WOMEN-01', 'Reproductive', 'Reproductive hormones, PAP smear, anemia screening', 3000, true),
  (gen_random_uuid(), 'Men''s Health Package', 'PKG-MEN-01', 'Reproductive', 'PSA, testosterone, semen analysis', 2500, true),
  (gen_random_uuid(), 'Cardiac Risk Profile', 'PKG-CARD-01', 'Cardiac', 'Troponin, CK-MB, NT-ProBNP, lipid profile, homocysteine', 3500, true),
  (gen_random_uuid(), 'Arthritis Profile', 'PKG-ARTH-01', 'Autoimmune', 'RA Factor, Anti-CCP, ESR, CRP', 1800, true),
  (gen_random_uuid(), 'Anemia Profile', 'PKG-ANEM-01', 'Hematology', 'CBC, Iron studies, B12, Folic Acid', 2000, true),
  (gen_random_uuid(), 'Antenatal Profile', 'PKG-ANTE-01', 'Obstetric', 'Blood group, VDRL, HIV, HBsAg, CBC, blood glucose', 2500, true),
  (gen_random_uuid(), 'Infertility Profile', 'PKG-INFER-01', 'Reproductive', 'FSH, LH, Prolactin, Testosterone, Semen Analysis', 4000, true),
  (gen_random_uuid(), 'Liver Profile Advanced', 'PKG-LIVER-ADV-01', 'Hepatic', 'LFT, Viral Hepatitis, Albumin, PT/INR', 2500, true),
  (gen_random_uuid(), 'Kidney Profile Advanced', 'PKG-KIDNEY-ADV-01', 'Renal', 'KFT, Urine Routine, Urine Culture, Protein', 2200, true)
ON CONFLICT (package_code) DO NOTHING;

-- ============================================
-- SECTION 9: FORMULA DEFINITIONS FOR CALCULATED FIELDS
-- ============================================

-- Update LFT Globulin and A/G Ratio with formulas
UPDATE test_fields SET
  field_type = 'calculated',
  formula = 'Total Protein - Albumin',
  depends_on = '["Total Protein", "Albumin"]'::jsonb
WHERE test_id IN (SELECT id FROM tests WHERE test_code = 'LFT-01') AND field_name = 'Globulin';

UPDATE test_fields SET
  field_type = 'calculated',
  formula = 'Albumin / Globulin',
  depends_on = '["Albumin", "Globulin"]'::jsonb
WHERE test_id IN (SELECT id FROM tests WHERE test_code = 'LFT-01') AND field_name = 'A/G Ratio';

-- Update Lipid Profile LDL, VLDL, TC/HDL with formulas
UPDATE test_fields SET
  field_type = 'calculated',
  formula = 'Total Cholesterol - HDL - (Triglycerides / 5)',
  depends_on = '["Total Cholesterol", "HDL", "Triglycerides"]'::jsonb
WHERE test_id IN (SELECT id FROM tests WHERE test_code = 'LIPID-01') AND field_name = 'LDL';

UPDATE test_fields SET
  field_type = 'calculated',
  formula = 'Triglycerides / 5',
  depends_on = '["Triglycerides"]'::jsonb
WHERE test_id IN (SELECT id FROM tests WHERE test_code = 'LIPID-01') AND field_name = 'VLDL';

UPDATE test_fields SET
  field_type = 'calculated',
  formula = 'Total Cholesterol / HDL',
  depends_on = '["Total Cholesterol", "HDL"]'::jsonb
WHERE test_id IN (SELECT id FROM tests WHERE test_code = 'LIPID-01') AND field_name = 'TC/HDL Ratio';

-- Update KFT eGFR with formula
UPDATE test_fields SET
  field_type = 'calculated',
  formula = 'Estimated from Creatinine using MDRD equation',
  depends_on = '["Creatinine"]'::jsonb
WHERE test_id IN (SELECT id FROM tests WHERE test_code = 'KFT-01') AND field_name = 'eGFR';

-- Update HbA1c eAG with formula
UPDATE test_fields SET
  field_type = 'calculated',
  formula = '(HbA1c * 35.6) - 77.3',
  depends_on = '["HbA1c"]'::jsonb
WHERE test_id IN (SELECT id FROM tests WHERE test_code = 'HBA1C-01') AND field_name = 'eAG (Estimated Average Glucose)';

-- ============================================
-- SECTION 10: CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_test_fields_test_id_field_name ON test_fields(test_id, field_name);
CREATE INDEX IF NOT EXISTS idx_test_reference_ranges_critical ON test_reference_ranges(test_field_id, critical_low, critical_high);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

COMMIT;
SELECT '✅ Production-Grade Pathology Test Catalog Expanded Successfully' AS migration_status;

