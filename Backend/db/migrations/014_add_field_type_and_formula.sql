-- Migration: Add field_type, formula, and depends_on to test_fields
-- Date: 2026-04-05
-- Description: Supports three field types:
--   'input'      – manual entry (default, backward compatible)
--   'calculated'  – auto-computed from a formula referencing other fields
--   'flag'        – same as input but only for High/Low/Normal flag display
-- formula:    JS-style expression referencing other field names, e.g. "TotalCholesterol / HDL"
-- depends_on: JSON array of field names the formula references, e.g. '["TotalCholesterol","HDL"]'

ALTER TABLE test_fields
  ADD COLUMN IF NOT EXISTS field_type VARCHAR(20) DEFAULT 'input',
  ADD COLUMN IF NOT EXISTS formula TEXT,
  ADD COLUMN IF NOT EXISTS depends_on TEXT;

-- Add a comment for documentation
COMMENT ON COLUMN test_fields.field_type IS 'input = manual entry, calculated = derived from formula, flag = input with only High/Low/Normal display';
COMMENT ON COLUMN test_fields.formula IS 'JavaScript-style math expression, e.g. "TotalCholesterol / HDL". Field names must match exactly.';
COMMENT ON COLUMN test_fields.depends_on IS 'JSON array of field_name strings this calculated field depends on, e.g. [\"TotalCholesterol\",\"HDL\"]';
