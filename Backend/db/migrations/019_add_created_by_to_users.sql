-- Migration: Add created_by to users & fix branch-user relationship
-- 
-- Problem: Users and branches have no ownership link.
-- - Self-registered admin isn't linked to branches they create
-- - Sub-users created by admin aren't linked to any branch
-- - GET /branches returns all branches globally
--
-- Fix:
-- 1. Add created_by to users (NULL = self-registered admin, UUID = created by that admin)
-- 2. Ensure user_branches is used properly (handled in app code)

-- Add created_by column to track which admin created a sub-user
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Index for quickly finding all users created by a specific admin
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);
