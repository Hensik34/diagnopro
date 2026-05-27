-- ============================================
-- Schema patch: add missing updated_at for branch test fields
-- ============================================

ALTER TABLE branch_test_fields
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
