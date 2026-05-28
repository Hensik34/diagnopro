-- ============================================
-- Patch seed migration: fill missing test parameters
-- Ensures every seeded test has at least one valid parameter set
-- ============================================

-- Serology / qualitative tests
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value::numeric, f.max_value::numeric, f.input_type, f.order_index
FROM tests t
CROSS JOIN (VALUES
  ('Result', '', NULL, NULL, 'text', 0),
  ('Interpretation', '', NULL, NULL, 'text', 1)
) AS f(field_name, unit, min_value, max_value, input_type, order_index)
WHERE t.test_code IN ('WIDAL-01', 'VDRL-01', 'HIV-01', 'HBSAG-01', 'HCV-01', 'DENGNS1-01', 'DENGIGG-01', 'MALAR-01', 'UPT-01')
  AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

-- Widal titer details
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value::numeric, f.max_value::numeric, f.input_type, f.order_index
FROM tests t
CROSS JOIN (VALUES
  ('O Titer', '', NULL, NULL, 'text', 0),
  ('H Titer', '', NULL, NULL, 'text', 1),
  ('Interpretation', '', NULL, NULL, 'text', 2)
) AS f(field_name, unit, min_value, max_value, input_type, order_index)
WHERE t.test_code = 'WIDAL-01'
  AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

-- Quantitative inflammation / autoimmune markers
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value::numeric, f.max_value::numeric, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
  ('CRP', 'mg/L', 0.0, 100.0, 0)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE t.test_code = 'CRP-01'
  AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value::numeric, f.max_value::numeric, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
  ('Rheumatoid Factor', 'IU/mL', 0.0, 200.0, 0)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE t.test_code = 'RAF-01'
  AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value::numeric, f.max_value::numeric, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
  ('ASO Titer', 'IU/mL', 0.0, 1000.0, 0)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE t.test_code = 'ASO-01'
  AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

-- Electrolytes and mineral tests
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value::numeric, f.max_value::numeric, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
  ('Sodium', 'mEq/L', 135.0, 145.0, 0),
  ('Potassium', 'mEq/L', 3.5, 5.1, 1),
  ('Chloride', 'mEq/L', 98.0, 106.0, 2)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE t.test_code = 'ELEC-01'
  AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value::numeric, f.max_value::numeric, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
  ('Serum Calcium', 'mg/dL', 8.5, 10.5, 0)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE t.test_code = 'CALC-01'
  AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
  ('Serum Iron', 'ug/dL', 50.0, 170.0, 0),
  ('TIBC', 'ug/dL', 250.0, 450.0, 1),
  ('UIBC', 'ug/dL', 150.0, 375.0, 2)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE t.test_code = 'IRON-01'
  AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
  ('Vitamin D', 'ng/mL', 0.0, 100.0, 0)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE t.test_code = 'VITD-01'
  AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
  ('Vitamin B12', 'pg/mL', 100.0, 900.0, 0)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE t.test_code = 'VITB12-01'
  AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
  ('Serum Uric Acid', 'mg/dL', 3.5, 7.2, 0)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE t.test_code = 'URIC-01'
  AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

-- Coagulation / cardiac markers
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
  ('PT', 'seconds', 9.0, 13.5, 0),
  ('INR', '', 0.8, 1.2, 1)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE t.test_code = 'PTINR-01'
  AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index
FROM tests t
CROSS JOIN (VALUES
  ('Troponin I', 'ng/mL', 0.0, 0.04, 0)
) AS f(field_name, unit, min_value, max_value, order_index)
WHERE t.test_code = 'TROP-01'
  AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

-- Infectious disease / culture / rapid tests
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value::numeric, f.max_value::numeric, f.input_type, f.order_index
FROM tests t
CROSS JOIN (VALUES
  ('Result', '', NULL, NULL, 'text', 0),
  ('Remarks', '', NULL, NULL, 'text', 1)
) AS f(field_name, unit, min_value, max_value, input_type, order_index)
WHERE t.test_code IN ('UCULT-01', 'BCULT-01', 'MALAR-01')
  AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

-- Semen analysis
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value::numeric, f.max_value::numeric, f.input_type, f.order_index
FROM tests t
CROSS JOIN (VALUES
  ('Volume', 'mL', 1.5, 6.0, 'number', 0),
  ('Sperm Count', 'million/mL', 15.0, 300.0, 'number', 1),
  ('Motility', '%', 40.0, 100.0, 'number', 2),
  ('Morphology', '%', 4.0, 100.0, 'number', 3),
  ('Liquefaction Time', 'minutes', 15.0, 60.0, 'number', 4)
) AS f(field_name, unit, min_value, max_value, input_type, order_index)
WHERE t.test_code = 'SEMEN-01'
  AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

-- Urine routine / stool routine
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value::numeric, f.max_value::numeric, f.input_type, f.order_index
FROM tests t
CROSS JOIN (VALUES
  ('Color', '', NULL, NULL, 'text', 0),
  ('Appearance', '', NULL, NULL, 'text', 1),
  ('pH', '', 4.5, 8.0, 'number', 2),
  ('Specific Gravity', '', 1.005, 1.030, 'number', 3),
  ('Sediment', '', NULL, NULL, 'text', 4)
) AS f(field_name, unit, min_value, max_value, input_type, order_index)
WHERE t.test_code = 'STOOL-01'
  AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);

-- Generic fallback for any remaining tests without parameters
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
SELECT
  gen_random_uuid(),
  t.id,
  'Result',
  CASE
    WHEN t.sample_type ILIKE 'blood' THEN ''
    WHEN t.sample_type ILIKE 'urine' THEN ''
    ELSE ''
  END,
  NULL::numeric,
  NULL::numeric,
  'text',
  0
FROM tests t
WHERE NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id);