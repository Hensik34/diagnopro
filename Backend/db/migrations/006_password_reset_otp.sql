-- ============================================
-- Migration 006: Password Reset OTPs Table
-- ============================================
-- Stores hashed OTPs for the forgot-password flow.
-- OTPs are hashed with bcrypt before storage (like passwords).

CREATE TABLE IF NOT EXISTS password_reset_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email ON password_reset_otps(email);

-- Index for cleanup of expired OTPs
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires_at ON password_reset_otps(expires_at);
