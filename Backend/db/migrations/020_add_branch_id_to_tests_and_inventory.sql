-- Migration: Add branch_id to tests and inventory for per-branch data isolation
-- 
-- Problem: Tests and inventory are global — all branches see the same data.
-- When one branch edits a test, it affects all branches.
--
-- Fix:
-- 1. Add branch_id to tests table (nullable initially for migration)
-- 2. Change unique constraint from (test_code) to (test_code, branch_id)
-- 3. Add branch_id to inventory table
-- 4. Create index for fast branch lookups

-- ==========================================
-- TESTS: Add branch_id
-- ==========================================

-- Add branch_id column (nullable for now to allow migration of existing data)
ALTER TABLE tests ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE CASCADE;

-- Drop the old unique constraint on test_code alone
ALTER TABLE tests DROP CONSTRAINT IF EXISTS tests_test_code_key;

-- Add new unique constraint: test_code must be unique PER branch
ALTER TABLE tests ADD CONSTRAINT tests_test_code_branch_unique UNIQUE (test_code, branch_id);

-- Index for fast branch lookups
CREATE INDEX IF NOT EXISTS idx_tests_branch_id ON tests(branch_id);

-- ==========================================
-- INVENTORY: Add branch_id
-- ==========================================

ALTER TABLE inventory ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_inventory_branch_id ON inventory(branch_id);

-- ==========================================
-- Migrate existing data: assign to first branch
-- ==========================================

-- Assign existing tests to the first branch (if any exist)
UPDATE tests SET branch_id = (SELECT id FROM branches ORDER BY created_at ASC LIMIT 1) WHERE branch_id IS NULL;

-- Assign existing inventory to the first branch (if any exist)  
UPDATE inventory SET branch_id = (SELECT id FROM branches ORDER BY created_at ASC LIMIT 1) WHERE branch_id IS NULL;

-- Now make branch_id NOT NULL
ALTER TABLE tests ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE inventory ALTER COLUMN branch_id SET NOT NULL;
