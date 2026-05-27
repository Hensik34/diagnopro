-- ============================================
-- Patch migration: ensure branch override tables exist
-- and migrate legacy user override data if present
-- ============================================

-- Branch-level test overrides
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

-- Branch-level test field overrides
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

  ALTER TABLE branch_test_fields
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_branch_tests_branch_id ON branch_tests(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_tests_test_id ON branch_tests(test_id);
CREATE INDEX IF NOT EXISTS idx_branch_test_fields_test_id ON branch_test_fields(test_id);
CREATE INDEX IF NOT EXISTS idx_branch_test_fields_branch_id ON branch_test_fields(branch_id);

-- Best-effort legacy migration: user_tests -> branch_tests
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_tests'
  ) THEN
    INSERT INTO branch_tests (
      id, branch_id, test_id, test_name, category, sample_type,
      price, turnaround_time, description, created_at, updated_at
    )
    SELECT
      gen_random_uuid(),
      ub.branch_id,
      ut.test_id,
      ut.test_name,
      ut.category,
      ut.sample_type,
      ut.price,
      ut.turnaround_time,
      ut.description,
      COALESCE(ut.created_at, CURRENT_TIMESTAMP),
      COALESCE(ut.updated_at, CURRENT_TIMESTAMP)
    FROM user_tests ut
    JOIN LATERAL (
      SELECT user_branches.branch_id
      FROM user_branches
      WHERE user_branches.user_id = ut.user_id
      ORDER BY user_branches.created_at ASC NULLS LAST
      LIMIT 1
    ) ub ON TRUE
    ON CONFLICT (branch_id, test_id) DO UPDATE SET
      test_name = EXCLUDED.test_name,
      category = EXCLUDED.category,
      sample_type = EXCLUDED.sample_type,
      price = EXCLUDED.price,
      turnaround_time = EXCLUDED.turnaround_time,
      description = EXCLUDED.description,
      updated_at = CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Best-effort legacy migration: user_test_fields -> branch_test_fields
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_test_fields'
  ) THEN
    INSERT INTO branch_test_fields (
      id, branch_id, test_field_id, test_id, field_name, unit,
      min_value, max_value, input_type, options, order_index,
      field_type, formula, depends_on, section_group, created_at
    )
    SELECT
      gen_random_uuid(),
      ub.branch_id,
      utf.test_field_id,
      utf.test_id,
      utf.field_name,
      utf.unit,
      utf.min_value,
      utf.max_value,
      utf.input_type,
      utf.options,
      COALESCE(utf.order_index, 0),
      utf.field_type,
      utf.formula,
      utf.depends_on,
      utf.section_group,
      COALESCE(utf.created_at, CURRENT_TIMESTAMP)
    FROM user_test_fields utf
    JOIN LATERAL (
      SELECT user_branches.branch_id
      FROM user_branches
      WHERE user_branches.user_id = utf.user_id
      ORDER BY user_branches.created_at ASC NULLS LAST
      LIMIT 1
    ) ub ON TRUE
    WHERE utf.test_id IS NOT NULL
      AND utf.field_name IS NOT NULL
      AND LENGTH(TRIM(utf.field_name)) > 0
    ON CONFLICT (branch_id, test_id, field_name) DO UPDATE SET
      test_field_id = EXCLUDED.test_field_id,
      unit = EXCLUDED.unit,
      min_value = EXCLUDED.min_value,
      max_value = EXCLUDED.max_value,
      input_type = EXCLUDED.input_type,
      options = EXCLUDED.options,
      order_index = EXCLUDED.order_index,
      field_type = EXCLUDED.field_type,
      formula = EXCLUDED.formula,
      depends_on = EXCLUDED.depends_on,
      section_group = EXCLUDED.section_group;
  END IF;
END $$;
