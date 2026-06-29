-- ============================================
-- MIGRATION 004: ADD PRICE LIST DEFAULT FLAG
-- ============================================

ALTER TABLE price_lists ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_price_lists_default_branch 
ON price_lists (branch_id) 
WHERE (is_default = TRUE);
