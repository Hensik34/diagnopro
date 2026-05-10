-- Add user_id column to doctors table to link doctor records to user accounts
-- This enables doctor login: a user with role='doctor' gets linked to their doctor record

ALTER TABLE doctors ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index for fast lookup by user_id
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
