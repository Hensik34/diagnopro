-- ============================================
-- MIGRATION 003: MULTI-TIER TEST PRICING SCHEMA
-- ============================================

-- Table 1: price_lists
CREATE TABLE IF NOT EXISTS price_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,
    effective_from DATE,                       -- NULL = immediately effective
    effective_to DATE,                         -- NULL = no expiry
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, branch_id, version)
);

CREATE INDEX IF NOT EXISTS idx_price_lists_branch ON price_lists(branch_id);
CREATE INDEX IF NOT EXISTS idx_price_lists_active ON price_lists(is_active, branch_id);
CREATE INDEX IF NOT EXISTS idx_price_lists_effective ON price_lists(effective_from, effective_to);

-- Table 2: price_list_items
CREATE TABLE IF NOT EXISTS price_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    price DECIMAL(10, 2),                     -- flat override (NULL if using discount)
    discount_type VARCHAR(20) DEFAULT 'none', -- 'none' | 'percent' | 'amount'
    discount_value DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(price_list_id, test_id)
);

CREATE INDEX IF NOT EXISTS idx_price_list_items_list ON price_list_items(price_list_id);
CREATE INDEX IF NOT EXISTS idx_price_list_items_test ON price_list_items(test_id);

-- Table 3: doctor_price_list_assignments
CREATE TABLE IF NOT EXISTS doctor_price_list_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(doctor_id, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_doc_pl_assign_doctor ON doctor_price_list_assignments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doc_pl_assign_branch ON doctor_price_list_assignments(branch_id);

-- Table 4: doctor_test_prices
CREATE TABLE IF NOT EXISTS doctor_test_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(doctor_id, test_id, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_doctor_test_prices_doctor ON doctor_test_prices(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_test_prices_branch ON doctor_test_prices(branch_id);

-- Table 5: report_test_prices
CREATE TABLE IF NOT EXISTS report_test_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    test_id UUID REFERENCES tests(id) ON DELETE SET NULL,
    package_id UUID REFERENCES test_packages(id) ON DELETE SET NULL,
    default_price DECIMAL(10, 2) NOT NULL,
    applied_price DECIMAL(10, 2) NOT NULL,
    source VARCHAR(30) NOT NULL,                     -- 'default' | 'branch' | 'doctor_list' | 'doctor_override' | 'price_list' | 'manual' | 'package'
    source_id UUID,                                  -- UUID of the source item (e.g., price_list_id / doctor_test_prices id / package_id)
    price_list_version INTEGER,                      -- version of the price list used
    is_manual_override BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(report_id, test_id)
);

CREATE INDEX IF NOT EXISTS idx_rtp_report ON report_test_prices(report_id);
CREATE INDEX IF NOT EXISTS idx_rtp_test ON report_test_prices(test_id);
CREATE INDEX IF NOT EXISTS idx_rtp_source ON report_test_prices(source);

-- Table 6: price_audit_log
CREATE TABLE IF NOT EXISTS price_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
    test_id UUID REFERENCES tests(id) ON DELETE SET NULL,
    old_price DECIMAL(10, 2),
    new_price DECIMAL(10, 2),
    source VARCHAR(30),
    changed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_price_audit_report ON price_audit_log(report_id);
CREATE INDEX IF NOT EXISTS idx_price_audit_user ON price_audit_log(changed_by);
CREATE INDEX IF NOT EXISTS idx_price_audit_date ON price_audit_log(created_at);

-- ALTER existing tables
ALTER TABLE reports ADD COLUMN IF NOT EXISTS price_list_id UUID REFERENCES price_lists(id) ON DELETE SET NULL;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS price_locked BOOLEAN DEFAULT FALSE;
