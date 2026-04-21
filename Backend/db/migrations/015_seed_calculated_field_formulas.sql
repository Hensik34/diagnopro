-- Migration: Seed common calculated fields for standard tests
-- Date: 2026-04-05
-- Description: Updates existing test fields to mark calculated/flag types
--              and adds formulas for well-known derived parameters.
--
-- NOTE: This migration uses test names + field names to match.
--       Run AFTER 014_add_field_type_and_formula.sql
--       If fields don't exist yet, they will need to be created in Test Management.

-- ============================================================================
-- LIPID PROFILE: VLDL & TC/HDL Ratio are calculated
-- ============================================================================

-- VLDL Cholesterol = Triglycerides / 5  (Friedewald formula)
UPDATE test_fields
SET field_type = 'calculated',
    formula = 'Triglycerides / 5',
    depends_on = '["Triglycerides"]'
WHERE field_name = 'VLDL Cholesterol'
  AND test_id IN (SELECT id FROM tests WHERE LOWER(test_name) LIKE '%lipid%');

-- LDL Cholesterol = Total Cholesterol - HDL Cholesterol - VLDL Cholesterol
-- (Friedewald: LDL = TC - HDL - TG/5)
UPDATE test_fields
SET field_type = 'calculated',
    formula = 'Total Cholesterol - HDL Cholesterol - Triglycerides / 5',
    depends_on = '["Total Cholesterol", "HDL Cholesterol", "Triglycerides"]'
WHERE field_name = 'LDL Cholesterol'
  AND test_id IN (SELECT id FROM tests WHERE LOWER(test_name) LIKE '%lipid%');

-- TC/HDL Ratio = Total Cholesterol / HDL Cholesterol
UPDATE test_fields
SET field_type = 'calculated',
    formula = 'Total Cholesterol / HDL Cholesterol',
    depends_on = '["Total Cholesterol", "HDL Cholesterol"]'
WHERE field_name ILIKE '%tc/hdl%' OR field_name ILIKE '%cholesterol ratio%'
  AND test_id IN (SELECT id FROM tests WHERE LOWER(test_name) LIKE '%lipid%');

-- LDL/HDL Ratio
UPDATE test_fields
SET field_type = 'calculated',
    formula = 'LDL Cholesterol / HDL Cholesterol',
    depends_on = '["LDL Cholesterol", "HDL Cholesterol"]'
WHERE field_name ILIKE '%ldl/hdl%'
  AND test_id IN (SELECT id FROM tests WHERE LOWER(test_name) LIKE '%lipid%');

-- ============================================================================
-- HbA1c: Estimated Average Glucose (eAG) from HbA1c
-- ============================================================================
UPDATE test_fields
SET field_type = 'calculated',
    formula = '28.7 * HbA1c - 46.7',
    depends_on = '["HbA1c"]'
WHERE (field_name ILIKE '%estimated%glucose%' OR field_name ILIKE '%eAG%')
  AND test_id IN (SELECT id FROM tests WHERE LOWER(test_name) LIKE '%hba1c%' OR LOWER(test_name) LIKE '%glycated%');

-- ============================================================================
-- LIVER FUNCTION: A/G Ratio = Albumin / Globulin
-- ============================================================================
UPDATE test_fields
SET field_type = 'calculated',
    formula = 'Albumin / Globulin',
    depends_on = '["Albumin", "Globulin"]'
WHERE field_name ILIKE '%a/g ratio%' OR field_name ILIKE '%albumin globulin ratio%'
  AND test_id IN (SELECT id FROM tests WHERE LOWER(test_name) LIKE '%liver%' OR LOWER(test_name) LIKE '%lft%');

-- Globulin = Total Protein - Albumin
UPDATE test_fields
SET field_type = 'calculated',
    formula = 'Total Protein - Albumin',
    depends_on = '["Total Protein", "Albumin"]'
WHERE field_name = 'Globulin'
  AND test_id IN (SELECT id FROM tests WHERE LOWER(test_name) LIKE '%liver%' OR LOWER(test_name) LIKE '%lft%');

-- ============================================================================
-- RENAL FUNCTION / KFT: BUN = Blood Urea / 2.14 (if Urea is in mg/dL)
-- ============================================================================
UPDATE test_fields
SET field_type = 'calculated',
    formula = 'Blood Urea / 2.14',
    depends_on = '["Blood Urea"]'
WHERE field_name = 'BUN'
  AND test_id IN (SELECT id FROM tests WHERE LOWER(test_name) LIKE '%renal%' OR LOWER(test_name) LIKE '%kft%' OR LOWER(test_name) LIKE '%kidney%');

-- ============================================================================
-- CBC: MCH, MCV, MCHC are sometimes calculated
-- MCV = (Hematocrit / RBC Count) * 10
-- MCH = (Hemoglobin / RBC Count) * 10  
-- MCHC = (Hemoglobin / Hematocrit) * 100
-- ============================================================================
UPDATE test_fields
SET field_type = 'calculated',
    formula = '(Hematocrit / RBC Count) * 10',
    depends_on = '["Hematocrit", "RBC Count"]'
WHERE field_name = 'MCV'
  AND test_id IN (SELECT id FROM tests WHERE LOWER(test_name) LIKE '%cbc%' OR LOWER(test_name) LIKE '%complete blood count%');

UPDATE test_fields
SET field_type = 'calculated',
    formula = '(Hemoglobin / RBC Count) * 10',
    depends_on = '["Hemoglobin", "RBC Count"]'
WHERE field_name = 'MCH'
  AND test_id IN (SELECT id FROM tests WHERE LOWER(test_name) LIKE '%cbc%' OR LOWER(test_name) LIKE '%complete blood count%');

UPDATE test_fields
SET field_type = 'calculated',
    formula = '(Hemoglobin / Hematocrit) * 100',
    depends_on = '["Hemoglobin", "Hematocrit"]'
WHERE field_name = 'MCHC'
  AND test_id IN (SELECT id FROM tests WHERE LOWER(test_name) LIKE '%cbc%' OR LOWER(test_name) LIKE '%complete blood count%');
