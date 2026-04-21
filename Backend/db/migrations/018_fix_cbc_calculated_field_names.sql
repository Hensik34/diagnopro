-- Migration: Fix CBC calculated field formulas to use correct field names
-- Date: 2026-04-10
-- Description: The seed migration (009) names the Hematocrit field as 'HCT',
--              but formula migration (015) references 'Hematocrit' in MCV and
--              MCHC formulas. This causes MCV and MCHC to never auto-calculate
--              because the evaluator can't resolve 'Hematocrit' in the value scope.
--
-- Fixes:
--   MCV  formula: (Hematocrit / RBC Count) * 10  →  (HCT / RBC Count) * 10
--   MCH  formula: no change needed (uses Hemoglobin / RBC Count — both correct)
--   MCHC formula: (Hemoglobin / Hematocrit) * 100  →  (Hemoglobin / HCT) * 100
--   depends_on arrays updated accordingly.

-- ============================================================================
-- MCV: fix formula and depends_on to use 'HCT' instead of 'Hematocrit'
-- ============================================================================
UPDATE test_fields
SET formula     = '(HCT / RBC Count) * 10',
    depends_on  = '["HCT", "RBC Count"]'
WHERE field_name = 'MCV'
  AND field_type = 'calculated'
  AND test_id IN (SELECT id FROM tests WHERE LOWER(test_name) LIKE '%cbc%' OR LOWER(test_name) LIKE '%complete blood count%');

-- ============================================================================
-- MCHC: fix formula and depends_on to use 'HCT' instead of 'Hematocrit'
-- ============================================================================
UPDATE test_fields
SET formula     = '(Hemoglobin / HCT) * 100',
    depends_on  = '["Hemoglobin", "HCT"]'
WHERE field_name = 'MCHC'
  AND field_type = 'calculated'
  AND test_id IN (SELECT id FROM tests WHERE LOWER(test_name) LIKE '%cbc%' OR LOWER(test_name) LIKE '%complete blood count%');
