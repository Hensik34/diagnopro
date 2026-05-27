-- ============================================
-- Final seed migration: tests + test fields + formulas
-- ============================================
-- ============================================
-- Migration 030: Seed ALL 40 Default Laboratory Tests
-- Comprehensive test list for lab management system
-- ============================================

-- CBC - Complete Blood Count
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Complete Blood Count (CBC)', 'CBC-01', 'Hematology', 'Blood', 250, 4, 'Measures red cells, white cells, hemoglobin, hematocrit, and platelets', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- ESR - Erythrocyte Sedimentation Rate
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'ESR (Erythrocyte Sedimentation Rate)', 'ESR-01', 'Hematology', 'Blood', 100, 2, 'Measures the rate at which red blood cells settle', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- Blood Group & Rh Typing
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Blood Group & Rh Typing', 'BG-01', 'Hematology', 'Blood', 150, 1, 'Determines ABO blood group and Rh factor', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- Peripheral Blood Smear
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Peripheral Blood Smear', 'PBS-01', 'Hematology', 'Blood', 200, 6, 'Microscopic examination of blood cells morphology', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- Lipid Profile
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Lipid Profile', 'LIPID-01', 'Biochemistry', 'Blood', 350, 6, 'Measures cholesterol, triglycerides, HDL, LDL, VLDL', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- Liver Function Test (LFT)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Liver Function Test (LFT)', 'LFT-01', 'Biochemistry', 'Blood', 400, 6, 'Evaluates liver health — bilirubin, AST, ALT, ALP, proteins', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- Kidney Function Test (KFT)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Kidney Function Test (KFT)', 'KFT-01', 'Biochemistry', 'Blood', 450, 6, 'Evaluates kidney health — urea, creatinine, uric acid, electrolytes', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- Blood Sugar Fasting
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Blood Sugar Fasting (FBS)', 'FBS-01', 'Biochemistry', 'Blood', 80, 2, 'Measures fasting blood glucose level', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- Blood Sugar PP (Post Prandial)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Blood Sugar PP (Post Prandial)', 'PPBS-01', 'Biochemistry', 'Blood', 80, 2, 'Measures blood glucose 2 hours after meal', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- Random Blood Sugar
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Random Blood Sugar (RBS)', 'RBS-01', 'Biochemistry', 'Blood', 80, 1, 'Measures blood glucose at any time of day', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- HbA1c
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'HbA1c (Glycated Hemoglobin)', 'HBA1C-01', 'Biochemistry', 'Blood', 350, 4, 'Average blood sugar control over past 2-3 months', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- Thyroid Profile (T3, T4, TSH)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Thyroid Profile (T3, T4, TSH)', 'THYROID-01', 'Hormone', 'Blood', 500, 6, 'Measures thyroid hormones T3, T4 and TSH', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- TSH only
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'TSH (Thyroid Stimulating Hormone)', 'TSH-01', 'Hormone', 'Blood', 200, 4, 'Screens for thyroid disorders', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- Urine Routine & Microscopy
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Urine Routine & Microscopy', 'URINE-01', 'Urinalysis', 'Urine', 150, 3, 'Physical, chemical and microscopic examination of urine', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- Stool Routine & Microscopy
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Stool Routine & Microscopy', 'STOOL-01', 'Microbiology', 'Stool', 150, 3, 'Microscopic examination of stool for ova, cysts, parasites', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- Widal Test
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Widal Test', 'WIDAL-01', 'Serology', 'Blood', 200, 4, 'Serological test for typhoid fever', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- VDRL
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'VDRL (Syphilis Screening)', 'VDRL-01', 'Serology', 'Blood', 200, 4, 'Screening test for syphilis', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- HIV I & II (ELISA)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'HIV I & II (ELISA)', 'HIV-01', 'Serology', 'Blood', 300, 6, 'Screening test for HIV antibodies', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- HBsAg (Hepatitis B)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'HBsAg (Hepatitis B Surface Antigen)', 'HBSAG-01', 'Serology', 'Blood', 250, 4, 'Screening test for Hepatitis B infection', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- HCV (Anti-HCV)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Anti-HCV (Hepatitis C)', 'HCV-01', 'Serology', 'Blood', 300, 6, 'Screening test for Hepatitis C infection', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- CRP (C-Reactive Protein)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'CRP (C-Reactive Protein)', 'CRP-01', 'Biochemistry', 'Blood', 250, 4, 'Marker of inflammation in the body', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- RA Factor
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'RA Factor (Rheumatoid Factor)', 'RAF-01', 'Immunology', 'Blood', 300, 4, 'Test for rheumatoid arthritis and autoimmune conditions', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- ASO Titre
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'ASO Titre (Anti-Streptolysin O)', 'ASO-01', 'Immunology', 'Blood', 250, 4, 'Detects streptococcal infection antibodies', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- Serum Electrolytes
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Serum Electrolytes (Na/K/Cl)', 'ELEC-01', 'Biochemistry', 'Blood', 300, 4, 'Measures sodium, potassium, chloride levels', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- Serum Calcium
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Serum Calcium', 'CALC-01', 'Biochemistry', 'Blood', 150, 4, 'Measures calcium level in blood', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- Serum Iron & TIBC
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Serum Iron & TIBC', 'IRON-01', 'Biochemistry', 'Blood', 350, 6, 'Evaluates iron status and iron binding capacity', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- Vitamin D (25-OH)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Vitamin D (25-Hydroxy)', 'VITD-01', 'Biochemistry', 'Blood', 600, 12, 'Measures vitamin D levels', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- Vitamin B12
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Vitamin B12', 'VITB12-01', 'Biochemistry', 'Blood', 500, 12, 'Measures vitamin B12 levels in blood', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- Uric Acid
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Serum Uric Acid', 'URIC-01', 'Biochemistry', 'Blood', 150, 4, 'Measures uric acid levels for gout screening', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- PT/INR (Prothrombin Time)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'PT/INR (Prothrombin Time)', 'PTINR-01', 'Hematology', 'Blood', 250, 4, 'Measures blood clotting time', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- Dengue NS1 Antigen
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Dengue NS1 Antigen', 'DENGNS1-01', 'Serology', 'Blood', 500, 4, 'Early detection of dengue infection', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- Dengue IgM/IgG
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Dengue IgM / IgG', 'DENGIGG-01', 'Serology', 'Blood', 500, 4, 'Detects dengue antibodies for current or past infection', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- Malaria Antigen (Rapid)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Malaria Antigen (Rapid Card)', 'MALAR-01', 'Microbiology', 'Blood', 250, 1, 'Rapid test for Plasmodium falciparum and vivax', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- Urine Culture & Sensitivity
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Urine Culture & Sensitivity', 'UCULT-01', 'Microbiology', 'Urine', 500, 48, 'Culture to identify urinary tract pathogens and antibiotic sensitivity', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- Blood Culture & Sensitivity
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Blood Culture & Sensitivity', 'BCULT-01', 'Microbiology', 'Blood', 700, 72, 'Culture to detect bloodstream infections', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- Semen Analysis
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Semen Analysis', 'SEMEN-01', 'Andrology', 'Semen', 400, 4, 'Evaluates sperm count, motility, morphology', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- Pregnancy Test (Urine)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Pregnancy Test (Urine)', 'UPT-01', 'Hormone', 'Urine', 100, 1, 'Detects hCG hormone in urine', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- Serum Amylase
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Serum Amylase', 'AMYL-01', 'Biochemistry', 'Blood', 250, 4, 'Evaluates pancreatic function', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- Serum Lipase
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Serum Lipase', 'LIPAS-01', 'Biochemistry', 'Blood', 300, 4, 'Diagnoses pancreatitis', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- Troponin I (Cardiac Marker)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Troponin I (Cardiac Marker)', 'TROP-01', 'Biochemistry', 'Blood', 500, 2, 'Cardiac marker for myocardial infarction', NOW(), NOW()
ON CONFLICT (test_code) DO NOTHING;

-- ---- test_fields seed ----

-- Seed test fields for common clinical lab tests
-- This migration populates test_fields for any existing tests

-- Helper: Insert fields for a test identified by test_code
-- CBC Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
  ('Hemoglobin',      'g/dL',    12.0,  15.5,  0),
  ('RBC Count',       'mil/µL',  3.5,   5.5,   1),
  ('HCT',             '%',       37.0,  47.0,  2),
  ('MCV',             'fL',      80.0,  100.0, 3),
  ('MCH',             'pg',      27.0,  31.0,  4),
  ('MCHC',            'g/dL',    32.0,  36.0,  5),
  ('RDW',             '%',       11.5,  14.5,  6),
  ('Platelet Count',  'thou/µL', 150.0, 450.0, 7),
  ('WBC Count',       'thou/µL', 4.5,   11.0,  8)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE t.test_name ILIKE '%Complete Blood Count%' OR t.test_name ILIKE '%CBC%'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

-- Lipid Profile Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
  ('Total Cholesterol',  'mg/dL', 0.0,   200.0, 0),
  ('HDL Cholesterol',    'mg/dL', 40.0,  60.0,  1),
  ('LDL Cholesterol',    'mg/dL', 0.0,   100.0, 2),
  ('VLDL Cholesterol',   'mg/dL', 5.0,   40.0,  3),
  ('Triglycerides',      'mg/dL', 0.0,   150.0, 4),
  ('TC/HDL Ratio',       '',      0.0,   5.0,   5)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE t.test_name ILIKE '%Lipid%'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

-- Thyroid Profile Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
  ('TSH',   'µIU/mL', 0.4,  4.0,  0),
  ('T3',    'ng/dL',   80.0, 200.0, 1),
  ('T4',    'µg/dL',   4.5,  12.5,  2),
  ('FT3',   'pg/mL',   2.0,  4.4,   3),
  ('FT4',   'ng/dL',   0.8,  1.8,   4)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE t.test_name ILIKE '%Thyroid%'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

-- Liver Function Test (LFT) Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
  ('Total Bilirubin',    'mg/dL', 0.1,  1.2,   0),
  ('Direct Bilirubin',   'mg/dL', 0.0,  0.3,   1),
  ('Indirect Bilirubin', 'mg/dL', 0.1,  0.9,   2),
  ('SGOT (AST)',         'U/L',   0.0,  40.0,  3),
  ('SGPT (ALT)',         'U/L',   0.0,  40.0,  4),
  ('Alkaline Phosphatase', 'U/L', 44.0, 147.0, 5),
  ('Total Protein',      'g/dL',  6.0,  8.3,   6),
  ('Albumin',            'g/dL',  3.5,  5.5,   7),
  ('Globulin',           'g/dL',  2.0,  3.5,   8),
  ('A/G Ratio',          '',      1.0,  2.5,   9)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE (t.test_name ILIKE '%Liver%' OR t.test_name ILIKE '%LFT%')
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

-- Kidney Function Test (KFT/RFT) Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
  ('Blood Urea',       'mg/dL',  15.0, 40.0,  0),
  ('BUN',              'mg/dL',  7.0,  20.0,  1),
  ('Serum Creatinine', 'mg/dL',  0.6,  1.2,   2),
  ('Uric Acid',        'mg/dL',  3.5,  7.2,   3),
  ('Sodium',           'mEq/L',  136.0, 145.0, 4),
  ('Potassium',        'mEq/L',  3.5,  5.1,   5),
  ('Chloride',         'mEq/L',  98.0, 106.0, 6),
  ('Calcium',          'mg/dL',  8.5,  10.5,  7)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE (t.test_name ILIKE '%Kidney%' OR t.test_name ILIKE '%KFT%' OR t.test_name ILIKE '%Renal%' OR t.test_name ILIKE '%RFT%')
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

-- HbA1c Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
  ('HbA1c',             '%',     4.0,  5.6,   0),
  ('Estimated Avg Glucose', 'mg/dL', 68.0, 114.0, 1),
  ('Fasting Blood Sugar', 'mg/dL', 70.0, 100.0, 2)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE (t.test_name ILIKE '%HbA1c%' OR t.test_name ILIKE '%Glycated%' OR t.test_name ILIKE '%Diabetes%')
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

-- Urine Routine Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index
FROM tests t
CROSS JOIN (VALUES
  ('Color',        '',     NULL, NULL, 'text',   0),
  ('Appearance',   '',     NULL, NULL, 'text',   1),
  ('pH',           '',     4.5,  8.0,  'number', 2),
  ('Specific Gravity', '', 1.005, 1.030, 'number', 3),
  ('Protein',      '',     NULL, NULL, 'text',   4),
  ('Glucose',      '',     NULL, NULL, 'text',   5),
  ('RBC',          '/hpf', 0.0,  2.0,  'number', 6),
  ('WBC',          '/hpf', 0.0,  5.0,  'number', 7),
  ('Epithelial Cells', '/hpf', 0.0, 5.0, 'number', 8),
  ('Casts',        '/lpf', NULL, NULL, 'text',   9)
) AS f(field_name, unit, min_value, max_value, input_type, order_index)
WHERE (t.test_name ILIKE '%Urine%Routine%' OR t.test_name ILIKE '%Urinalysis%')
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

-- ---- calculated formulas ----

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



