-- ============================================
-- MIGRATION 001: FINAL CONSOLIDATED SCHEMA
-- ============================================
-- This single file creates ALL tables with ALL columns.
-- Generated from Sequelize model definitions.
-- Safe to run on a fresh/empty database.
--
-- Sequelize global config: underscored: true
--   createdAt → created_at
--   updatedAt → updated_at
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 1. USERS
-- Model: models/definitions/User.js → tableName: "users"
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'staff',
    is_active BOOLEAN DEFAULT TRUE,
    petrol_price_per_km DECIMAL(10, 2) DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- 2. BRANCHES
-- Model: models/definitions/Branch.js → tableName: "branches"
-- ============================================
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

-- ============================================
-- 3. USER_BRANCHES (junction: users ↔ branches)
-- Model: models/definitions/UserBranch.js → tableName: "user_branches"
-- Note: updatedAt: false in model definition
-- ============================================
CREATE TABLE IF NOT EXISTS user_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_user_branches_user_id ON user_branches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_branches_branch_id ON user_branches(branch_id);

-- ============================================
-- 4. PATIENTS
-- Model: models/definitions/Patient.js → tableName: "patients"
-- ============================================
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    age INTEGER,
    age_unit VARCHAR(10) DEFAULT 'years',
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

CREATE INDEX IF NOT EXISTS idx_patients_branch_id ON patients(branch_id);

-- ============================================
-- 5. DOCTORS
-- Model: models/definitions/Doctor.js → tableName: "doctors"
-- ============================================
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(20) DEFAULT 'Dr',
    name VARCHAR(200),
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    specialization VARCHAR(255),
    license_number VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    branch_id UUID REFERENCES branches(id),
    commission_percentage DECIMAL(5, 2) DEFAULT 0,
    signature_url TEXT,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);

-- ============================================
-- 6. DOCTOR_BRANCHES (junction: doctors ↔ branches)
-- Model: models/definitions/DoctorBranch.js → tableName: "doctor_branches"
-- Note: updatedAt: false in model definition
-- ============================================
CREATE TABLE IF NOT EXISTS doctor_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(doctor_id, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_doctor_branches_doctor_id ON doctor_branches(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_branches_branch_id ON doctor_branches(branch_id);

-- ============================================
-- 7. SAMPLES
-- Model: models/definitions/Sample.js → tableName: "samples"
-- ============================================
CREATE TABLE IF NOT EXISTS samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    sample_type VARCHAR(100),
    sample_id_code VARCHAR(100) UNIQUE NOT NULL,
    collection_date TIMESTAMP,
    collected_by UUID NOT NULL REFERENCES users(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_samples_patient_id ON samples(patient_id);
CREATE INDEX IF NOT EXISTS idx_samples_branch_id ON samples(branch_id);

-- ============================================
-- 8. TESTS
-- Model: models/definitions/Test.js → tableName: "tests"
-- ============================================
CREATE TABLE IF NOT EXISTS tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_name VARCHAR(255) NOT NULL,
    test_code VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    sample_type VARCHAR(100),
    price DECIMAL(10, 2),
    turnaround_time INTEGER,
    description TEXT,
    clinical_significance TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(test_code)
);

-- ============================================
-- 9. TEST_FIELDS
-- Model: models/definitions/TestField.js → tableName: "test_fields"
-- Note: timestamps: true explicitly set in model
-- ============================================
CREATE TABLE IF NOT EXISTS test_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    field_name VARCHAR(255) NOT NULL,
    unit VARCHAR(100),
    min_value DECIMAL(10, 2),
    max_value DECIMAL(10, 2),
    input_type VARCHAR(50) DEFAULT 'number',
    options TEXT,
    order_index INTEGER DEFAULT 0,
    field_type VARCHAR(50) DEFAULT 'input',
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
CREATE UNIQUE INDEX IF NOT EXISTS idx_test_fields_unique_test_id_field_name ON test_fields(test_id, field_name);

-- ============================================
-- 10. SAMPLE_TESTS (junction: samples ↔ tests)
-- Model: models/definitions/SampleTest.js → tableName: "sample_tests"
-- ============================================
CREATE TABLE IF NOT EXISTS sample_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id UUID NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES tests(id),
    status VARCHAR(50) DEFAULT 'pending',
    result TEXT,
    result_unit VARCHAR(50),
    reference_range VARCHAR(100),
    performed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sample_id, test_id)
);

CREATE INDEX IF NOT EXISTS idx_sample_tests_sample_id ON sample_tests(sample_id);

-- ============================================
-- 11. B2B_LABS
-- Model: models/definitions/B2BLab.js → tableName: "b2b_labs"
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
    commission_type VARCHAR(20) DEFAULT 'percentage',
    commission_value DECIMAL(10, 2) DEFAULT 0,
    credit_limit DECIMAL(12, 2) DEFAULT 0,
    current_balance DECIMAL(12, 2) DEFAULT 0,
    lab_type VARCHAR(20) DEFAULT 'collection',
    owner_branch_id UUID REFERENCES branches(id),
    user_id UUID REFERENCES users(id),
    logo_url TEXT,
    show_processing_lab BOOLEAN DEFAULT false,
    custom_footer TEXT,
    status VARCHAR(20) DEFAULT 'active',
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
-- 12. REPORTS
-- Model: models/definitions/Report.js → tableName: "reports"
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID REFERENCES doctors(id),
    technician_id UUID REFERENCES users(id),
    report_type VARCHAR(100),
    sample_id UUID REFERENCES samples(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    status VARCHAR(50) DEFAULT 'draft',
    clinical_notes TEXT,
    findings TEXT,
    recommendations TEXT,
    reviewed_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    submitted_by UUID REFERENCES users(id),
    submitted_at TIMESTAMP,
    rejected_by UUID REFERENCES users(id),
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    report_amount DECIMAL(12, 2) DEFAULT 0,
    doctor_commission DECIMAL(12, 2) DEFAULT 0,
    is_self_report BOOLEAN DEFAULT false,
    test_data JSONB DEFAULT '{}',
    delivery_preferences JSONB DEFAULT '{}',
    base_amount DECIMAL(12, 2) DEFAULT 0,
    lab_discount_type VARCHAR(20) DEFAULT 'percent',
    lab_discount_value DECIMAL(10, 2) DEFAULT 0,
    doctor_discount DECIMAL(10, 2) DEFAULT 0,
    final_amount DECIMAL(12, 2) DEFAULT 0,
    payment_status VARCHAR(30) DEFAULT 'pending',
    b2b_lab_id UUID REFERENCES b2b_labs(id),
    b2b_charge DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reports_patient_id ON reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_reports_b2b_lab ON reports(b2b_lab_id) WHERE b2b_lab_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_payment_status ON reports(payment_status);
CREATE INDEX IF NOT EXISTS idx_reports_branch ON reports(branch_id);

-- ============================================
-- 13. PAYMENTS
-- Model: models/definitions/Payment.js → tableName: "payments"
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id),
    patient_id UUID REFERENCES patients(id),
    doctor_id UUID REFERENCES doctors(id),
    amount DECIMAL(12, 2) NOT NULL,
    payment_mode VARCHAR(50),
    payment_date TIMESTAMP,
    reference_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_doctor_id ON payments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ============================================
-- 14. INVENTORY
-- Model: models/definitions/Inventory.js → tableName: "inventory"
-- ============================================
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    quantity INTEGER DEFAULT 0,
    alert_threshold INTEGER DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'packs',
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    last_restocked TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_branch_id ON inventory(branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);

-- ============================================
-- 15. SAMPLE_COLLECTION_TRACKING
-- Model: models/definitions/SampleCollectionTracking.js → tableName: "sample_collection_tracking"
-- ============================================
CREATE TABLE IF NOT EXISTS sample_collection_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES users(id),
    branch_id UUID REFERENCES branches(id),
    date DATE DEFAULT CURRENT_DATE,
    start_km DECIMAL(10, 2),
    end_km DECIMAL(10, 2),
    total_km DECIMAL(10, 2),
    start_meter_image TEXT,
    end_meter_image TEXT,
    bike_image TEXT,
    visit_charge DECIMAL(10, 2) DEFAULT 0,
    per_km_rate DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sample_collection_staff_id ON sample_collection_tracking(staff_id);
CREATE INDEX IF NOT EXISTS idx_sample_collection_date ON sample_collection_tracking(date);

-- ============================================
-- 16. TIME_LOGS
-- Model: models/definitions/TimeLog.js → tableName: "time_logs"
-- ============================================
CREATE TABLE IF NOT EXISTS time_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    clock_in TIMESTAMP,
    clock_out TIMESTAMP,
    total_hours DECIMAL(10, 2),
    branch_id UUID REFERENCES branches(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_clock_in ON time_logs(clock_in);

-- ============================================
-- 17. SETTINGS
-- Model: models/definitions/Settings.js → tableName: "settings"
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE UNIQUE,
    letterhead_url TEXT,
    owner_signature_url TEXT,
    header_url TEXT,
    footer_url TEXT,
    report_margin_top VARCHAR(20) DEFAULT '10mm',
    report_margin_bottom VARCHAR(20) DEFAULT '10mm',
    report_margin_left VARCHAR(20) DEFAULT '10mm',
    report_margin_right VARCHAR(20) DEFAULT '10mm',
    header_safe_area INTEGER DEFAULT 24,
    footer_safe_area INTEGER DEFAULT 24,
    letterhead_detected_top INTEGER,
    letterhead_detected_bottom INTEGER,
    letterhead_detected_left INTEGER,
    letterhead_detected_right INTEGER,
    letterhead_margins_auto BOOLEAN DEFAULT TRUE,
    signature_1_url TEXT,
    signature_1_label VARCHAR(255),
    signature_2_url TEXT,
    signature_2_label VARCHAR(255),
    signature_3_url TEXT,
    signature_3_label VARCHAR(255),
    signature_4_url TEXT,
    signature_4_label VARCHAR(255),
    default_signature_index INTEGER DEFAULT 0,
    sample_id_format VARCHAR(30) DEFAULT 'numeric',
    sample_id_reset_policy VARCHAR(30) DEFAULT 'yearly',
    sample_id_fy_start_month INTEGER DEFAULT 3,
    sample_id_start_number INTEGER DEFAULT 1001,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_settings_branch_id ON settings(branch_id);

-- ============================================
-- 18. BRANCH_TESTS (UserTest model)
-- Model: models/definitions/UserTest.js → tableName: "branch_tests"
-- ============================================
CREATE TABLE IF NOT EXISTS branch_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    test_name VARCHAR(255),
    category VARCHAR(100),
    sample_type VARCHAR(100),
    price DECIMAL(10, 2),
    turnaround_time INTEGER,
    description TEXT,
    clinical_significance TEXT DEFAULT NULL,
    layout_config JSONB DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, test_id)
);

CREATE INDEX IF NOT EXISTS idx_branch_tests_branch_id ON branch_tests(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_tests_test_id ON branch_tests(test_id);

-- ============================================
-- 19. BRANCH_TEST_FIELDS (UserTestField model)
-- Model: models/definitions/UserTestField.js → tableName: "branch_test_fields"
-- ============================================
CREATE TABLE IF NOT EXISTS branch_test_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    test_field_id UUID REFERENCES test_fields(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    field_name VARCHAR(255),
    unit VARCHAR(100),
    min_value DECIMAL(10, 2),
    max_value DECIMAL(10, 2),
    input_type VARCHAR(50) DEFAULT 'number',
    options TEXT,
    order_index INTEGER DEFAULT 0,
    field_type VARCHAR(50) DEFAULT 'input',
    formula TEXT,
    depends_on TEXT,
    section_group VARCHAR(255),
    reference_rules JSONB,
    critical_rules JSONB,
    is_mandatory BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, test_id, field_name)
);

CREATE INDEX IF NOT EXISTS idx_branch_test_fields_test_id ON branch_test_fields(test_id);
CREATE INDEX IF NOT EXISTS idx_branch_test_fields_branch_id ON branch_test_fields(branch_id);

-- ============================================
-- 20. WHATSAPP_SESSIONS
-- Model: models/definitions/WhatsappSession.js → tableName: "whatsapp_sessions"
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'disconnected',
    phone_number VARCHAR(30),
    wa_jid VARCHAR(120),
    qr_expires_at TIMESTAMP,
    last_connected_at TIMESTAMP,
    last_disconnected_at TIMESTAMP,
    failure_reason TEXT,
    session_metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_branch_id ON whatsapp_sessions(branch_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_status ON whatsapp_sessions(status);

-- ============================================
-- 21. WHATSAPP_TEMPLATES
-- Model: models/definitions/WhatsappTemplate.js → tableName: "whatsapp_templates"
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    event_key VARCHAR(80) NOT NULL,
    template_name VARCHAR(140) NOT NULL,
    template_body TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, event_key)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_branch_event ON whatsapp_templates(branch_id, event_key);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_enabled ON whatsapp_templates(is_enabled);

-- ============================================
-- 22. WHATSAPP_NOTIFICATION_SETTINGS
-- Model: models/definitions/WhatsappNotificationSetting.js → tableName: "whatsapp_notification_settings"
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    event_key VARCHAR(80) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, event_key)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_notification_settings_branch_event ON whatsapp_notification_settings(branch_id, event_key);

-- ============================================
-- 23. PASSWORD_RESET_OTPS
-- Model: models/definitions/PasswordResetOtp.js → tableName: "password_reset_otps"
-- Note: underscored: true in model, createdAt→created_at, updatedAt→updated_at
-- ============================================
CREATE TABLE IF NOT EXISTS password_reset_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email ON password_reset_otps(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires_at ON password_reset_otps(expires_at);

-- ============================================
-- 24. TEST_PACKAGES (used by seed data, no Sequelize model)
-- ============================================
CREATE TABLE IF NOT EXISTS test_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_name VARCHAR(255) NOT NULL,
    package_code VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    price DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    test_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_test_packages_code_global ON test_packages (package_code) WHERE branch_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_test_packages_code_branch ON test_packages (package_code, branch_id) WHERE branch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_test_packages_category ON test_packages(category);

-- ============================================
-- 25. SAMPLE_ID_COUNTER + GENERATOR FUNCTION
-- ============================================
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
-- 26. SCHEMA_MIGRATIONS (tracking table for init.js)
-- ============================================
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MIGRATION 001: TABLE CREATION COMPLETE
-- All 25 tables created with ALL columns matching model definitions.
-- Data seeding handled by: 002_seed_test_data.sql
-- ============================================
