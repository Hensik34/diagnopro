-- Migration: Create user_tests table for user-specific test overrides
-- Date: 2026-04-25

CREATE TABLE IF NOT EXISTS user_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  test_id UUID NOT NULL,
  test_name TEXT,
  category TEXT,
  sample_type TEXT,
  price NUMERIC,
  turnaround_time INTEGER,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, test_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_tests_user_id ON user_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tests_test_id ON user_tests(test_id);
CREATE INDEX IF NOT EXISTS idx_user_tests_user_test ON user_tests(user_id, test_id);