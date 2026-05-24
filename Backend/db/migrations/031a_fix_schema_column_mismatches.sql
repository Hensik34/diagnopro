-- Migration: Fix schema column mismatches
-- Align database schema with application models

-- ============================================
-- 1. FIX TIME_LOGS TABLE
-- ============================================
-- Ensure time_logs has the correct columns for the models

-- Add clock_in if check_in_time doesn't exist but clock_in doesn't either
ALTER TABLE time_logs 
  ADD COLUMN IF NOT EXISTS clock_in TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add clock_out if it doesn't exist  
ALTER TABLE time_logs 
  ADD COLUMN IF NOT EXISTS clock_out TIMESTAMP;

-- Add total_hours if it doesn't exist
ALTER TABLE time_logs 
  ADD COLUMN IF NOT EXISTS total_hours DECIMAL(5, 2);

-- ============================================
-- 2. ENSURE INVENTORY TABLE HAS CORRECT COLUMNS
-- ============================================

-- Add branch_id to inventory if it doesn't exist
ALTER TABLE inventory 
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE CASCADE;

-- Add unit column if missing
ALTER TABLE inventory 
  ADD COLUMN IF NOT EXISTS unit VARCHAR(50) NOT NULL DEFAULT 'packs';

-- ============================================
-- 3. ENSURE USER_TESTS HAS ALL REQUIRED COLUMNS
-- ============================================

-- Add missing columns to user_tests if they don't exist
ALTER TABLE user_tests 
  ADD COLUMN IF NOT EXISTS test_name TEXT;

ALTER TABLE user_tests 
  ADD COLUMN IF NOT EXISTS category TEXT;

ALTER TABLE user_tests 
  ADD COLUMN IF NOT EXISTS sample_type TEXT;

ALTER TABLE user_tests 
  ADD COLUMN IF NOT EXISTS price NUMERIC;

ALTER TABLE user_tests 
  ADD COLUMN IF NOT EXISTS turnaround_time INTEGER;

ALTER TABLE user_tests 
  ADD COLUMN IF NOT EXISTS description TEXT;

-- ============================================
-- 4. ADD INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_tests_user_id ON user_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tests_test_id ON user_tests(test_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_clock_in ON time_logs(clock_in);
CREATE INDEX IF NOT EXISTS idx_inventory_branch_id ON inventory(branch_id);

-- ============================================
-- 3. ENSURE USER_TESTS HAS ALL REQUIRED COLUMNS
-- ============================================

-- Add missing columns to user_tests if they don't exist
ALTER TABLE user_tests 
  ADD COLUMN IF NOT EXISTS test_name TEXT;

ALTER TABLE user_tests 
  ADD COLUMN IF NOT EXISTS category TEXT;

ALTER TABLE user_tests 
  ADD COLUMN IF NOT EXISTS sample_type TEXT;

ALTER TABLE user_tests 
  ADD COLUMN IF NOT EXISTS price NUMERIC;

ALTER TABLE user_tests 
  ADD COLUMN IF NOT EXISTS turnaround_time INTEGER;

ALTER TABLE user_tests 
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Add FK constraints if needed
ALTER TABLE user_tests 
  ADD CONSTRAINT IF NOT EXISTS fk_user_tests_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_tests 
  ADD CONSTRAINT IF NOT EXISTS fk_user_tests_test_id 
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE;

-- ============================================
-- 4. ADD INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_tests_user_id ON user_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tests_test_id ON user_tests(test_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_clock_in ON time_logs(clock_in);
