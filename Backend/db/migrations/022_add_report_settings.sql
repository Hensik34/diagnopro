-- Migration: Add report layout settings
-- Created: 2026-04-27

ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS header_url TEXT,
ADD COLUMN IF NOT EXISTS footer_url TEXT,
ADD COLUMN IF NOT EXISTS report_margin_top INTEGER DEFAULT 160,
ADD COLUMN IF NOT EXISTS report_margin_bottom INTEGER DEFAULT 120,
ADD COLUMN IF NOT EXISTS report_margin_left INTEGER DEFAULT 28,
ADD COLUMN IF NOT EXISTS report_margin_right INTEGER DEFAULT 28;
