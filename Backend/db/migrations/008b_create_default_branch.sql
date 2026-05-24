-- ============================================
-- Migration 029: Create Default Branch
-- Must run BEFORE seeding tests
-- ============================================

INSERT INTO branches (id, name, location, city, state, phone, email, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Main Branch',
  'Headquarters',
  'Default City',
  'Default State',
  '+1234567890',
  'main@lab.com',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;
