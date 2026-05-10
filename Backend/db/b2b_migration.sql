-- ============================================
-- B2B REFERENCE LAB WORKFLOW — DATABASE MIGRATION
-- Production-Grade Schema v2 (UUID-based)
-- ============================================

BEGIN;

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
    -- Commission config
    commission_type VARCHAR(20) DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
    commission_value DECIMAL(10,2) DEFAULT 0,
    -- Credit limit
    credit_limit DECIMAL(12,2) DEFAULT 0,
    current_balance DECIMAL(12,2) DEFAULT 0,
    -- Type & ownership
    lab_type VARCHAR(20) DEFAULT 'collection' CHECK (lab_type IN ('collection', 'processing')),
    owner_branch_id UUID REFERENCES branches(id),
    -- Login
    user_id UUID REFERENCES users(id),
    -- Report branding
    logo_url TEXT,
    show_processing_lab BOOLEAN DEFAULT false,
    custom_footer TEXT,
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP,
    -- Optimistic locking
    version INTEGER DEFAULT 1,
    -- Timestamps
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_b2b_labs_owner ON b2b_labs(owner_branch_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_b2b_labs_status ON b2b_labs(status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_b2b_labs_user ON b2b_labs(user_id);
CREATE INDEX IF NOT EXISTS idx_b2b_labs_code ON b2b_labs(lab_code);

-- ============================================
-- 2. B2B RATE LISTS (per lab per test pricing)
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
-- 3. B2B ORDERS (outsource requests)
-- ============================================
CREATE TABLE IF NOT EXISTS b2b_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code VARCHAR(50) UNIQUE NOT NULL,
    -- Lab references
    source_lab_id UUID NOT NULL REFERENCES b2b_labs(id),
    dest_branch_id UUID REFERENCES branches(id),
    -- Patient snapshot
    patient_id UUID REFERENCES patients(id),
    patient_name VARCHAR(255),
    patient_age INTEGER,
    patient_gender VARCHAR(20),
    patient_phone VARCHAR(20),
    -- Doctor (separate from B2B margin)
    doctor_id UUID REFERENCES doctors(id),
    doctor_commission DECIMAL(10,2) DEFAULT 0,
    -- Sample details
    sample_id UUID REFERENCES samples(id),
    barcode VARCHAR(100) UNIQUE,
    sample_type VARCHAR(100),
    container_type VARCHAR(100),
    fasting_required BOOLEAN DEFAULT false,
    collected_by UUID REFERENCES users(id),
    collection_time TIMESTAMP,
    received_time TIMESTAMP,
    temperature_notes TEXT,
    -- Status (auto-computed from test statuses)
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
        'pending', 'sample_sent', 'sample_received', 'processing',
        'partial_complete', 'completed', 'report_released',
        'rejected', 'cancelled'
    )),
    -- Financials
    total_collection_amount DECIMAL(10,2) DEFAULT 0,
    total_processing_amount DECIMAL(10,2) DEFAULT 0,
    margin_amount DECIMAL(10,2) DEFAULT 0,
    -- Report config
    show_processing_lab BOOLEAN DEFAULT false,
    -- Notes
    notes TEXT,
    rejection_reason TEXT,
    -- Soft delete
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP,
    -- Optimistic locking
    version INTEGER DEFAULT 1,
    -- Timestamps
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
-- 4. B2B ORDER TESTS (per-test tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS b2b_order_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES b2b_orders(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES tests(id),
    test_name VARCHAR(255) NOT NULL,
    -- Package support
    is_package BOOLEAN DEFAULT false,
    parent_test_id UUID REFERENCES b2b_order_tests(id),
    -- Pricing
    collection_price DECIMAL(10,2) DEFAULT 0,
    processing_price DECIMAL(10,2) DEFAULT 0,
    -- Per-test status
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'approved', 'rejected', 'cancelled'
    )),
    -- TAT tracking
    expected_tat_hours INTEGER,
    expected_completion_at TIMESTAMP,
    actual_completion_at TIMESTAMP,
    is_tat_breached BOOLEAN DEFAULT false,
    -- Report link
    report_id UUID REFERENCES reports(id),
    -- Report versioning
    report_version INTEGER DEFAULT 0,
    -- Rejection
    rejection_reason TEXT,
    -- Duplicate prevention
    UNIQUE(order_id, test_id),
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_b2b_ot_order ON b2b_order_tests(order_id);
CREATE INDEX IF NOT EXISTS idx_b2b_ot_test ON b2b_order_tests(test_id);
CREATE INDEX IF NOT EXISTS idx_b2b_ot_status ON b2b_order_tests(status);
CREATE INDEX IF NOT EXISTS idx_b2b_ot_tat ON b2b_order_tests(expected_completion_at) WHERE is_tat_breached = false;

-- ============================================
-- 5. B2B REPORT VERSIONS (revision history)
-- ============================================
CREATE TABLE IF NOT EXISTS b2b_report_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_test_id UUID NOT NULL REFERENCES b2b_order_tests(id) ON DELETE CASCADE,
    report_id UUID REFERENCES reports(id),
    version_number INTEGER NOT NULL DEFAULT 1,
    file_url TEXT,
    report_data JSONB,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'uploaded', 'approved', 'released', 'revised')),
    -- Approval flow
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
-- 6. B2B PAYMENTS & SETTLEMENTS
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
    -- Soft delete
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP,
    -- Timestamps
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_b2b_pay_lab ON b2b_payments(b2b_lab_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_b2b_pay_type ON b2b_payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_b2b_pay_created ON b2b_payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_b2b_pay_order ON b2b_payments(order_id);

-- ============================================
-- 7. B2B AUDIT LOG
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
-- 8. B2B NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS b2b_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    b2b_lab_id UUID REFERENCES b2b_labs(id),
    user_id UUID REFERENCES users(id),
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'sample_received', 'report_completed', 'report_approved', 'report_released',
        'payment_due', 'sample_rejected', 'tat_breach', 'credit_limit_warning',
        'report_revised', 'order_cancelled'
    )),
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
-- 9. HELPER FUNCTION: Auto-compute order status
-- ============================================
CREATE OR REPLACE FUNCTION compute_b2b_order_status(p_order_id UUID)
RETURNS VARCHAR(30) AS $$
DECLARE
    v_total INTEGER;
    v_pending INTEGER;
    v_processing INTEGER;
    v_completed INTEGER;
    v_approved INTEGER;
    v_rejected INTEGER;
    v_cancelled INTEGER;
BEGIN
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'pending'),
        COUNT(*) FILTER (WHERE status = 'processing'),
        COUNT(*) FILTER (WHERE status = 'completed'),
        COUNT(*) FILTER (WHERE status = 'approved'),
        COUNT(*) FILTER (WHERE status = 'rejected'),
        COUNT(*) FILTER (WHERE status = 'cancelled')
    INTO v_total, v_pending, v_processing, v_completed, v_approved, v_rejected, v_cancelled
    FROM b2b_order_tests
    WHERE order_id = p_order_id;

    IF v_total = 0 THEN RETURN 'pending'; END IF;
    IF v_cancelled = v_total THEN RETURN 'cancelled'; END IF;
    IF v_rejected = v_total THEN RETURN 'rejected'; END IF;
    IF (v_approved + v_cancelled + v_rejected) = v_total THEN RETURN 'completed'; END IF;
    IF (v_completed + v_approved + v_cancelled + v_rejected) = v_total THEN RETURN 'completed'; END IF;
    IF (v_completed + v_approved) > 0 AND v_pending > 0 THEN RETURN 'partial_complete'; END IF;
    IF v_processing > 0 THEN RETURN 'processing'; END IF;
    RETURN 'pending';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. TRIGGER: Auto-update order status on test status change
-- ============================================
CREATE OR REPLACE FUNCTION trigger_update_order_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE b2b_orders
    SET status = compute_b2b_order_status(NEW.order_id),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.order_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_test_status ON b2b_order_tests;
CREATE TRIGGER trg_order_test_status
    AFTER INSERT OR UPDATE OF status ON b2b_order_tests
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_order_status();

-- ============================================
-- 11. TRIGGER: Auto-check TAT breach
-- ============================================
CREATE OR REPLACE FUNCTION trigger_check_tat_breach()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expected_completion_at IS NOT NULL
       AND NEW.actual_completion_at IS NULL
       AND NEW.status NOT IN ('completed', 'approved', 'rejected', 'cancelled')
       AND CURRENT_TIMESTAMP > NEW.expected_completion_at THEN
        NEW.is_tat_breached = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tat_check ON b2b_order_tests;
CREATE TRIGGER trg_tat_check
    BEFORE UPDATE ON b2b_order_tests
    FOR EACH ROW
    EXECUTE FUNCTION trigger_check_tat_breach();

COMMIT;
