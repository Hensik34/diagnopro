-- 007_report_safe_areas.sql
-- Adds explicit header/footer safe area controls for report rendering.

ALTER TABLE settings
ADD COLUMN IF NOT EXISTS header_safe_area INTEGER DEFAULT 24;

ALTER TABLE settings
ADD COLUMN IF NOT EXISTS footer_safe_area INTEGER DEFAULT 24;
