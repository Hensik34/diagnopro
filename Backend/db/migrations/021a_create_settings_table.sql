-- Migration: Create settings table and add signature_url to doctors
-- Created: 2026-04-26

-- 1. Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL UNIQUE,
  letterhead_url TEXT,
  owner_signature_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key constraint
ALTER TABLE settings 
ADD CONSTRAINT fk_settings_branch 
FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_settings_branch_id ON settings(branch_id);

-- 2. Add signature_url column to doctors table
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS signature_url TEXT;

-- Create index for doctors signature lookup
CREATE INDEX IF NOT EXISTS idx_doctors_signature_url ON doctors(signature_url);