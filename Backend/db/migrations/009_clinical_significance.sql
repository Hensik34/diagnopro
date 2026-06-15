-- Migration 009: Add clinical_significance columns
ALTER TABLE tests ADD COLUMN IF NOT EXISTS clinical_significance TEXT DEFAULT NULL;
ALTER TABLE branch_tests ADD COLUMN IF NOT EXISTS clinical_significance TEXT DEFAULT NULL;
