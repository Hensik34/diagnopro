-- Migration 006: Add delivery_preferences JSONB column to reports
-- Stores how the report should be sent (WhatsApp, Email) to patient and doctor

ALTER TABLE reports ADD COLUMN IF NOT EXISTS delivery_preferences JSONB DEFAULT '{}';
