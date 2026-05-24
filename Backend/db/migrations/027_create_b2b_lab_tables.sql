-- ============================================
-- Migration 028: Create B2B Lab Tables
-- (Run BEFORE 027_add_b2b_to_reports.sql)
-- ============================================

-- ============================================
-- 1. B2B PARTNER LABS
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
-- 2. B2B RATE LISTS
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
-- 3. B2B ORDERS
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
    test_count INTEGER DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    b2b_charge DECIMAL(12,2) DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'pending',
    order_status VARCHAR(20) DEFAULT 'pending',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_b2b_orders_source ON b2b_orders(source_lab_id);
CREATE INDEX IF NOT EXISTS idx_b2b_orders_dest ON b2b_orders(dest_branch_id);
CREATE INDEX IF NOT EXISTS idx_b2b_orders_status ON b2b_orders(order_status);
