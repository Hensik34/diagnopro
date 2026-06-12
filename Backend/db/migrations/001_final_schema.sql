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
    age_unit VARCHAR(10) DEFAULT 'years',
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
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_patients_branch_id ON patients(branch_id);
CREATE INDEX IF NOT EXISTS idx_samples_patient_id ON samples(patient_id);
CREATE INDEX IF NOT EXISTS idx_samples_branch_id ON samples(branch_id);
CREATE INDEX IF NOT EXISTS idx_sample_tests_sample_id ON sample_tests(sample_id);
CREATE INDEX IF NOT EXISTS idx_reports_patient_id ON reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_user_branches_user_id ON user_branches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_branches_branch_id ON user_branches(branch_id);
CREATE INDEX IF NOT EXISTS idx_doctor_branches_doctor_id ON doctor_branches(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_branches_branch_id ON doctor_branches(branch_id);
CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);

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
    reference_rules JSONB,
    critical_rules JSONB,
    interpretation_logic JSONB,
    is_mandatory BOOLEAN DEFAULT true,
    display_format VARCHAR(50) DEFAULT 'standard',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_test_fields_test_id ON test_fields(test_id);
CREATE INDEX IF NOT EXISTS idx_test_fields_section ON test_fields(section_group);

-- ============================================
-- TEST PACKAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS test_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_name VARCHAR(255) NOT NULL,
    package_code VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100),
    description TEXT,
    price DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_test_packages_code ON test_packages(package_code);
CREATE INDEX IF NOT EXISTS idx_test_packages_category ON test_packages(category);

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
    reference_rules JSONB,
    critical_rules JSONB,
    is_mandatory BOOLEAN DEFAULT true,
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
ALTER TABLE branch_tests ADD COLUMN IF NOT EXISTS layout_config JSONB DEFAULT NULL;

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
ALTER TABLE branch_test_fields ADD COLUMN IF NOT EXISTS reference_rules JSONB;
ALTER TABLE branch_test_fields ADD COLUMN IF NOT EXISTS critical_rules JSONB;
ALTER TABLE branch_test_fields ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN DEFAULT true;
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

-- ============================================
-- MIGRATION 001: TABLE CREATION COMPLETE
-- ============================================
-- All table schemas created
-- Data seeding handled by: Backend/models/index.js
-- ============================================
