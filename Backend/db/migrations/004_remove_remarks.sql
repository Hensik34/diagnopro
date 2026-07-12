-- ============================================
-- MIGRATION 004: REMOVE REMARKS FROM SELECT TESTS
-- ============================================
-- Removes the 'Remark' parameter/field from specific tests:
-- Lipid Profile, TSH, Thyroid Profile, Free T3, Free T4, PSA, Free PSA, PTH, FBS, Cortisol (4 PM/8 AM/Random)
-- ============================================

DELETE FROM test_fields 
WHERE field_name = 'Remark' 
  AND test_id IN (
    SELECT id FROM tests 
    WHERE test_code IN (
      'LIPID-01',       -- Lipid profile
      'TSH-01',        -- TSH
      'THYPRO-01',     -- thyroid profile (T3 , T4 , TSH)
      'FT3-01',        -- Free T3
      'FT4-01',        -- Free T4
      'PSA-01',        -- PSA
      'FREE-PSA-01',   -- Free PSA
      'PTH-01',        -- PTH
      'FBS-01',        -- FBS
      'CORT-PM-01',    -- Cortisol (4 PM)
      'CORT-AM-01',    -- Cortisol (8 AM)
      'CORT-RAND-01'   -- Cortisol random
    )
  );
