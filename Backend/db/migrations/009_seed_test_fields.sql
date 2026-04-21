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
