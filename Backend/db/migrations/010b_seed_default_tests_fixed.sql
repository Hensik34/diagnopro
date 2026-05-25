-- ============================================
-- Seed default laboratory tests with parameters
-- Common tests that every diagnostic lab provides
-- ============================================

-- Tests are inserted with DO NOTHING if they already exist by test_code
-- No branch_id specified - these are global test templates

-- 1. Complete Blood Count (CBC)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Complete Blood Count (CBC)', 'CBC-01', 'Hematology', 'Blood', 250, 4, 'Measures red cells, white cells, hemoglobin, hematocrit, and platelets', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 2. Erythrocyte Sedimentation Rate
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'ESR (Erythrocyte Sedimentation Rate)', 'ESR-01', 'Hematology', 'Blood', 100, 2, 'Measures the rate at which red blood cells settle', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 3. Blood Group & Rh Typing
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Blood Group & Rh Typing', 'BG-01', 'Hematology', 'Blood', 150, 1, 'Determines ABO blood group and Rh factor', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 4. Peripheral Blood Smear
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Peripheral Blood Smear', 'PBS-01', 'Hematology', 'Blood', 200, 6, 'Microscopic examination of blood cells morphology', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 5. Lipid Profile
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Lipid Profile', 'LIPID-01', 'Biochemistry', 'Blood', 350, 6, 'Measures cholesterol, triglycerides, HDL, LDL, VLDL', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 6. Liver Function Test (LFT)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Liver Function Test (LFT)', 'LFT-01', 'Biochemistry', 'Blood', 400, 6, 'Evaluates liver health — bilirubin, AST, ALT, ALP, proteins', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 7. Kidney Function Test (KFT)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Kidney Function Test (KFT)', 'KFT-01', 'Biochemistry', 'Blood', 450, 6, 'Evaluates kidney health — urea, creatinine, uric acid, electrolytes', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 8. Blood Sugar Fasting
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Blood Sugar Fasting (FBS)', 'FBS-01', 'Biochemistry', 'Blood', 80, 2, 'Measures fasting blood glucose level', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 9. Blood Sugar PP (Post Prandial)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Blood Sugar PP (Post Prandial)', 'PPBS-01', 'Biochemistry', 'Blood', 80, 2, 'Measures blood glucose 2 hours after meal', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 10. Random Blood Sugar
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Random Blood Sugar (RBS)', 'RBS-01', 'Biochemistry', 'Blood', 80, 1, 'Measures blood glucose at any time of day', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 11. HbA1c
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'HbA1c (Glycated Hemoglobin)', 'HBA1C-01', 'Biochemistry', 'Blood', 350, 4, 'Average blood sugar control over past 2-3 months', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 12. Thyroid Profile (T3, T4, TSH)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Thyroid Profile (T3, T4, TSH)', 'THYROID-01', 'Hormone', 'Blood', 500, 6, 'Measures thyroid hormones T3, T4 and TSH', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 13. TSH only
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'TSH (Thyroid Stimulating Hormone)', 'TSH-01', 'Hormone', 'Blood', 200, 4, 'Screens for thyroid disorders', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 14. Urine Routine & Microscopy
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Urine Routine & Microscopy', 'URINE-01', 'Urinalysis', 'Urine', 150, 3, 'Physical, chemical and microscopic examination of urine', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 15. Stool Routine & Microscopy
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Stool Routine & Microscopy', 'STOOL-01', 'Microbiology', 'Stool', 150, 3, 'Microscopic examination of stool for ova, cysts, parasites', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 16. Widal Test
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Widal Test', 'WIDAL-01', 'Serology', 'Blood', 200, 4, 'Serological test for typhoid fever', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 17. VDRL
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'VDRL (Syphilis Screening)', 'VDRL-01', 'Serology', 'Blood', 200, 4, 'Screening test for syphilis', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 18. HIV I & II (ELISA)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'HIV I & II (ELISA)', 'HIV-01', 'Serology', 'Blood', 300, 6, 'Screening test for HIV antibodies', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 19. HBsAg (Hepatitis B)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'HBsAg (Hepatitis B Surface Antigen)', 'HBSAG-01', 'Serology', 'Blood', 250, 4, 'Screening test for Hepatitis B infection', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 20. HCV (Anti-HCV)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Anti-HCV (Hepatitis C)', 'HCV-01', 'Serology', 'Blood', 300, 6, 'Screening test for Hepatitis C infection', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 21. CRP (C-Reactive Protein)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'CRP (C-Reactive Protein)', 'CRP-01', 'Biochemistry', 'Blood', 250, 4, 'Marker of inflammation in the body', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 22. RA Factor
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'RA Factor (Rheumatoid Factor)', 'RAF-01', 'Immunology', 'Blood', 300, 4, 'Test for rheumatoid arthritis and autoimmune conditions', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 23. ASO Titre
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'ASO Titre (Anti-Streptolysin O)', 'ASO-01', 'Immunology', 'Blood', 250, 4, 'Detects streptococcal infection antibodies', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 24. Serum Electrolytes
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Serum Electrolytes (Na/K/Cl)', 'ELEC-01', 'Biochemistry', 'Blood', 300, 4, 'Measures sodium, potassium, chloride levels', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 25. Serum Calcium
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Serum Calcium', 'CALC-01', 'Biochemistry', 'Blood', 150, 4, 'Measures calcium level in blood', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 26. Serum Iron & TIBC
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Serum Iron & TIBC', 'IRON-01', 'Biochemistry', 'Blood', 350, 6, 'Evaluates iron status and iron binding capacity', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 27. Vitamin D (25-OH)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Vitamin D (25-Hydroxy)', 'VITD-01', 'Biochemistry', 'Blood', 600, 12, 'Measures vitamin D levels', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 28. Vitamin B12
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Vitamin B12', 'VITB12-01', 'Biochemistry', 'Blood', 500, 12, 'Measures vitamin B12 levels in blood', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 29. Uric Acid
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Serum Uric Acid', 'URIC-01', 'Biochemistry', 'Blood', 150, 4, 'Measures uric acid levels for gout screening', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 30. PT/INR (Prothrombin Time)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'PT/INR (Prothrombin Time)', 'PTINR-01', 'Hematology', 'Blood', 250, 4, 'Measures blood clotting time', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 31. Dengue NS1 Antigen
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Dengue NS1 Antigen', 'DENGNS1-01', 'Serology', 'Blood', 500, 4, 'Early detection of dengue infection', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 32. Dengue IgM/IgG
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Dengue IgM / IgG', 'DENGIGG-01', 'Serology', 'Blood', 500, 4, 'Detects dengue antibodies for current or past infection', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 33. Malaria Antigen (Rapid)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Malaria Antigen (Rapid Card)', 'MALAR-01', 'Microbiology', 'Blood', 250, 1, 'Rapid test for Plasmodium falciparum and vivax', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 34. Urine Culture & Sensitivity
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Urine Culture & Sensitivity', 'UCULT-01', 'Microbiology', 'Urine', 500, 48, 'Culture to identify urinary tract pathogens and antibiotic sensitivity', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 35. Blood Culture & Sensitivity
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Blood Culture & Sensitivity', 'BCULT-01', 'Microbiology', 'Blood', 700, 72, 'Culture to detect bloodstream infections', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 36. Semen Analysis
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Semen Analysis', 'SEMEN-01', 'Andrology', 'Semen', 400, 4, 'Evaluates sperm count, motility, morphology', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 37. Pregnancy Test (Urine)
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Pregnancy Test (Urine)', 'UPT-01', 'Hormone', 'Urine', 100, 1, 'Detects hCG hormone in urine', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 38. Serum Amylase
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Serum Amylase', 'AMYL-01', 'Biochemistry', 'Blood', 250, 4, 'Evaluates pancreatic function', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 39. Serum Lipase
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Serum Lipase', 'LIPAS-01', 'Biochemistry', 'Blood', 300, 4, 'Diagnoses pancreatitis', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 40. Troponin I / T
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
SELECT gen_random_uuid(), 'Troponin I (Cardiac Marker)', 'TROP-01', 'Biochemistry', 'Blood', 500, 2, 'Cardiac marker for myocardial infarction', branches.id
FROM branches LIMIT 1
ON CONFLICT DO NOTHING;
