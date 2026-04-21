-- Migration: Add section_group column to test_fields
-- Date: 2026-04-08
-- Description: Adds a grouping label for parameters within a test,
--              e.g. "HEMOGLOBIN", "RBC COUNT", "BLOOD INDICES" within CBC.
--              Rendered as bold sub-section headers in the report table.

ALTER TABLE test_fields
  ADD COLUMN IF NOT EXISTS section_group VARCHAR(100);

COMMENT ON COLUMN test_fields.section_group IS 'Sub-section heading within a test, e.g. HEMOGLOBIN, RBC COUNT. Rendered as bold row header in report.';

-- ============================================================================
-- Seed section groups for CBC
-- ============================================================================
UPDATE test_fields SET section_group = 'HEMOGLOBIN'
WHERE field_name = 'Hemoglobin'
  AND test_id IN (SELECT id FROM tests WHERE test_name ILIKE '%CBC%' OR test_name ILIKE '%Complete Blood Count%');

UPDATE test_fields SET section_group = 'RBC COUNT'
WHERE field_name = 'RBC Count'
  AND test_id IN (SELECT id FROM tests WHERE test_name ILIKE '%CBC%' OR test_name ILIKE '%Complete Blood Count%');

UPDATE test_fields SET section_group = 'BLOOD INDICES'
WHERE field_name IN ('HCT', 'MCV', 'MCH', 'MCHC', 'RDW')
  AND test_id IN (SELECT id FROM tests WHERE test_name ILIKE '%CBC%' OR test_name ILIKE '%Complete Blood Count%');

UPDATE test_fields SET section_group = 'WBC COUNT'
WHERE field_name = 'WBC Count'
  AND test_id IN (SELECT id FROM tests WHERE test_name ILIKE '%CBC%' OR test_name ILIKE '%Complete Blood Count%');

UPDATE test_fields SET section_group = 'PLATELET COUNT'
WHERE field_name = 'Platelet Count'
  AND test_id IN (SELECT id FROM tests WHERE test_name ILIKE '%CBC%' OR test_name ILIKE '%Complete Blood Count%');

-- ============================================================================
-- Seed section groups for Lipid Profile
-- ============================================================================
UPDATE test_fields SET section_group = 'CHOLESTEROL'
WHERE field_name IN ('Total Cholesterol', 'HDL Cholesterol', 'LDL Cholesterol', 'VLDL Cholesterol')
  AND test_id IN (SELECT id FROM tests WHERE test_name ILIKE '%Lipid%');

UPDATE test_fields SET section_group = 'TRIGLYCERIDES & RATIOS'
WHERE field_name IN ('Triglycerides', 'TC/HDL Ratio')
  AND test_id IN (SELECT id FROM tests WHERE test_name ILIKE '%Lipid%');

-- ============================================================================
-- Seed section groups for LFT
-- ============================================================================
UPDATE test_fields SET section_group = 'BILIRUBIN'
WHERE field_name IN ('Total Bilirubin', 'Direct Bilirubin', 'Indirect Bilirubin')
  AND test_id IN (SELECT id FROM tests WHERE test_name ILIKE '%Liver%' OR test_name ILIKE '%LFT%');

UPDATE test_fields SET section_group = 'ENZYMES'
WHERE field_name IN ('SGOT (AST)', 'SGPT (ALT)', 'Alkaline Phosphatase')
  AND test_id IN (SELECT id FROM tests WHERE test_name ILIKE '%Liver%' OR test_name ILIKE '%LFT%');

UPDATE test_fields SET section_group = 'PROTEINS'
WHERE field_name IN ('Total Protein', 'Albumin', 'Globulin', 'A/G Ratio')
  AND test_id IN (SELECT id FROM tests WHERE test_name ILIKE '%Liver%' OR test_name ILIKE '%LFT%');

-- ============================================================================
-- Seed section groups for KFT
-- ============================================================================
UPDATE test_fields SET section_group = 'UREA & CREATININE'
WHERE field_name IN ('Blood Urea', 'BUN', 'Serum Creatinine', 'Uric Acid')
  AND test_id IN (SELECT id FROM tests WHERE test_name ILIKE '%Kidney%' OR test_name ILIKE '%KFT%' OR test_name ILIKE '%Renal%');

UPDATE test_fields SET section_group = 'ELECTROLYTES'
WHERE field_name IN ('Sodium', 'Potassium', 'Chloride', 'Calcium')
  AND test_id IN (SELECT id FROM tests WHERE test_name ILIKE '%Kidney%' OR test_name ILIKE '%KFT%' OR test_name ILIKE '%Renal%');
