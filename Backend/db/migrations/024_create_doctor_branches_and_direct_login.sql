-- Migration 024: Create doctor_branches table and add password_hash to doctors
-- This enables:
--   1. Doctors to be linked to multiple branches (like users via user_branches)
--   2. Doctors to login directly without needing a mirrored user record

-- ============================================
-- Step 1: Add password_hash to doctors table
-- ============================================
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- ============================================
-- Step 2: Create doctor_branches junction table
-- ============================================
CREATE TABLE IF NOT EXISTS doctor_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(doctor_id, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_doctor_branches_doctor_id ON doctor_branches(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_branches_branch_id ON doctor_branches(branch_id);

-- ============================================
-- Step 3: Migrate existing doctor→branch data
-- Copy each doctor's current branch_id into doctor_branches
-- ============================================
INSERT INTO doctor_branches (doctor_id, branch_id)
SELECT id, branch_id FROM doctors
WHERE branch_id IS NOT NULL
ON CONFLICT (doctor_id, branch_id) DO NOTHING;

-- ============================================
-- Step 4: Copy password_hash from linked user records
-- For doctors that already have a user_id, copy the password
-- so they can login directly as doctors
-- ============================================
UPDATE doctors d
SET password_hash = u.password_hash
FROM users u
WHERE d.user_id = u.id
  AND d.password_hash IS NULL
  AND u.password_hash IS NOT NULL;

-- ============================================
-- Step 5: Make branch_id nullable (no longer the single source)
-- ============================================
ALTER TABLE doctors ALTER COLUMN branch_id DROP NOT NULL;

-- Note: We keep branch_id for backward compatibility but
-- doctor_branches is now the source of truth for branch assignments
