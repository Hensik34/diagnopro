-- ============================================
-- Seed default laboratory tests with parameters
-- Common tests that every diagnostic lab provides
-- ============================================

-- 1. Complete Blood Count (CBC) — already exists, upsert
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Complete Blood Count (CBC)', 'CBC-01', 'Hematology', 'Blood', 250, 4, 'Measures red cells, white cells, hemoglobin, hematocrit, and platelets')
ON CONFLICT (test_code) DO UPDATE SET test_name = EXCLUDED.test_name, category = EXCLUDED.category, description = EXCLUDED.description;

-- 2. Erythrocyte Sedimentation Rate
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'ESR (Erythrocyte Sedimentation Rate)', 'ESR-01', 'Hematology', 'Blood', 100, 2, 'Measures the rate at which red blood cells settle')
ON CONFLICT (test_code) DO NOTHING;

-- 3. Blood Group & Rh Typing
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Blood Group & Rh Typing', 'BG-01', 'Hematology', 'Blood', 150, 1, 'Determines ABO blood group and Rh factor')
ON CONFLICT (test_code) DO NOTHING;

-- 4. Peripheral Blood Smear
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Peripheral Blood Smear', 'PBS-01', 'Hematology', 'Blood', 200, 6, 'Microscopic examination of blood cells morphology')
ON CONFLICT (test_code) DO NOTHING;

-- 5. Lipid Profile
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Lipid Profile', 'LIPID-01', 'Biochemistry', 'Blood', 350, 6, 'Measures cholesterol, triglycerides, HDL, LDL, VLDL')
ON CONFLICT (test_code) DO NOTHING;

-- 6. Liver Function Test (LFT)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Liver Function Test (LFT)', 'LFT-01', 'Biochemistry', 'Blood', 400, 6, 'Evaluates liver health — bilirubin, AST, ALT, ALP, proteins')
ON CONFLICT (test_code) DO NOTHING;

-- 7. Kidney Function Test (KFT)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Kidney Function Test (KFT)', 'KFT-01', 'Biochemistry', 'Blood', 450, 6, 'Evaluates kidney health — urea, creatinine, uric acid, electrolytes')
ON CONFLICT (test_code) DO NOTHING;

-- 8. Blood Sugar Fasting
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Blood Sugar Fasting (FBS)', 'FBS-01', 'Biochemistry', 'Blood', 80, 2, 'Measures fasting blood glucose level')
ON CONFLICT (test_code) DO NOTHING;

-- 9. Blood Sugar PP (Post Prandial)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Blood Sugar PP (Post Prandial)', 'PPBS-01', 'Biochemistry', 'Blood', 80, 2, 'Measures blood glucose 2 hours after meal')
ON CONFLICT (test_code) DO NOTHING;

-- 10. Random Blood Sugar
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Random Blood Sugar (RBS)', 'RBS-01', 'Biochemistry', 'Blood', 80, 1, 'Measures blood glucose at any time of day')
ON CONFLICT (test_code) DO NOTHING;

-- 11. HbA1c
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'HbA1c (Glycated Hemoglobin)', 'HBA1C-01', 'Biochemistry', 'Blood', 350, 4, 'Average blood sugar control over past 2-3 months')
ON CONFLICT (test_code) DO NOTHING;

-- 12. Thyroid Profile (T3, T4, TSH)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Thyroid Profile (T3, T4, TSH)', 'THYROID-01', 'Hormone', 'Blood', 500, 6, 'Measures thyroid hormones T3, T4 and TSH')
ON CONFLICT (test_code) DO NOTHING;

-- 13. TSH only
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'TSH (Thyroid Stimulating Hormone)', 'TSH-01', 'Hormone', 'Blood', 200, 4, 'Screens for thyroid disorders')
ON CONFLICT (test_code) DO NOTHING;

-- 14. Urine Routine & Microscopy
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Urine Routine & Microscopy', 'URINE-01', 'Urinalysis', 'Urine', 150, 3, 'Physical, chemical and microscopic examination of urine')
ON CONFLICT (test_code) DO NOTHING;

-- 15. Stool Routine & Microscopy
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Stool Routine & Microscopy', 'STOOL-01', 'Microbiology', 'Stool', 150, 3, 'Microscopic examination of stool for ova, cysts, parasites')
ON CONFLICT (test_code) DO NOTHING;

-- 16. Widal Test
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Widal Test', 'WIDAL-01', 'Serology', 'Blood', 200, 4, 'Serological test for typhoid fever')
ON CONFLICT (test_code) DO NOTHING;

-- 17. VDRL
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'VDRL (Syphilis Screening)', 'VDRL-01', 'Serology', 'Blood', 200, 4, 'Screening test for syphilis')
ON CONFLICT (test_code) DO NOTHING;

-- 18. HIV I & II (ELISA)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'HIV I & II (ELISA)', 'HIV-01', 'Serology', 'Blood', 300, 6, 'Screening test for HIV antibodies')
ON CONFLICT (test_code) DO NOTHING;

-- 19. HBsAg (Hepatitis B)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'HBsAg (Hepatitis B Surface Antigen)', 'HBSAG-01', 'Serology', 'Blood', 250, 4, 'Screening test for Hepatitis B infection')
ON CONFLICT (test_code) DO NOTHING;

-- 20. HCV (Anti-HCV)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Anti-HCV (Hepatitis C)', 'HCV-01', 'Serology', 'Blood', 300, 6, 'Screening test for Hepatitis C infection')
ON CONFLICT (test_code) DO NOTHING;

-- 21. CRP (C-Reactive Protein)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'CRP (C-Reactive Protein)', 'CRP-01', 'Biochemistry', 'Blood', 250, 4, 'Marker of inflammation in the body')
ON CONFLICT (test_code) DO NOTHING;

-- 22. RA Factor
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'RA Factor (Rheumatoid Factor)', 'RAF-01', 'Immunology', 'Blood', 300, 4, 'Test for rheumatoid arthritis and autoimmune conditions')
ON CONFLICT (test_code) DO NOTHING;

-- 23. ASO Titre
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'ASO Titre (Anti-Streptolysin O)', 'ASO-01', 'Immunology', 'Blood', 250, 4, 'Detects streptococcal infection antibodies')
ON CONFLICT (test_code) DO NOTHING;

-- 24. Serum Electrolytes
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Serum Electrolytes (Na/K/Cl)', 'ELEC-01', 'Biochemistry', 'Blood', 300, 4, 'Measures sodium, potassium, chloride levels')
ON CONFLICT (test_code) DO NOTHING;

-- 25. Serum Calcium
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Serum Calcium', 'CALC-01', 'Biochemistry', 'Blood', 150, 4, 'Measures calcium level in blood')
ON CONFLICT (test_code) DO NOTHING;

-- 26. Serum Iron & TIBC
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Serum Iron & TIBC', 'IRON-01', 'Biochemistry', 'Blood', 350, 6, 'Evaluates iron status and iron binding capacity')
ON CONFLICT (test_code) DO NOTHING;

-- 27. Vitamin D (25-OH)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Vitamin D (25-Hydroxy)', 'VITD-01', 'Biochemistry', 'Blood', 600, 12, 'Measures vitamin D levels')
ON CONFLICT (test_code) DO NOTHING;

-- 28. Vitamin B12
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Vitamin B12', 'VITB12-01', 'Biochemistry', 'Blood', 500, 12, 'Measures vitamin B12 levels in blood')
ON CONFLICT (test_code) DO NOTHING;

-- 29. Uric Acid
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Serum Uric Acid', 'URIC-01', 'Biochemistry', 'Blood', 150, 4, 'Measures uric acid levels for gout screening')
ON CONFLICT (test_code) DO NOTHING;

-- 30. PT/INR (Prothrombin Time)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'PT/INR (Prothrombin Time)', 'PTINR-01', 'Hematology', 'Blood', 250, 4, 'Measures blood clotting time')
ON CONFLICT (test_code) DO NOTHING;

-- 31. Dengue NS1 Antigen
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Dengue NS1 Antigen', 'DENGNS1-01', 'Serology', 'Blood', 500, 4, 'Early detection of dengue infection')
ON CONFLICT (test_code) DO NOTHING;

-- 32. Dengue IgM/IgG
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Dengue IgM / IgG', 'DENGIGG-01', 'Serology', 'Blood', 500, 4, 'Detects dengue antibodies for current or past infection')
ON CONFLICT (test_code) DO NOTHING;

-- 33. Malaria Antigen (Rapid)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Malaria Antigen (Rapid Card)', 'MALAR-01', 'Microbiology', 'Blood', 250, 1, 'Rapid test for Plasmodium falciparum and vivax')
ON CONFLICT (test_code) DO NOTHING;

-- 34. Urine Culture & Sensitivity
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Urine Culture & Sensitivity', 'UCULT-01', 'Microbiology', 'Urine', 500, 48, 'Culture to identify urinary tract pathogens and antibiotic sensitivity')
ON CONFLICT (test_code) DO NOTHING;

-- 35. Blood Culture & Sensitivity
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Blood Culture & Sensitivity', 'BCULT-01', 'Microbiology', 'Blood', 700, 72, 'Culture to detect bloodstream infections')
ON CONFLICT (test_code) DO NOTHING;

-- 36. Semen Analysis
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Semen Analysis', 'SEMEN-01', 'Andrology', 'Semen', 400, 4, 'Evaluates sperm count, motility, morphology')
ON CONFLICT (test_code) DO NOTHING;

-- 37. Pregnancy Test (Urine)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Pregnancy Test (Urine)', 'UPT-01', 'Hormone', 'Urine', 100, 1, 'Detects hCG hormone in urine')
ON CONFLICT (test_code) DO NOTHING;

-- 38. Serum Amylase
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Serum Amylase', 'AMYL-01', 'Biochemistry', 'Blood', 250, 4, 'Evaluates pancreatic function')
ON CONFLICT (test_code) DO NOTHING;

-- 39. Serum Lipase
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Serum Lipase', 'LIPAS-01', 'Biochemistry', 'Blood', 300, 4, 'Diagnoses pancreatitis')
ON CONFLICT (test_code) DO NOTHING;

-- 40. Troponin I / T
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description)
VALUES (gen_random_uuid(), 'Troponin I (Cardiac Marker)', 'TROP-01', 'Biochemistry', 'Blood', 500, 2, 'Cardiac marker for myocardial infarction')
ON CONFLICT (test_code) DO NOTHING;


-- ============================================
-- Now seed test_fields (parameters) for each test
-- Only inserts if the test has no fields yet
-- ============================================

-- CBC Fields (re-run safe, skips if already seeded)
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.idx
FROM tests t
CROSS JOIN (VALUES
  ('Hemoglobin',      'g/dL',    12.0,  17.5,  0),
  ('RBC Count',       'mil/µL',  4.0,   5.5,   1),
  ('HCT (PCV)',       '%',       36.0,  50.0,  2),
  ('MCV',             'fL',      80.0,  100.0, 3),
  ('MCH',             'pg',      27.0,  31.0,  4),
  ('MCHC',            'g/dL',    32.0,  36.0,  5),
  ('RDW',             '%',       11.5,  14.5,  6),
  ('Platelet Count',  'thou/µL', 150.0, 450.0, 7),
  ('WBC Count',       'thou/µL', 4.0,   11.0,  8),
  ('Neutrophils',     '%',       40.0,  70.0,  9),
  ('Lymphocytes',     '%',       20.0,  40.0,  10),
  ('Monocytes',       '%',       2.0,   8.0,   11),
  ('Eosinophils',     '%',       1.0,   4.0,   12),
  ('Basophils',       '%',       0.0,   1.0,   13)
) AS f(field_name, unit, min_value, max_value, idx)
WHERE t.test_code = 'CBC-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- ESR Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.idx
FROM tests t
CROSS JOIN (VALUES
  ('ESR (1st hour)', 'mm/hr', 0.0, 20.0, 0)
) AS f(field_name, unit, min_value, max_value, idx)
WHERE t.test_code = 'ESR-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- Blood Group Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.idx
FROM tests t
CROSS JOIN (VALUES
  ('Blood Group', '', NULL::numeric, NULL::numeric, 'text', 0),
  ('Rh Factor',   '', NULL::numeric, NULL::numeric, 'text', 1)
) AS f(field_name, unit, min_value, max_value, input_type, idx)
WHERE t.test_code = 'BG-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- Peripheral Blood Smear Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.idx
FROM tests t
CROSS JOIN (VALUES
  ('RBC Morphology',       '', NULL::numeric, NULL::numeric, 'text', 0),
  ('WBC Morphology',       '', NULL::numeric, NULL::numeric, 'text', 1),
  ('Platelet Morphology',  '', NULL::numeric, NULL::numeric, 'text', 2),
  ('Parasites',            '', NULL::numeric, NULL::numeric, 'text', 3),
  ('Comments',             '', NULL::numeric, NULL::numeric, 'text', 4)
) AS f(field_name, unit, min_value, max_value, input_type, idx)
WHERE t.test_code = 'PBS-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- Lipid Profile Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.idx
FROM tests t
CROSS JOIN (VALUES
  ('Total Cholesterol', 'mg/dL', 0.0,   200.0, 0),
  ('HDL Cholesterol',   'mg/dL', 40.0,  60.0,  1),
  ('LDL Cholesterol',   'mg/dL', 0.0,   100.0, 2),
  ('VLDL Cholesterol',  'mg/dL', 5.0,   40.0,  3),
  ('Triglycerides',     'mg/dL', 0.0,   150.0, 4),
  ('TC/HDL Ratio',      '',      0.0,   5.0,   5),
  ('LDL/HDL Ratio',     '',      0.0,   3.5,   6)
) AS f(field_name, unit, min_value, max_value, idx)
WHERE t.test_code = 'LIPID-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- LFT Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.idx
FROM tests t
CROSS JOIN (VALUES
  ('Total Bilirubin',      'mg/dL', 0.1,  1.2,   0),
  ('Direct Bilirubin',     'mg/dL', 0.0,  0.3,   1),
  ('Indirect Bilirubin',   'mg/dL', 0.1,  0.9,   2),
  ('SGOT (AST)',           'U/L',   0.0,  40.0,  3),
  ('SGPT (ALT)',           'U/L',   0.0,  40.0,  4),
  ('Alkaline Phosphatase', 'U/L',   44.0, 147.0, 5),
  ('GGT',                  'U/L',   0.0,  55.0,  6),
  ('Total Protein',        'g/dL',  6.0,  8.3,   7),
  ('Albumin',              'g/dL',  3.5,  5.5,   8),
  ('Globulin',             'g/dL',  2.0,  3.5,   9),
  ('A/G Ratio',            '',      1.0,  2.5,   10)
) AS f(field_name, unit, min_value, max_value, idx)
WHERE t.test_code = 'LFT-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- KFT Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.idx
FROM tests t
CROSS JOIN (VALUES
  ('Blood Urea',       'mg/dL',  15.0,  40.0,  0),
  ('BUN',              'mg/dL',  7.0,   20.0,  1),
  ('Serum Creatinine', 'mg/dL',  0.6,   1.2,   2),
  ('Uric Acid',        'mg/dL',  3.5,   7.2,   3),
  ('Sodium',           'mEq/L',  136.0, 145.0, 4),
  ('Potassium',        'mEq/L',  3.5,   5.1,   5),
  ('Chloride',         'mEq/L',  98.0,  106.0, 6),
  ('Calcium',          'mg/dL',  8.5,   10.5,  7),
  ('Phosphorus',       'mg/dL',  2.5,   4.5,   8)
) AS f(field_name, unit, min_value, max_value, idx)
WHERE t.test_code = 'KFT-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- Blood Sugar Fasting
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, 'Fasting Blood Sugar', 'mg/dL', 70.0, 100.0, 'number', 0
FROM tests t WHERE t.test_code = 'FBS-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- Blood Sugar PP
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, 'Post Prandial Blood Sugar', 'mg/dL', 70.0, 140.0, 'number', 0
FROM tests t WHERE t.test_code = 'PPBS-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- Random Blood Sugar
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, 'Random Blood Sugar', 'mg/dL', 70.0, 140.0, 'number', 0
FROM tests t WHERE t.test_code = 'RBS-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- HbA1c Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.idx
FROM tests t
CROSS JOIN (VALUES
  ('HbA1c',                '%',     4.0,  5.6,   0),
  ('Estimated Avg Glucose', 'mg/dL', 68.0, 114.0, 1)
) AS f(field_name, unit, min_value, max_value, idx)
WHERE t.test_code = 'HBA1C-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- Thyroid Profile Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.idx
FROM tests t
CROSS JOIN (VALUES
  ('T3 (Triiodothyronine)', 'ng/dL',  80.0, 200.0, 0),
  ('T4 (Thyroxine)',        'µg/dL',  4.5,  12.5,  1),
  ('TSH',                   'µIU/mL', 0.4,  4.0,   2),
  ('FT3',                   'pg/mL',  2.0,  4.4,   3),
  ('FT4',                   'ng/dL',  0.8,  1.8,   4)
) AS f(field_name, unit, min_value, max_value, idx)
WHERE t.test_code = 'THYROID-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- TSH only
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, 'TSH', 'µIU/mL', 0.4, 4.0, 'number', 0
FROM tests t WHERE t.test_code = 'TSH-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- Urine Routine Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.idx
FROM tests t
CROSS JOIN (VALUES
  ('Color',            '',     NULL::numeric, NULL::numeric, 'text',   0),
  ('Appearance',       '',     NULL::numeric, NULL::numeric, 'text',   1),
  ('pH',               '',     4.5,   8.0,   'number', 2),
  ('Specific Gravity', '',     1.005, 1.030, 'number', 3),
  ('Protein',          '',     NULL::numeric, NULL::numeric, 'text',   4),
  ('Glucose',          '',     NULL::numeric, NULL::numeric, 'text',   5),
  ('Ketones',          '',     NULL::numeric, NULL::numeric, 'text',   6),
  ('Bilirubin',        '',     NULL::numeric, NULL::numeric, 'text',   7),
  ('Urobilinogen',     '',     NULL::numeric, NULL::numeric, 'text',   8),
  ('Blood',            '',     NULL::numeric, NULL::numeric, 'text',   9),
  ('Nitrite',          '',     NULL::numeric, NULL::numeric, 'text',   10),
  ('RBC',              '/hpf', 0.0,   2.0,   'number', 11),
  ('Pus Cells (WBC)',  '/hpf', 0.0,   5.0,   'number', 12),
  ('Epithelial Cells', '/hpf', 0.0,   5.0,   'number', 13),
  ('Casts',            '/lpf', NULL::numeric, NULL::numeric, 'text',   14),
  ('Crystals',         '',     NULL::numeric, NULL::numeric, 'text',   15),
  ('Bacteria',         '',     NULL::numeric, NULL::numeric, 'text',   16)
) AS f(field_name, unit, min_value, max_value, input_type, idx)
WHERE t.test_code = 'URINE-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- Stool Routine Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.idx
FROM tests t
CROSS JOIN (VALUES
  ('Color',            '', NULL::numeric, NULL::numeric, 'text', 0),
  ('Consistency',      '', NULL::numeric, NULL::numeric, 'text', 1),
  ('Mucus',            '', NULL::numeric, NULL::numeric, 'text', 2),
  ('Occult Blood',     '', NULL::numeric, NULL::numeric, 'text', 3),
  ('Ova / Parasites',  '', NULL::numeric, NULL::numeric, 'text', 4),
  ('Cysts',            '', NULL::numeric, NULL::numeric, 'text', 5),
  ('RBC',              '/hpf', 0.0, 2.0, 'number', 6),
  ('Pus Cells',        '/hpf', 0.0, 5.0, 'number', 7),
  ('Fat Globules',     '', NULL::numeric, NULL::numeric, 'text', 8)
) AS f(field_name, unit, min_value, max_value, input_type, idx)
WHERE t.test_code = 'STOOL-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- Widal Test Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.idx
FROM tests t
CROSS JOIN (VALUES
  ('S. Typhi O',     'Titre', NULL::numeric, NULL::numeric, 'text', 0),
  ('S. Typhi H',     'Titre', NULL::numeric, NULL::numeric, 'text', 1),
  ('S. Paratyphi AH','Titre', NULL::numeric, NULL::numeric, 'text', 2),
  ('S. Paratyphi BH','Titre', NULL::numeric, NULL::numeric, 'text', 3)
) AS f(field_name, unit, min_value, max_value, input_type, idx)
WHERE t.test_code = 'WIDAL-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- VDRL
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, 'VDRL Result', '', NULL, NULL, 'text', 0
FROM tests t WHERE t.test_code = 'VDRL-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- HIV
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.idx
FROM tests t
CROSS JOIN (VALUES
  ('HIV I',  '', NULL::numeric, NULL::numeric, 'text', 0),
  ('HIV II', '', NULL::numeric, NULL::numeric, 'text', 1)
) AS f(field_name, unit, min_value, max_value, input_type, idx)
WHERE t.test_code = 'HIV-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- HBsAg
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, 'HBsAg Result', '', NULL, NULL, 'text', 0
FROM tests t WHERE t.test_code = 'HBSAG-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- HCV
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, 'Anti-HCV Result', '', NULL, NULL, 'text', 0
FROM tests t WHERE t.test_code = 'HCV-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- CRP
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, 'CRP', 'mg/L', 0.0, 6.0, 'number', 0
FROM tests t WHERE t.test_code = 'CRP-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- RA Factor
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, 'RA Factor', 'IU/mL', 0.0, 14.0, 'number', 0
FROM tests t WHERE t.test_code = 'RAF-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- ASO Titre
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, 'ASO Titre', 'IU/mL', 0.0, 200.0, 'number', 0
FROM tests t WHERE t.test_code = 'ASO-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- Serum Electrolytes
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.idx
FROM tests t
CROSS JOIN (VALUES
  ('Sodium',    'mEq/L', 136.0, 145.0, 0),
  ('Potassium', 'mEq/L', 3.5,   5.1,   1),
  ('Chloride',  'mEq/L', 98.0,  106.0, 2),
  ('Bicarbonate','mEq/L', 22.0, 29.0,  3)
) AS f(field_name, unit, min_value, max_value, idx)
WHERE t.test_code = 'ELEC-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- Serum Calcium
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, 'Serum Calcium', 'mg/dL', 8.5, 10.5, 'number', 0
FROM tests t WHERE t.test_code = 'CALC-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- Serum Iron & TIBC
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.idx
FROM tests t
CROSS JOIN (VALUES
  ('Serum Iron',     'µg/dL',  60.0,  170.0, 0),
  ('TIBC',           'µg/dL',  250.0, 370.0, 1),
  ('Transferrin Saturation', '%', 20.0, 50.0, 2),
  ('Ferritin',       'ng/mL',  12.0,  300.0, 3)
) AS f(field_name, unit, min_value, max_value, idx)
WHERE t.test_code = 'IRON-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- Vitamin D
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, 'Vitamin D (25-OH)', 'ng/mL', 30.0, 100.0, 'number', 0
FROM tests t WHERE t.test_code = 'VITD-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- Vitamin B12
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, 'Vitamin B12', 'pg/mL', 200.0, 900.0, 'number', 0
FROM tests t WHERE t.test_code = 'VITB12-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- Uric Acid
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, 'Serum Uric Acid', 'mg/dL', 3.5, 7.2, 'number', 0
FROM tests t WHERE t.test_code = 'URIC-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- PT/INR
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.idx
FROM tests t
CROSS JOIN (VALUES
  ('Prothrombin Time', 'seconds', 11.0, 13.5, 0),
  ('INR',              '',        0.8,  1.1,   1),
  ('Control PT',       'seconds', 11.0, 13.5,  2)
) AS f(field_name, unit, min_value, max_value, idx)
WHERE t.test_code = 'PTINR-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- Dengue NS1
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, 'Dengue NS1 Antigen', '', NULL, NULL, 'text', 0
FROM tests t WHERE t.test_code = 'DENGNS1-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- Dengue IgM/IgG
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.idx
FROM tests t
CROSS JOIN (VALUES
  ('Dengue IgM', '', NULL::numeric, NULL::numeric, 'text', 0),
  ('Dengue IgG', '', NULL::numeric, NULL::numeric, 'text', 1)
) AS f(field_name, unit, min_value, max_value, input_type, idx)
WHERE t.test_code = 'DENGIGG-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- Malaria Antigen
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.idx
FROM tests t
CROSS JOIN (VALUES
  ('P. Falciparum', '', NULL::numeric, NULL::numeric, 'text', 0),
  ('P. Vivax',      '', NULL::numeric, NULL::numeric, 'text', 1)
) AS f(field_name, unit, min_value, max_value, input_type, idx)
WHERE t.test_code = 'MALAR-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- Semen Analysis
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.idx
FROM tests t
CROSS JOIN (VALUES
  ('Volume',               'mL',      1.5,  5.0,   'number', 0),
  ('Color',                '',        NULL::numeric, NULL::numeric, 'text',   1),
  ('Liquefaction Time',    'min',     0.0,  30.0,  'number', 2),
  ('pH',                   '',        7.2,  8.0,   'number', 3),
  ('Sperm Count',          'mil/mL',  15.0, 200.0, 'number', 4),
  ('Total Motility',       '%',       40.0, 100.0, 'number', 5),
  ('Progressive Motility', '%',       32.0, 100.0, 'number', 6),
  ('Normal Morphology',    '%',       4.0,  100.0, 'number', 7),
  ('Pus Cells',            '/hpf',    0.0,  5.0,   'number', 8),
  ('RBC',                  '/hpf',    NULL::numeric, NULL::numeric, 'text',   9)
) AS f(field_name, unit, min_value, max_value, input_type, idx)
WHERE t.test_code = 'SEMEN-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- Pregnancy Test
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, 'UPT Result', '', NULL, NULL, 'text', 0
FROM tests t WHERE t.test_code = 'UPT-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- Serum Amylase
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, 'Serum Amylase', 'U/L', 28.0, 100.0, 'number', 0
FROM tests t WHERE t.test_code = 'AMYL-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- Serum Lipase
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, 'Serum Lipase', 'U/L', 0.0, 60.0, 'number', 0
FROM tests t WHERE t.test_code = 'LIPAS-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- Troponin I
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, 'Troponin I', 'ng/mL', 0.0, 0.04, 'number', 0
FROM tests t WHERE t.test_code = 'TROP-01'
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);

-- Culture & Sensitivity tests (text-based results)
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.idx
FROM tests t
CROSS JOIN (VALUES
  ('Organism Isolated', '', NULL::numeric, NULL::numeric, 'text', 0),
  ('Colony Count',      'CFU/mL', NULL::numeric, NULL::numeric, 'text', 1),
  ('Sensitive To',      '', NULL::numeric, NULL::numeric, 'text', 2),
  ('Resistant To',      '', NULL::numeric, NULL::numeric, 'text', 3),
  ('Intermediate',      '', NULL::numeric, NULL::numeric, 'text', 4)
) AS f(field_name, unit, min_value, max_value, input_type, idx)
WHERE t.test_code IN ('UCULT-01', 'BCULT-01')
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id LIMIT 1);
