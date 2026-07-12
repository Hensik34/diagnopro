-- ============================================
-- MIGRATION 003: SECURITY & EMAIL UPDATES
-- ============================================
-- This migration:
-- 1. Creates the login_otps table for admin 2FA verification.
-- 2. Adds the recipient_email column to report_deliveries table.
-- ============================================

-- 1. LOGIN_OTPS
CREATE TABLE IF NOT EXISTS login_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_otps_email ON login_otps(email);
CREATE INDEX IF NOT EXISTS idx_login_otps_expires_at ON login_otps(expires_at);

-- 2. REPORT_DELIVERIES UPDATES
ALTER TABLE report_deliveries ADD COLUMN IF NOT EXISTS recipient_email VARCHAR(255);
