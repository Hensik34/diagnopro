-- ============================================
-- Migration 031: Fix schema/model mismatches
-- Brings DB fully in line with all 14 models
-- Run after all previous migrations
-- ============================================

-- ─────────────────────────────────────────────
-- 1. PATIENTS — use name + age (not firstname/lastname/dob)
-- ─────────────────────────────────────────────
ALTER TABLE patients ADD COLUMN IF NOT EXISTS name VARCHAR(200);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS age INTEGER;

-- Backfill name from firstname + lastname if they still exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'firstname'
  ) THEN
    UPDATE patients
    SET name = TRIM(CONCAT(firstname, ' ', COALESCE(lastname, '')))
    WHERE name IS NULL;

    ALTER TABLE patients DROP COLUMN IF EXISTS firstname;
    ALTER TABLE patients DROP COLUMN IF EXISTS lastname;
    ALTER TABLE patients DROP COLUMN IF EXISTS date_of_birth;
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- 2. SETTINGS — flatten from EAV to dedicated columns
-- ─────────────────────────────────────────────
ALTER TABLE settings DROP COLUMN IF EXISTS key;
ALTER TABLE settings DROP COLUMN IF EXISTS value;
ALTER TABLE settings DROP COLUMN IF EXISTS data_type;

ALTER TABLE settings ADD COLUMN IF NOT EXISTS letterhead_url TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS owner_signature_url TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS header_url TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS footer_url TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS report_margin_top    VARCHAR(20) DEFAULT '10mm';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS report_margin_bottom VARCHAR(20) DEFAULT '10mm';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS report_margin_left   VARCHAR(20) DEFAULT '10mm';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS report_margin_right  VARCHAR(20) DEFAULT '10mm';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS signature_1_url   TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS signature_1_label VARCHAR(255);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS signature_2_url   TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS signature_2_label VARCHAR(255);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS signature_3_url   TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS signature_3_label VARCHAR(255);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS signature_4_url   TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS signature_4_label VARCHAR(255);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS default_signature_index INTEGER DEFAULT 0;

-- Ensure UNIQUE on branch_id for upsert ON CONFLICT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'settings_branch_id_key'
  ) THEN
    ALTER TABLE settings ADD CONSTRAINT settings_branch_id_key UNIQUE (branch_id);
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- 3. DOCTORS — add missing columns
-- ─────────────────────────────────────────────
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS title                VARCHAR(20) DEFAULT 'Dr';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS name                 VARCHAR(200);
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5,2) DEFAULT 0;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS signature_url        TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS user_id              UUID REFERENCES users(id);
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS password_hash        VARCHAR(255);

-- Backfill name from firstname if empty
UPDATE doctors
SET name = TRIM(CONCAT(COALESCE(firstname,''), ' ', COALESCE(lastname,'')))
WHERE name IS NULL AND firstname IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);

-- ─────────────────────────────────────────────
-- 4. REPORTS — add all billing + workflow columns
-- ─────────────────────────────────────────────
ALTER TABLE reports ADD COLUMN IF NOT EXISTS report_amount      DECIMAL(12,2) DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS doctor_commission  DECIMAL(12,2) DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS is_self_report     BOOLEAN DEFAULT false;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS test_data          JSONB DEFAULT '{}';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS delivery_preferences JSONB DEFAULT '{}';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS base_amount        DECIMAL(12,2) DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS lab_discount_type  VARCHAR(20) DEFAULT 'percent';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS lab_discount_value DECIMAL(10,2) DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS doctor_discount    DECIMAL(10,2) DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS final_amount       DECIMAL(12,2) DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS payment_status     VARCHAR(30) DEFAULT 'pending';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS b2b_lab_id         UUID REFERENCES b2b_labs(id);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS b2b_charge         DECIMAL(10,2) DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS submitted_by       UUID REFERENCES users(id);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS submitted_at       TIMESTAMP;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS rejected_by        UUID REFERENCES users(id);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS rejected_at        TIMESTAMP;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS rejection_reason   TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS approved_at        TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_reports_b2b_lab ON reports(b2b_lab_id)
  WHERE b2b_lab_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_payment_status ON reports(payment_status);
CREATE INDEX IF NOT EXISTS idx_reports_branch ON reports(branch_id)
  WHERE branch_id IS NOT NULL;

-- Branch ID on reports (derived from patient, but useful for direct filtering)
ALTER TABLE reports ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

-- ─────────────────────────────────────────────
-- 5. USER_TESTS — add per-user override columns
-- ─────────────────────────────────────────────
ALTER TABLE user_tests ADD COLUMN IF NOT EXISTS test_name       VARCHAR(255);
ALTER TABLE user_tests ADD COLUMN IF NOT EXISTS category        VARCHAR(100);
ALTER TABLE user_tests ADD COLUMN IF NOT EXISTS sample_type     VARCHAR(100);
ALTER TABLE user_tests ADD COLUMN IF NOT EXISTS price           DECIMAL(10,2);
ALTER TABLE user_tests ADD COLUMN IF NOT EXISTS turnaround_time INT;
ALTER TABLE user_tests ADD COLUMN IF NOT EXISTS description     TEXT;
ALTER TABLE user_tests ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- ─────────────────────────────────────────────
-- 6. USER_TEST_FIELDS — add all field columns
-- ─────────────────────────────────────────────
ALTER TABLE user_test_fields ADD COLUMN IF NOT EXISTS test_id       UUID REFERENCES tests(id) ON DELETE CASCADE;
ALTER TABLE user_test_fields ADD COLUMN IF NOT EXISTS field_name    VARCHAR(255);
ALTER TABLE user_test_fields ADD COLUMN IF NOT EXISTS unit          VARCHAR(100);
ALTER TABLE user_test_fields ADD COLUMN IF NOT EXISTS min_value     DECIMAL(10,2);
ALTER TABLE user_test_fields ADD COLUMN IF NOT EXISTS max_value     DECIMAL(10,2);
ALTER TABLE user_test_fields ADD COLUMN IF NOT EXISTS input_type    VARCHAR(50) DEFAULT 'number';
ALTER TABLE user_test_fields ADD COLUMN IF NOT EXISTS options       TEXT;
ALTER TABLE user_test_fields ADD COLUMN IF NOT EXISTS order_index   INT DEFAULT 0;
ALTER TABLE user_test_fields ADD COLUMN IF NOT EXISTS field_type    VARCHAR(50) DEFAULT 'input';
ALTER TABLE user_test_fields ADD COLUMN IF NOT EXISTS formula       TEXT;
ALTER TABLE user_test_fields ADD COLUMN IF NOT EXISTS depends_on    TEXT;
ALTER TABLE user_test_fields ADD COLUMN IF NOT EXISTS section_group VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_user_test_fields_test_id ON user_test_fields(test_id);

-- ─────────────────────────────────────────────
-- 7. TEST_FIELDS — add missing columns
-- ─────────────────────────────────────────────
ALTER TABLE test_fields ADD COLUMN IF NOT EXISTS options       TEXT;
ALTER TABLE test_fields ADD COLUMN IF NOT EXISTS depends_on    TEXT;
ALTER TABLE test_fields ADD COLUMN IF NOT EXISTS section_group VARCHAR(255);

-- Rename section_name → section_group if old column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'test_fields' AND column_name = 'section_name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'test_fields' AND column_name = 'section_group'
  ) THEN
    ALTER TABLE test_fields RENAME COLUMN section_name TO section_group;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'test_fields' AND column_name = 'section_name'
  ) THEN
    UPDATE test_fields SET section_group = section_name WHERE section_group IS NULL;
    ALTER TABLE test_fields DROP COLUMN IF EXISTS section_name;
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- 8. SAMPLE_ID_COUNTER — monthly sample numbering
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sample_id_counter (
  id           SERIAL PRIMARY KEY,
  year_month   VARCHAR(7) NOT NULL UNIQUE,
  last_number  INTEGER NOT NULL DEFAULT 0
);

-- ─────────────────────────────────────────────
-- 9. GENERATE_SAMPLE_ID function
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_sample_id()
RETURNS TEXT AS $$
DECLARE
  current_ym TEXT;
  short_ym   TEXT;
  next_num   INTEGER;
BEGIN
  current_ym := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  short_ym   := TO_CHAR(CURRENT_DATE, 'YYMM');

  INSERT INTO sample_id_counter (year_month, last_number)
  VALUES (current_ym, 1001)
  ON CONFLICT (year_month)
  DO UPDATE SET last_number = sample_id_counter.last_number + 1
  RETURNING last_number INTO next_num;

  RETURN 'SM-' || short_ym || '-' || next_num::TEXT;
END;
$$ LANGUAGE plpgsql;
