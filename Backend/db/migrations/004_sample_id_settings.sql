-- Sample ID settings expansion
-- Adds branch-level controls for predefined sample ID formats and reset policy

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS sample_id_format VARCHAR(30) DEFAULT 'numeric',
  ADD COLUMN IF NOT EXISTS sample_id_reset_policy VARCHAR(30) DEFAULT 'yearly',
  ADD COLUMN IF NOT EXISTS sample_id_fy_start_month INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS sample_id_start_number INTEGER DEFAULT 1001;

UPDATE settings
SET
  sample_id_format = COALESCE(sample_id_format, 'numeric'),
  sample_id_reset_policy = COALESCE(sample_id_reset_policy, 'yearly'),
  sample_id_fy_start_month = COALESCE(sample_id_fy_start_month, 3),
  sample_id_start_number = COALESCE(sample_id_start_number, 1001);
