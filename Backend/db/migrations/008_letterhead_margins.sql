-- 008_letterhead_margins.sql
-- Add columns for storing original auto-detected margins and auto-fill override flag

ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS letterhead_detected_top INTEGER NULL,
ADD COLUMN IF NOT EXISTS letterhead_detected_bottom INTEGER NULL,
ADD COLUMN IF NOT EXISTS letterhead_detected_left INTEGER NULL,
ADD COLUMN IF NOT EXISTS letterhead_detected_right INTEGER NULL,
ADD COLUMN IF NOT EXISTS letterhead_margins_auto BOOLEAN DEFAULT TRUE;
