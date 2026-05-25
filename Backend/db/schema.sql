-- Create Database (run manually first: CREATE DATABASE lab_management_db;)
-- Then run this schema file

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
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(test_code, branch_id)
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
-- B2B RATE LISTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS b2b_rate_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    b2b_lab_id UUID NOT NULL REFERENCES b2b_labs(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    collection_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    processing_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(b2b_lab_id, test_id)
);

CREATE INDEX IF NOT EXISTS idx_b2b_rates_lab ON b2b_rate_lists(b2b_lab_id);
CREATE INDEX IF NOT EXISTS idx_b2b_rates_test ON b2b_rate_lists(test_id);

-- ============================================
-- B2B ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS b2b_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code VARCHAR(50) UNIQUE NOT NULL,
    source_lab_id UUID NOT NULL REFERENCES b2b_labs(id),
    dest_branch_id UUID REFERENCES branches(id),
    patient_id UUID REFERENCES patients(id),
    patient_name VARCHAR(255),
    patient_age INTEGER,
    patient_gender VARCHAR(20),
    patient_phone VARCHAR(20),
    doctor_id UUID REFERENCES doctors(id),
    doctor_commission DECIMAL(10,2) DEFAULT 0,
    sample_id UUID REFERENCES samples(id),
    barcode VARCHAR(100) UNIQUE,
    sample_type VARCHAR(100),
    container_type VARCHAR(100),
    fasting_required BOOLEAN DEFAULT false,
    collected_by UUID REFERENCES users(id),
    collection_time TIMESTAMP,
    received_time TIMESTAMP,
    temperature_notes TEXT,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'sample_sent', 'sample_received', 'processing', 'partial_complete', 'completed', 'report_released', 'rejected', 'cancelled')),
    total_collection_amount DECIMAL(10,2) DEFAULT 0,
    total_processing_amount DECIMAL(10,2) DEFAULT 0,
    margin_amount DECIMAL(10,2) DEFAULT 0,
    show_processing_lab BOOLEAN DEFAULT false,
    notes TEXT,
    rejection_reason TEXT,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP,
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_b2b_orders_source ON b2b_orders(source_lab_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_b2b_orders_dest ON b2b_orders(dest_branch_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_b2b_orders_status ON b2b_orders(status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_b2b_orders_patient ON b2b_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_b2b_orders_barcode ON b2b_orders(barcode);
CREATE INDEX IF NOT EXISTS idx_b2b_orders_created ON b2b_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_b2b_orders_sample ON b2b_orders(sample_id);

-- ============================================
-- B2B ORDER TESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS b2b_order_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES b2b_orders(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES tests(id),
    test_name VARCHAR(255) NOT NULL,
    is_package BOOLEAN DEFAULT false,
    parent_test_id UUID REFERENCES b2b_order_tests(id),
    collection_price DECIMAL(10,2) DEFAULT 0,
    processing_price DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'approved', 'rejected', 'cancelled')),
    expected_tat_hours INTEGER,
    expected_completion_at TIMESTAMP,
    actual_completion_at TIMESTAMP,
    is_tat_breached BOOLEAN DEFAULT false,
    report_id UUID REFERENCES reports(id),
    report_version INTEGER DEFAULT 0,
    rejection_reason TEXT,
    UNIQUE(order_id, test_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_b2b_ot_order ON b2b_order_tests(order_id);
CREATE INDEX IF NOT EXISTS idx_b2b_ot_test ON b2b_order_tests(test_id);
CREATE INDEX IF NOT EXISTS idx_b2b_ot_status ON b2b_order_tests(status);
CREATE INDEX IF NOT EXISTS idx_b2b_ot_tat ON b2b_order_tests(expected_completion_at) WHERE is_tat_breached = false;

-- ============================================
-- B2B REPORT VERSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS b2b_report_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_test_id UUID NOT NULL REFERENCES b2b_order_tests(id) ON DELETE CASCADE,
    report_id UUID REFERENCES reports(id),
    version_number INTEGER NOT NULL DEFAULT 1,
    file_url TEXT,
    report_data JSONB,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'uploaded', 'approved', 'released', 'revised')),
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    released_by UUID REFERENCES users(id),
    released_at TIMESTAMP,
    revision_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_b2b_rv_order_test ON b2b_report_versions(order_test_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_b2b_rv_unique ON b2b_report_versions(order_test_id, version_number);

-- ============================================
-- B2B PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS b2b_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    b2b_lab_id UUID NOT NULL REFERENCES b2b_labs(id),
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('credit', 'debit', 'settlement', 'advance', 'adjustment')),
    amount DECIMAL(10,2) NOT NULL,
    running_balance DECIMAL(12,2),
    payment_mode VARCHAR(30) CHECK (payment_mode IN ('cash', 'upi', 'bank_transfer', 'cheque', 'neft', 'rtgs', NULL)),
    reference_number VARCHAR(100),
    order_id UUID REFERENCES b2b_orders(id),
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_b2b_pay_lab ON b2b_payments(b2b_lab_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_b2b_pay_type ON b2b_payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_b2b_pay_created ON b2b_payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_b2b_pay_order ON b2b_payments(order_id);

-- ============================================
-- B2B AUDIT LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS b2b_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    details JSONB,
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_b2b_audit_entity ON b2b_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_b2b_audit_action ON b2b_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_b2b_audit_time ON b2b_audit_log(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_b2b_audit_user ON b2b_audit_log(performed_by);

-- ============================================
-- B2B NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS b2b_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    b2b_lab_id UUID REFERENCES b2b_labs(id),
    user_id UUID REFERENCES users(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('sample_received', 'report_completed', 'report_approved', 'report_released', 'payment_due', 'sample_rejected', 'tat_breach', 'credit_limit_warning', 'report_revised', 'order_cancelled')),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    order_id UUID REFERENCES b2b_orders(id),
    is_read BOOLEAN DEFAULT false,
    channel VARCHAR(20) DEFAULT 'in_app' CHECK (channel IN ('in_app', 'whatsapp', 'sms', 'email')),
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_b2b_notif_lab ON b2b_notifications(b2b_lab_id);
CREATE INDEX IF NOT EXISTS idx_b2b_notif_user ON b2b_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_b2b_notif_read ON b2b_notifications(is_read) WHERE is_read = false;

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
    input_type VARCHAR(50) DEFAULT 'text', -- text, number, date, select, etc.
    order_index INT DEFAULT 0,
    section_name VARCHAR(255),
    field_type VARCHAR(50), -- normal, calculated
    formula TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_test_fields_test_id ON test_fields(test_id);
CREATE INDEX IF NOT EXISTS idx_test_fields_section ON test_fields(section_name);

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
-- USER TESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, test_id)
);

-- ============================================
-- USER TEST FIELDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_test_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_field_id UUID NOT NULL REFERENCES test_fields(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, test_field_id)
);
