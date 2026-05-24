-- Migration: Create user_test_fields table for user-specific test field overrides
-- Date: 2026-04-25

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

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_test_fields_user_id ON user_test_fields(user_id);
CREATE INDEX IF NOT EXISTS idx_user_test_fields_test_id ON user_test_fields(test_id);
CREATE INDEX IF NOT EXISTS idx_user_test_fields_user_test ON user_test_fields(user_id, test_id);