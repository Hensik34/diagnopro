-- ============================================
-- MIGRATION 002: SEED TEST DATA
-- ============================================
-- Seeds: default branch, admin users, tests, test fields, packages, whatsapp templates
-- All columns already exist from 001_final_schema.sql
-- Safe to run on a freshly created database.
-- ============================================

-- ============================================
-- DEFAULT BRANCH (required before any branch-dependent data)
-- ============================================
INSERT INTO branches (id, name, location, city, state, phone, email, created_at, updated_at)
SELECT 
  'a0000000-0000-0000-0000-000000000001'::UUID,
  'Main Branch', 'Headquarters', 'Default City', 'Default State',
  '+1234567890', 'main@lab.com', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM branches LIMIT 1);

-- ============================================
-- DEFAULT ADMIN USER  (password: Admin@123)
-- bcrypt hash of 'Admin@123'
-- ============================================
INSERT INTO users (id, firstname, lastname, email, password_hash, phone, role, is_active, created_at, updated_at)
SELECT
  'a0000000-0000-0000-0000-000000000002'::UUID,
  'Admin', 'User', 'admin@diagnopro.com',
  '$2b$10$dPGKh5FbGJNlByBh0WERtu8OFPGhHxR7XPYfMzL.MjZuBmYfXKm6C',
  '+1234567890', 'admin', TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin' LIMIT 1);

-- Link admin to default branch
INSERT INTO user_branches (id, user_id, branch_id, role, created_at)
SELECT
  gen_random_uuid(),
  'a0000000-0000-0000-0000-000000000002'::UUID,
  (SELECT id FROM branches LIMIT 1),
  'admin',
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM user_branches WHERE user_id = 'a0000000-0000-0000-0000-000000000002'::UUID
);

-- Default settings for the default branch
INSERT INTO settings (id, branch_id, created_at, updated_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM branches LIMIT 1),
  NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM settings WHERE branch_id = (SELECT id FROM branches LIMIT 1)
);


INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at) VALUES
  (gen_random_uuid(), 'CBC (Complete Blood Count)', 'CBC-01', 'Hematology', 'Blood', 180, 4, 'Comprehensive blood cell count including RBC, WBC, platelets', NOW(), NOW()),
  (gen_random_uuid(), 'ESR (Erythrocyte Sedimentation Rate)', 'ESR-01', 'Hematology', 'Blood', 120, 2, 'Measures inflammatory response', NOW(), NOW()),
  (gen_random_uuid(), 'Blood Group & Rh Typing', 'BG-01', 'Hematology', 'Blood', 120, 1, 'ABO blood group and Rh factor determination', NOW(), NOW()),
  (gen_random_uuid(), 'Peripheral Blood Smear', 'PBS-01', 'Hematology', 'Blood', 250, 6, 'Microscopic examination of blood cells', NOW(), NOW()),
  (gen_random_uuid(), 'PT/INR (Prothrombin Time)', 'PT', 'Coagulation', 'Citrated Plasma (Blue Top)', 300.00, 4, 'Measures the time taken for blood to clot via the extrinsic pathway; includes INR for monitoring anticoagulant (warfarin) therapy.', NOW(), NOW()),
  (gen_random_uuid(), 'APTT (Activated Partial Thromboplastin Time)', 'APTT', 'Coagulation', 'Citrated Plasma (Blue Top)', 400.00, 4, 'Measures the time taken for blood to clot via the intrinsic pathway; used to monitor heparin therapy and screen for clotting factor deficiencies.', NOW(), NOW()),
  (gen_random_uuid(), 'Bleeding Time', 'BT-01', 'Hematology', 'Blood', 75, 2, 'Platelet function screening test', NOW(), NOW()),
  (gen_random_uuid(), 'Clotting Time', 'CT-01', 'Hematology', 'Blood', 75, 2, 'Extrinsic coagulation pathway test', NOW(), NOW()),
  (gen_random_uuid(), 'Fibrinogen', 'FIBR-01', 'Hematology', 'Blood', 300, 4, 'Blood clotting factor measurement', NOW(), NOW()),
  (gen_random_uuid(), 'D-Dimer', 'DD-01', 'Hematology', 'Blood', 400, 4, 'Thrombosis and fibrinolysis marker', NOW(), NOW()),
  (gen_random_uuid(), 'Lipid Profile', 'LIPID-01', 'Biochemistry', 'Blood', 500, 6, 'Cholesterol, HDL, LDL, VLDL, Triglycerides', NOW(), NOW()),
  (gen_random_uuid(), 'LFT (Liver Function Test)', 'LFT-01', 'Biochemistry', 'Blood', 650, 6, 'Bilirubin, SGOT, SGPT, ALP, Proteins', NOW(), NOW()),
  (gen_random_uuid(), 'KFT (Kidney Function Test)', 'KFT-01', 'Biochemistry', 'Blood', 500, 6, 'Urea, Creatinine, Electrolytes, eGFR', NOW(), NOW()),
  (gen_random_uuid(), 'Na/K/Cl (Serum Electrolytes)', 'ELEC-01', 'Biochemistry', 'Blood', 400, 4, 'Sodium, Potassium, Chloride, CO2', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Calcium', 'CALC-01', 'Biochemistry', 'Blood', 150, 4, 'Total and ionized calcium measurement', NOW(), NOW()),
  (gen_random_uuid(), 'Ionised Calcium', 'ICA-01', 'Biochemistry', 'Blood', 150, 4, 'Physiologically active free calcium measurement', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Phosphorus', 'PHOS-01', 'Biochemistry', 'Blood', 150, 4, 'Inorganic phosphorus level', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Magnesium', 'MAG-01', 'Biochemistry', 'Blood', 150, 4, 'Magnesium level measurement', NOW(), NOW()),
  (gen_random_uuid(), 'CRP (C-Reactive Protein)', 'CRP-01', 'Biochemistry', 'Blood', 270, 4, 'Inflammation marker', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Amylase', 'AMYL-01', 'Biochemistry', 'Blood', 250, 4, 'Pancreatic enzyme measurement', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Lipase', 'LIPAS-01', 'Biochemistry', 'Blood', 300, 4, 'Pancreatic lipase measurement', NOW(), NOW()),
  (gen_random_uuid(), 'FBS (Blood Sugar Fasting)', 'FBS-01', 'Biochemistry', 'Blood', 50, 2, 'Fasting glucose level', NOW(), NOW()),
  (gen_random_uuid(), 'PPBS (Post Prandial Blood Sugar)', 'PPBS-01', 'Biochemistry', 'Blood', 50, 2, 'Post-meal glucose measurement', NOW(), NOW()),
  (gen_random_uuid(), 'RBS (Random Blood Sugar)', 'RBS-01', 'Biochemistry', 'Blood', 50, 1, 'Random glucose level', NOW(), NOW()),
  (gen_random_uuid(), 'HbA1c (Glycated Hemoglobin)', 'HBA1C-01', 'Biochemistry', 'Blood', 400, 4, 'Average blood sugar over 3 months', NOW(), NOW()),
  (gen_random_uuid(), 'GTT (Glucose Tolerance Test)', 'GTT-01', 'Biochemistry', 'Blood', 150, 4, '2-hour glucose tolerance test', NOW(), NOW()),
  (gen_random_uuid(), 'Fasting Insulin', 'INS-F-01', 'Biochemistry', 'Blood', 300, 4, 'Fasting insulin level', NOW(), NOW()),
  (gen_random_uuid(), 'C-Peptide', 'CPEP-01', 'Biochemistry', 'Blood', 350, 4, 'Beta cell function assessment', NOW(), NOW()),
  (gen_random_uuid(), 'Microalbumin (Urine)', 'MALB-01', 'Biochemistry', 'Urine', 200, 4, 'Urine microalbumin for diabetes screening', NOW(), NOW()),
  (gen_random_uuid(), 'TSH (Thyroid Stimulating Hormone)', 'TSH-01', 'Hormone', 'Blood', 250, 4, 'Thyroid function screening', NOW(), NOW()),
  (gen_random_uuid(), 'Free T3', 'FT3-01', 'Hormone', 'Blood', 300, 4, 'Free triiodothyronine level', NOW(), NOW()),
  (gen_random_uuid(), 'Free T4', 'FT4-01', 'Hormone', 'Blood', 300, 4, 'Free thyroxine level', NOW(), NOW()),
  (gen_random_uuid(), 'Thyroid Profile (Total T3, Total T4, TSH)', 'THYPRO-01', 'Hormone', 'Blood', 500, 6, 'TSH, Total T3, Total T4', NOW(), NOW()),
  (gen_random_uuid(), 'Total T3', 'T3-01', 'Hormone', 'Blood', 250, 4, 'Total triiodothyronine level', NOW(), NOW()),
  (gen_random_uuid(), 'Total T4', 'T4-01', 'Hormone', 'Blood', 250, 4, 'Total thyroxine level', NOW(), NOW()),
  (gen_random_uuid(), 'Anti-TPO (Thyroid Peroxidase Antibodies)', 'ATPO-01', 'Immunology', 'Blood', 400, 4, 'Autoimmune thyroid marker', NOW(), NOW()),
  (gen_random_uuid(), 'Anti-Thyroglobulin', 'ATG-01', 'Immunology', 'Blood', 400, 4, 'Thyroid antibodies', NOW(), NOW()),
  (gen_random_uuid(), 'Thyroglobulin', 'TG-01', 'Hormone', 'Blood', 350, 4, 'Thyroid hormone precursor', NOW(), NOW()),
  (gen_random_uuid(), 'FSH (Follicle Stimulating Hormone)', 'FSH-01', 'Hormone', 'Blood', 350, 4, 'Reproductive hormone - pituitary', NOW(), NOW()),
  (gen_random_uuid(), 'LH (Luteinizing Hormone)', 'LH-01', 'Hormone', 'Blood', 350, 4, 'Reproductive hormone - pituitary', NOW(), NOW()),
  (gen_random_uuid(), 'Prolactin', 'PROL-01', 'Hormone', 'Blood', 350, 4, 'Milk production hormone', NOW(), NOW()),
  (gen_random_uuid(), 'Testosterone', 'TEST-01', 'Hormone', 'Blood', 400, 4, 'Male reproductive hormone', NOW(), NOW()),
  (gen_random_uuid(), 'Free Testosterone', 'FTEST-01', 'Hormone', 'Blood', 450, 4, 'Bioavailable testosterone', NOW(), NOW()),
  (gen_random_uuid(), 'Estradiol', 'ESTR-01', 'Hormone', 'Blood', 400, 4, 'Female reproductive hormone', NOW(), NOW()),
  (gen_random_uuid(), 'Progesterone', 'PROG-01', 'Hormone', 'Blood', 400, 4, 'Luteal phase hormone', NOW(), NOW()),
  (gen_random_uuid(), 'AMH (Anti-Müllerian Hormone)', 'AMH-01', 'Hormone', 'Blood', 500, 4, 'Ovarian reserve marker', NOW(), NOW()),
  (gen_random_uuid(), 'Beta-HCG (Quantitative)', 'BHCG-Q-01', 'Hormone', 'Blood', 250, 2, 'Pregnancy hormone (quantitative)', NOW(), NOW()),
  (gen_random_uuid(), 'Beta-HCG (Qualitative)', 'BHCG-QL-01', 'Hormone', 'Blood', 100, 1, 'Pregnancy hormone (yes/no)', NOW(), NOW()),
  (gen_random_uuid(), 'Cortisol (8 AM)', 'CORT-AM-01', 'Hormone', 'Blood', 400, 4, 'Morning cortisol level', NOW(), NOW()),
  (gen_random_uuid(), 'Cortisol (4 PM)', 'CORT-PM-01', 'Hormone', 'Blood', 400, 4, 'Afternoon cortisol level', NOW(), NOW()),
  (gen_random_uuid(), 'Cortisol (Random)', 'CORT-RAND-01', 'Hormone', 'Blood', 400, 4, 'Random cortisol level', NOW(), NOW()),
  (gen_random_uuid(), 'ACTH (Adrenocorticotropic Hormone)', 'ACTH-01', 'Hormone', 'Blood', 450, 4, 'Pituitary hormone', NOW(), NOW()),
  (gen_random_uuid(), 'PTH (Parathyroid Hormone)', 'PTH-01', 'Hormone', 'Blood', 400, 4, 'Calcium-regulating hormone', NOW(), NOW()),
  (gen_random_uuid(), 'Growth Hormone', 'GH-01', 'Hormone', 'Blood', 450, 4, 'Somatotropin hormone', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Iron', 'IRON-01', 'Biochemistry', 'Blood', 200, 4, 'Iron level measurement', NOW(), NOW()),
  (gen_random_uuid(), 'TIBC (Total Iron Binding Capacity)', 'TIBC-01', 'Biochemistry', 'Blood', 200, 4, 'Iron binding protein capacity', NOW(), NOW()),
  (gen_random_uuid(), 'Ferritin', 'FERR-01', 'Biochemistry', 'Blood', 300, 4, 'Iron storage protein', NOW(), NOW()),
  (gen_random_uuid(), 'Iron Saturation', 'IROS-01', 'Biochemistry', 'Blood', 200, 4, 'Percentage saturation', NOW(), NOW()),
  (gen_random_uuid(), 'Vitamin D (25-Hydroxy)', 'VITD-01', 'Biochemistry', 'Blood', 600, 12, 'Vitamin D status assessment', NOW(), NOW()),
  (gen_random_uuid(), 'Vitamin B12', 'VITB12-01', 'Biochemistry', 'Blood', 500, 12, 'Cobalamin level', NOW(), NOW()),
  (gen_random_uuid(), 'Folic Acid', 'FOLIC-01', 'Biochemistry', 'Blood', 450, 12, 'Folate level assessment', NOW(), NOW()),
  (gen_random_uuid(), 'Vitamin B1 (Thiamine)', 'VITB1-01', 'Biochemistry', 'Blood', 400, 12, 'Thiamine level', NOW(), NOW()),
  (gen_random_uuid(), 'Vitamin B6 (Pyridoxine)', 'VITB6-01', 'Biochemistry', 'Blood', 400, 12, 'Pyridoxine level', NOW(), NOW()),
  (gen_random_uuid(), 'Vitamin C', 'VITC-01', 'Biochemistry', 'Blood', 450, 12, 'Ascorbic acid level', NOW(), NOW()),
  (gen_random_uuid(), 'Troponin I (Cardiac Marker)', 'TROP-01', 'Biochemistry', 'Blood', 500, 2, 'Cardiac muscle damage marker', NOW(), NOW()),
  (gen_random_uuid(), 'CK-MB (Creatine Kinase MB)', 'CKMB-01', 'Biochemistry', 'Blood', 350, 4, 'Cardiac enzyme', NOW(), NOW()),
  (gen_random_uuid(), 'MyoGlobin', 'MYO-01', 'Biochemistry', 'Blood', 300, 4, 'Myocardial injury marker', NOW(), NOW()),
  (gen_random_uuid(), 'NT-ProBNP', 'NTPNB-01', 'Biochemistry', 'Blood', 600, 4, 'Heart failure marker', NOW(), NOW()),
  (gen_random_uuid(), 'BNP (B-type Natriuretic Peptide)', 'BNP-01', 'Biochemistry', 'Blood', 500, 4, 'Cardiac stress marker', NOW(), NOW()),
  (gen_random_uuid(), 'Homocysteine', 'HCYS-01', 'Biochemistry', 'Blood', 400, 4, 'Cardiovascular risk marker', NOW(), NOW()),
  (gen_random_uuid(), 'Apo A1 (Apolipoprotein A1)', 'APOA1-01', 'Biochemistry', 'Blood', 350, 4, 'HDL component', NOW(), NOW()),
  (gen_random_uuid(), 'Apo B (Apolipoprotein B)', 'APOB-01', 'Biochemistry', 'Blood', 350, 4, 'LDL component', NOW(), NOW()),
  (gen_random_uuid(), 'PSA (Prostate Specific Antigen)', 'PSA-01', 'Biochemistry', 'Blood', 400, 4, 'Prostate cancer marker', NOW(), NOW()),
  (gen_random_uuid(), 'Free PSA', 'FREE-PSA-01', 'Biochemistry', 'Blood', 450, 4, 'Free PSA percentage', NOW(), NOW()),
  (gen_random_uuid(), 'CA-125', 'CA125-01', 'Biochemistry', 'Blood', 500, 4, 'Ovarian cancer marker', NOW(), NOW()),
  (gen_random_uuid(), 'CA 19-9', 'CA199-01', 'Biochemistry', 'Blood', 500, 4, 'Pancreatic cancer marker', NOW(), NOW()),
  (gen_random_uuid(), 'CEA (Carcinoembryonic Antigen)', 'CEA-01', 'Biochemistry', 'Blood', 450, 4, 'Colorectal cancer marker', NOW(), NOW()),
  (gen_random_uuid(), 'AFP (Alpha-Fetoprotein)', 'AFP-01', 'Biochemistry', 'Blood', 450, 4, 'Liver cancer marker', NOW(), NOW()),
  (gen_random_uuid(), 'HER2/neu', 'HER2-01', 'Biochemistry', 'Blood', 600, 4, 'Breast cancer marker', NOW(), NOW()),
  (gen_random_uuid(), 'S100 Protein', 'S100-01', 'Biochemistry', 'Blood', 400, 4, 'Melanoma marker', NOW(), NOW()),
  (gen_random_uuid(), 'Calcitonin', 'CALC-TM-01', 'Hormone', 'Blood', 500, 4, 'Thyroid medullary cancer marker', NOW(), NOW()),
  (gen_random_uuid(), 'Beta-HCG (Tumor Marker)', 'BHCG-TM-01', 'Biochemistry', 'Blood', 300, 4, 'Germ cell tumor marker', NOW(), NOW()),
  (gen_random_uuid(), 'Widal Test', 'WIDAL-01', 'Serology', 'Blood', 150, 4, 'Typhoid fever antibodies', NOW(), NOW()),
  (gen_random_uuid(), 'VDRL (Syphilis Screening)', 'VDRL-01', 'Serology', 'Blood', 200, 4, 'Syphilis screening test', NOW(), NOW()),
  (gen_random_uuid(), 'RPR (Rapid Plasma Reagin)', 'RPR-01', 'Serology', 'Serum', 200, 4, 'Syphilis detection test', NOW(), NOW()),
  (gen_random_uuid(), 'FTA-ABS (Syphilis Confirmation)', 'FTAABS-01', 'Serology', 'Blood', 300, 4, 'Syphilis confirmation test', NOW(), NOW()),
  (gen_random_uuid(), 'HIV I & II (ELISA)', 'HIV-01', 'Serology', 'Serum', 300, 6, 'HIV antibody screening', NOW(), NOW()),
  (gen_random_uuid(), 'HIV Rapid Card', 'HIV-RAPID-01', 'Serology', 'Serum', 150, 1, 'Rapid HIV screening', NOW(), NOW()),
  (gen_random_uuid(), 'HBsAg (ELISA)', 'HBSAG-01', 'Serology', 'Serum', 200, 4, 'Hepatitis B screening', NOW(), NOW()),
  (gen_random_uuid(), 'HBsAg Rapid', 'HBSAG-RAPID-01', 'Serology', 'Serum', 150, 1, 'Rapid Hepatitis B screening', NOW(), NOW()),
  (gen_random_uuid(), 'Anti-HBc (Hepatitis B Core Antibodies)', 'AHBC-01', 'Serology', 'Blood', 250, 4, 'Hepatitis B exposure', NOW(), NOW()),
  (gen_random_uuid(), 'Anti-HBs (Hepatitis B Surface Antibodies)', 'AHBS-01', 'Serology', 'Blood', 250, 4, 'Hepatitis B immunity', NOW(), NOW()),
  (gen_random_uuid(), 'HBeAg (Hepatitis B E Antigen)', 'HBEAG-01', 'Serology', 'Blood', 300, 4, 'Hepatitis B viral load', NOW(), NOW()),
  (gen_random_uuid(), 'HCV (ELISA)', 'HCV-01', 'Serology', 'Serum', 300, 6, 'Hepatitis C screening', NOW(), NOW()),
  (gen_random_uuid(), 'HCV Rapid', 'HCV-RAPID-01', 'Serology', 'Serum', 150, 1, 'Rapid Hepatitis C screening', NOW(), NOW()),
  (gen_random_uuid(), 'HCV RNA (Hepatitis C Viral Load)', 'HCV-RNA-01', 'Serology', 'Blood', 600, 4, 'Hepatitis C PCR quantification', NOW(), NOW()),
  (gen_random_uuid(), 'HAV IgM (Hepatitis A)', 'AHAV-IGM-01', 'Serology', 'Blood', 250, 4, 'Acute Hepatitis A infection', NOW(), NOW()),
  (gen_random_uuid(), 'HAV IgG (Hepatitis A)', 'AHAV-IGG-01', 'Serology', 'Blood', 250, 4, 'Hepatitis A immunity', NOW(), NOW()),
  (gen_random_uuid(), 'Dengue NS1 rapid', 'DENGNS1-RAPID', 'Serology', 'Serum', 300, 4, 'Qualitative detection of Dengue NS1 Antigen', NOW(), NOW()),
  (gen_random_uuid(), 'Dengue rapid', 'DENGUE-RAPID', 'Serology', 'Serum', 650, 4, 'Qualitative detection of Dengue IgM and IgG antibodies', NOW(), NOW()),
  (gen_random_uuid(), 'Zika IgM', 'ZIKA-IGM-01', 'Serology', 'Blood', 400, 4, 'Zika virus antibodies', NOW(), NOW()),
  (gen_random_uuid(), 'CMV IgM', 'CMV-IGM-01', 'Serology', 'Blood', 350, 4, 'Acute CMV infection', NOW(), NOW()),
  (gen_random_uuid(), 'CMV IgG', 'CMV-IGG-01', 'Serology', 'Blood', 350, 4, 'CMV immunity status', NOW(), NOW()),
  (gen_random_uuid(), 'EBV VCA IgM', 'EBV-VCA-IGM-01', 'Serology', 'Blood', 350, 4, 'Acute EBV infection', NOW(), NOW()),
  (gen_random_uuid(), 'EBV VCA IgG', 'EBV-VCA-IGG-01', 'Serology', 'Blood', 350, 4, 'Past EBV infection', NOW(), NOW()),
  (gen_random_uuid(), 'Measles IgM', 'MEASLES-IGM-01', 'Serology', 'Blood', 350, 4, 'Acute measles', NOW(), NOW()),
  (gen_random_uuid(), 'Mumps IgM', 'MUMPS-IGM-01', 'Serology', 'Blood', 350, 4, 'Acute mumps', NOW(), NOW()),
  (gen_random_uuid(), 'RA Factor (Rheumatoid Factor)', 'RAF-01', 'Immunology', 'Blood', 300, 4, 'Rheumatoid arthritis marker', NOW(), NOW()),
  (gen_random_uuid(), 'Anti-CCP (Cyclic Citrullinated Peptide)', 'ANTICCP-01', 'Immunology', 'Blood', 450, 4, 'RA-specific antibody', NOW(), NOW()),
  (gen_random_uuid(), 'ASO Titre (Anti-Streptolysin O)', 'ASO-01', 'Immunology', 'Blood', 250, 4, 'Streptococcal infection', NOW(), NOW()),
  (gen_random_uuid(), 'ANA (Antinuclear Antibodies)', 'ANA-01', 'Immunology', 'Blood', 400, 4, 'Autoimmune disease screening', NOW(), NOW()),
  (gen_random_uuid(), 'Anti-dsDNA', 'ANTIDSDNA-01', 'Immunology', 'Blood', 450, 4, 'SLE-specific antibody', NOW(), NOW()),
  (gen_random_uuid(), 'Complement C3', 'C3-01', 'Immunology', 'Blood', 400, 4, 'Complement system component', NOW(), NOW()),
  (gen_random_uuid(), 'Complement C4', 'C4-01', 'Immunology', 'Blood', 400, 4, 'Complement system component', NOW(), NOW()),
  (gen_random_uuid(), 'IgA (Immunoglobulin A)', 'IGA-01', 'Immunology', 'Blood', 350, 4, 'Immune response antibody', NOW(), NOW()),
  (gen_random_uuid(), 'Urine Routine Examination', 'URINE-01', 'Clinical Pathology', 'Urine', 100, 3, 'Complete urine analysis', NOW(), NOW()),
  (gen_random_uuid(), 'Urine Culture & Sensitivity', 'UCULT-01', 'Microbiology', 'Urine', 500, 48, 'UTI pathogen identification', NOW(), NOW()),
  (gen_random_uuid(), 'Blood Culture & Sensitivity', 'BCULT-01', 'Microbiology', 'Blood', 700, 72, 'Bloodstream infection detection', NOW(), NOW()),
  (gen_random_uuid(), 'Stool Routine & Microscopy', 'STOOL-01', 'Clinical Pathology', 'Stool', 300, 3, 'Parasites and microbes', NOW(), NOW()),
  (gen_random_uuid(), 'Stool Culture & Sensitivity', 'SCULT-01', 'Microbiology', 'Stool', 600, 48, 'Bacterial pathogens', NOW(), NOW()),
  (gen_random_uuid(), 'Sputum Culture & Sensitivity', 'SPCULT-01', 'Microbiology', 'Sputum', 600, 48, 'Respiratory infection pathogens', NOW(), NOW()),
  (gen_random_uuid(), 'Pus Culture & Sensitivity', 'PCULT-01', 'Microbiology', 'Pus', 600, 48, 'Wound/abscess pathogens', NOW(), NOW()),
  (gen_random_uuid(), 'Throat Swab Culture', 'TCULT-01', 'Microbiology', 'Throat Swab', 500, 48, 'Streptococcus and pathogens', NOW(), NOW()),
  (gen_random_uuid(), 'Fungal Culture', 'FCULT-01', 'Microbiology', 'Various', 700, 72, 'Fungal pathogen identification', NOW(), NOW()),
  (gen_random_uuid(), 'KOH Preparation (Fungal)', 'KOH-01', 'Microbiology', 'Various', 200, 2, 'Fungal elements detection', NOW(), NOW()),
  (gen_random_uuid(), 'TB Culture (Sputum)', 'TBCULT-01', 'Microbiology', 'Sputum', 1000, 72, 'Tuberculosis detection', NOW(), NOW()),
  (gen_random_uuid(), 'TB GENE XPERT (Rapid TB)', 'TB-XPERT-01', 'Microbiology', 'Sputum', 800, 2, 'Rapid TB detection', NOW(), NOW()),
  (gen_random_uuid(), 'Malaria Antigen (Rapid Card)', 'MAL-AG-01', 'Serology', 'Whole Blood (EDTA)', 300, 1, 'Rapid antigen detection of P. falciparum and P. vivax', NOW(), NOW()),
  (gen_random_uuid(), 'CSF Analysis', 'CSF-01', 'Clinical Pathology', 'CSF', 800, 4, 'Cerebrospinal fluid analysis', NOW(), NOW()),
  (gen_random_uuid(), 'Pleural Fluid Analysis', 'PLEURAL-01', 'Clinical Pathology', 'Pleural Fluid', 700, 4, 'Pleural fluid examination', NOW(), NOW()),
  (gen_random_uuid(), 'FNAC (Fine Needle Aspiration Cytology)', 'FNAC-01', 'Histopathology', 'Tissue', 1500, 5, 'Needle aspiration cytology', NOW(), NOW()),
  (gen_random_uuid(), 'PAP Smear (Cervical Cytology)', 'PAP-01', 'Cytology', 'Cervical', 500, 3, 'Cervical cancer screening', NOW(), NOW()),
  (gen_random_uuid(), 'Biopsy Examination', 'BIOPSY-01', 'Histopathology', 'Tissue', 2000, 7, 'Tissue diagnosis', NOW(), NOW()),
  (gen_random_uuid(), 'Bone Marrow Examination', 'BM-01', 'Histopathology', 'Bone Marrow', 2500, 5, 'Hematologic malignancy investigation', NOW(), NOW()),
  (gen_random_uuid(), 'Ascitic Fluid Analysis', 'ASCITIC-01', 'Clinical Pathology', 'Ascitic Fluid', 700, 4, 'Ascites analysis', NOW(), NOW()),
  (gen_random_uuid(), 'Joint Fluid Analysis', 'JOINT-01', 'Clinical Pathology', 'Joint Fluid', 700, 4, 'Synovial fluid examination', NOW(), NOW()),
  (gen_random_uuid(), 'Semen Analysis', 'SEMEN-01', 'Andrology', 'Semen', 300, 4, 'Sperm count, motility, morphology', NOW(), NOW()),
  (gen_random_uuid(), 'Pregnancy Test (Serum)', 'SPT-01', 'Hormone', 'Blood', 150, 2, 'Serum beta-HCG qualitative', NOW(), NOW()),
  (gen_random_uuid(), 'Pregnancy Test (Urine)', 'UPT-01', 'Hormone', 'Urine', 100, 1, 'Urine pregnancy test', NOW(), NOW()),
  (gen_random_uuid(), 'ACE (Angiotensin Converting Enzyme)', 'ACE-01', 'Biochemistry', 'Blood', 400, 4, 'Sarcoidosis marker', NOW(), NOW()),
  (gen_random_uuid(), 'LDH (Lactate Dehydrogenase)', 'LDH-01', 'Biochemistry', 'Blood', 200, 4, 'Tissue damage marker', NOW(), NOW()),
  (gen_random_uuid(), 'Total Protein', 'TP-01', 'Biochemistry', 'Blood', 100, 2, 'Albumin and globulin', NOW(), NOW()),
  (gen_random_uuid(), 'Albumin', 'ALB-01', 'Biochemistry', 'Blood', 100, 2, 'Protein synthesis marker', NOW(), NOW()),
  (gen_random_uuid(), 'Globulin', 'GLOB-01', 'Biochemistry', 'Blood', 100, 2, 'Immune protein level', NOW(), NOW()),
  (gen_random_uuid(), 'Blood Alcohol Level', 'BAL-01', 'Toxicology', 'Blood', 300, 2, 'Ethanol concentration', NOW(), NOW()),
  (gen_random_uuid(), 'Ammonia', 'AMMON-01', 'Biochemistry', 'Blood', 400, 4, 'Hepatic encephalopathy marker', NOW(), NOW()),
  (gen_random_uuid(), 'PAPP-A (Pregnancy Associated Plasma Protein)', 'PAPPA-01', 'Hormone', 'Blood', 500, 4, 'Down syndrome screening', NOW(), NOW()),
  (gen_random_uuid(), 'AFP (Maternal Serum)', 'AFP-MAT-01', 'Biochemistry', 'Blood', 450, 4, 'Neural tube defect screening', NOW(), NOW()),
  (gen_random_uuid(), 'uE3 (Unconjugated Estriol)', 'UE3-01', 'Hormone', 'Blood', 450, 4, 'Down syndrome screening', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Uric Acid', 'URIC-01', 'Biochemistry', 'Blood', 150, 4, 'Uric acid for gout screening', NOW(), NOW()),
  (gen_random_uuid(), 'IgG (Immunoglobulin G)', 'IGG-01', 'Immunology', 'Blood', 350, 4, 'Primary immune antibody', NOW(), NOW()),
  (gen_random_uuid(), 'IgM (Immunoglobulin M)', 'IGM-01', 'Immunology', 'Blood', 350, 4, 'Acute immune response', NOW(), NOW()),
  (gen_random_uuid(), 'Chikungunya IgM', 'CHIK-IGM-01', 'Serology', 'Serum', 650, 24, 'Detection of IgM antibodies to Chikungunya virus', NOW(), NOW()),
  (gen_random_uuid(), 'ACR (Urine Albumin/Creatinine Ratio)', 'UACR-01', 'Biochemistry', 'Urine', 400, 4, 'Spot urine albumin to creatinine ratio for early kidney damage / microalbuminuria', NOW(), NOW()),
  (gen_random_uuid(), 'TORCH Evaluation', 'TORCH-01', 'Serology', 'Serum', 2500, 24, 'Panel for Toxoplasma, Rubella, CMV and Herpes (IgG & IgM antibodies)', NOW(), NOW()),
  
  -- NEW STANDALONE TESTS FROM AUDIT LIST
  (gen_random_uuid(), 'Hb (Hemoglobin)', 'HB-01', 'Hematology', 'Whole Blood (EDTA)', 120, 1, 'Measures concentration of hemoglobin in blood', NOW(), NOW()),
  (gen_random_uuid(), 'AEC (Absolute Eosinophil Count)', 'AEC-01', 'Hematology', 'Whole Blood (EDTA)', 150, 2, 'Measures absolute number of eosinophils', NOW(), NOW()),
  (gen_random_uuid(), 'Reticulocyte Count', 'RETIC-01', 'Hematology', 'Whole Blood (EDTA)', 250, 4, 'Measures the percentage of young red blood cells', NOW(), NOW()),
  (gen_random_uuid(), 'MP (Malaria Parasite Smear)', 'MP-01', 'Hematology', 'Whole Blood (EDTA)', 120, 2, 'Microscopic examination for malaria parasite detection', NOW(), NOW()),
  (gen_random_uuid(), 'Platelet Count', 'PLT-01', 'Hematology', 'Whole Blood (EDTA)', 150, 2, 'Measures absolute number of blood platelets', NOW(), NOW()),
  (gen_random_uuid(), 'PGBS (Post Glucose Blood Sugar)', 'PGBS-01', 'Biochemistry', 'Fluoride Plasma', 50, 2, 'Measures blood sugar level 2 hours after 75g glucose load', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Urea', 'UREA-01', 'Biochemistry', 'Serum', 150, 4, 'Measures urea concentration in serum', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Creatinine', 'CREAT-01', 'Biochemistry', 'Serum', 150, 4, 'Measures creatinine concentration in serum', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Bilirubin (Total, Direct & Indirect)', 'BIL-01', 'Biochemistry', 'Serum', 200, 4, 'Measures total, direct and indirect bilirubin in serum', NOW(), NOW()),
  (gen_random_uuid(), 'SGPT (ALT)', 'SGPT-01', 'Biochemistry', 'Serum', 150, 4, 'Alanine Aminotransferase enzyme activity measurement', NOW(), NOW()),
  (gen_random_uuid(), 'SGOT (AST)', 'SGOT-01', 'Biochemistry', 'Serum', 150, 4, 'Aspartate Aminotransferase enzyme activity measurement', NOW(), NOW()),
  (gen_random_uuid(), 'ALP (Alkaline Phosphatase)', 'ALP-01', 'Biochemistry', 'Serum', 150, 4, 'Alkaline Phosphatase enzyme activity measurement', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Cholesterol', 'CHOL-01', 'Biochemistry', 'Serum', 150, 4, 'Measures total cholesterol level in serum', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Triglycerides', 'TRIG-01', 'Biochemistry', 'Serum', 150, 4, 'Measures triglycerides level in serum', NOW(), NOW()),
  (gen_random_uuid(), 'HDL Cholesterol', 'HDL-01', 'Biochemistry', 'Serum', 150, 4, 'Measures High-Density Lipoprotein cholesterol in serum', NOW(), NOW()),
  (gen_random_uuid(), 'Sputum Routine & Microscopy', 'SPUTUM-RM', 'Clinical Pathology', 'Sputum', 350, 6, 'Routine macroscopic and microscopic analysis of sputum', NOW(), NOW()),
  (gen_random_uuid(), 'Mantoux', 'MANTOUX-01', 'Immunology', 'Intradermal Injection', 200, 48, 'Tuberculin skin test for exposure to Tuberculosis', NOW(), NOW()),
  (gen_random_uuid(), 'Typhidot (IgM & IgG)', 'TYPHIDOT-01', 'Serology', 'Serum', 300, 4, 'Qualitative rapid test for Salmonella typhi IgM and IgG', NOW(), NOW()),
  (gen_random_uuid(), 'Brucella IgM', 'BRUC-IGM', 'Serology', 'Serum', 350, 4, 'Qualitative detection of IgM antibodies against Brucella species for acute brucellosis diagnosis', NOW(), NOW()),
  (gen_random_uuid(), 'Brucella IgG', 'BRUC-IGG', 'Serology', 'Serum', 350, 4, 'Qualitative detection of IgG antibodies against Brucella species for chronic or past exposure to brucellosis', NOW(), NOW()),
  (gen_random_uuid(), 'APLA/APLZ (Antiphospholipid Antibody Profile)', 'APLA-PRO', 'Immunology', 'Serum/Plasma', 2800, 12, 'Comprehensive profile for Antiphospholipid Syndrome (APS) detecting Lupus Anticoagulant, Anti-Cardiolipin, and Beta-2 Glycoprotein I antibodies', NOW(), NOW()),
  (gen_random_uuid(), 'Double Marker', 'DBLM-01', 'Hormone', 'Serum', 1500, 24, 'First trimester maternal screening for chromosomal abnormalities (Free Beta-hCG and PAPP-A)', NOW(), NOW()),
  (gen_random_uuid(), 'Triple Marker', 'TRPM-01', 'Hormone', 'Serum', 2000, 24, 'Second trimester maternal screening for chromosomal abnormalities and neural tube defects (AFP, HCG, and uE3)', NOW(), NOW()),
  (gen_random_uuid(), 'Rubella IgG', 'RUB-IGG', 'Serology', 'Serum', 400, 4, 'Quantitative determination of IgG antibodies against Rubella virus to evaluate immune status', NOW(), NOW()),
  (gen_random_uuid(), 'Rubella IgM', 'RUB-IGM', 'Serology', 'Serum', 400, 4, 'Qualitative determination of IgM antibodies against Rubella virus to diagnose acute or recent infection', NOW(), NOW()),
  (gen_random_uuid(), 'G6PD (Glucose-6-Phosphate Dehydrogenase)', 'G6PD-01', 'Biochemistry', 'Whole Blood (EDTA)', 450, 6, 'Measures Glucose-6-Phosphate Dehydrogenase activity in red blood cells to detect G6PD deficiency', NOW(), NOW())
ON CONFLICT (test_code) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

-- ==========================================
-- INSERT NEW CBC, KFT, LIPID FIELDS
-- ==========================================

-- Clean up any existing duplicates before inserting (safe to run multiple times)
WITH duplicates AS (
  SELECT
    ctid,
    ROW_NUMBER() OVER (PARTITION BY test_id, field_name ORDER BY created_at ASC) as rn
  FROM
    test_fields
)
DELETE FROM test_fields
WHERE ctid IN (
  SELECT ctid FROM duplicates WHERE rn > 1
);


INSERT INTO test_fields (
  id,
  test_id,
  field_name,
  unit,
  input_type,
  options,
  field_type,
  formula,
  depends_on,
  section_group,
  order_index,
  reference_rules,
  critical_rules,
  is_mandatory,
  created_at,
  updated_at
)
VALUES

-- RBC PARAMETERS

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'Hemoglobin','g/dL','number',NULL,'input',
NULL,NULL,
'RBC Parameters',1,
'[{"age_min": 0, "age_max": 30, "age_max_unit": "days", "sex": "any", "low": 15.0, "high": 24.0, "note": "30 Days"}, {"age_min": 30, "age_min_unit": "days", "age_max": 2, "age_max_unit": "years", "sex": "any", "low": 10.5, "high": 14.0, "note": "2 Years"}, {"age_min": 2, "age_min_unit": "years", "age_max": 9, "age_max_unit": "years", "sex": "any", "low": 11.5, "high": 14.5, "note": "9 Years"}, {"age_min": 9, "age_min_unit": "years", "age_max": 17, "age_max_unit": "years", "sex": "female", "low": 12.0, "high": 15.0, "note": "17 Years"}, {"age_min": 9, "age_min_unit": "years", "age_max": 17, "age_max_unit": "years", "sex": "male", "low": 12.5, "high": 16.0, "note": "17 Years"}, {"age_min": 17, "age_min_unit": "years", "age_max": 110, "age_max_unit": "years", "sex": "female", "low": 12.0, "high": 16.0, "note": "ADULT"}, {"age_min": 17, "age_min_unit": "years", "age_max": 110, "age_max_unit": "years", "sex": "male", "low": 13.0, "high": 18.0, "note": "ADULT"}]'::jsonb,
'{"low":7.0,"high":20.0}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'RBC Count','million/uL','number',NULL,'input',
NULL,NULL,
'RBC Parameters',2,
'[{"age_min": 0, "age_max": 9, "age_max_unit": "days", "sex": "male", "low": 4.0, "high": 5.3, "note": "9 Days"}, {"age_min": 0, "age_max": 30, "age_max_unit": "days", "sex": "any", "low": 4.1, "high": 6.7, "note": "30 Days"}, {"age_min": 30, "age_min_unit": "days", "age_max": 2, "age_max_unit": "years", "sex": "any", "low": 3.8, "high": 5.4, "note": "2 Years"}, {"age_min": 2, "age_min_unit": "years", "age_max": 9, "age_max_unit": "years", "sex": "any", "low": 4.0, "high": 5.3, "note": "9 Years"}, {"age_min": 9, "age_min_unit": "years", "age_max": 17, "age_max_unit": "years", "sex": "female", "low": 4.1, "high": 5.3, "note": "17 Years"}, {"age_min": 9, "age_min_unit": "years", "age_max": 17, "age_max_unit": "years", "sex": "male", "low": 4.2, "high": 5.6, "note": "17 Years"}, {"age_min": 17, "age_min_unit": "years", "age_max": 110, "age_max_unit": "years", "sex": "female", "low": 4.2, "high": 5.4, "note": "ADULT"}, {"age_min": 17, "age_min_unit": "years", "age_max": 110, "age_max_unit": "years", "sex": "male", "low": 4.7, "high": 6.0, "note": "ADULT"}]'::jsonb,
'{"low":2.5,"high":7.0}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'Total WBC Count','/uL','number',NULL,'input',
NULL,NULL,
'RBC Parameters',3,
'[{"age_min": 0, "age_max": 30, "age_max_unit": "days", "sex": "any", "low": 9100.0, "high": 34000.0, "note": "30 Days"}, {"age_min": 30, "age_min_unit": "days", "age_max": 2, "age_max_unit": "years", "sex": "any", "low": 6000.0, "high": 14000.0, "note": "2 Years"}, {"age_min": 2, "age_min_unit": "years", "age_max": 9, "age_max_unit": "years", "sex": "any", "low": 4000.0, "high": 12000.0, "note": "9 Years"}, {"age_min": 9, "age_min_unit": "years", "age_max": 17, "age_max_unit": "years", "sex": "female", "low": 4000.0, "high": 10000.0, "note": "17 Years"}, {"age_min": 9, "age_min_unit": "years", "age_max": 17, "age_max_unit": "years", "sex": "male", "low": 4000.0, "high": 10000.0, "note": "17 Years"}, {"age_min": 9, "age_min_unit": "years", "age_max": 17, "age_max_unit": "years", "sex": "any", "low": 5000.0, "high": 13000.0, "note": "17 Years"}, {"age_min": 17, "age_min_unit": "years", "age_max": 110, "age_max_unit": "years", "sex": "female", "low": 4000.0, "high": 10000.0, "note": "ADULT"}, {"age_min": 17, "age_min_unit": "years", "age_max": 110, "age_max_unit": "years", "sex": "male", "low": 4000.0, "high": 11000.0, "note": "ADULT"}]'::jsonb,
'{"low":1000,"high":50000}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'Platelet Count','/uL','number',NULL,'input',
NULL,NULL,
'RBC Parameters',4,
'{"min":150000,"max":450000}'::jsonb,
'{"low":20000,"high":1000000}'::jsonb,
true,NOW(),NOW()),

-- DIFFERENTIAL COUNT

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'Neutrophils','%','number',NULL,'input',
NULL,NULL,
'Differential Count',5,
'{"min":50,"max":70}'::jsonb,
'{"low":10,"high":90}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'Lymphocytes','%','number',NULL,'input',
NULL,NULL,
'Differential Count',6,
'{"min":20,"max":40}'::jsonb,
'{"low":5,"high":80}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'Monocytes','%','number',NULL,'input',
NULL,NULL,
'Differential Count',7,
'{"min":2,"max":6}'::jsonb,
'{"high":20}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'Eosinophils','%','number',NULL,'input',
NULL,NULL,
'Differential Count',8,
'{"min":1,"max":4}'::jsonb,
'{"high":20}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'Basophils','%','number',NULL,'input',
NULL,NULL,
'Differential Count',9,
'{"min":0,"max":1}'::jsonb,
'{"high":5}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'Absolute Neutrophil Count','/uL','number',NULL,'calculated',
'(Total WBC Count * Neutrophils) / 100',
'Total WBC Count,Neutrophils',
'Differential Count',10,
'{"min":1500,"max":7200}'::jsonb,
'{"low":500}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'Absolute Lymphocyte Count','/uL','number',NULL,'calculated',
'(Total WBC Count * Lymphocytes) / 100',
'Total WBC Count,Lymphocytes',
'Differential Count',11,
'{"min":800,"max":4000}'::jsonb,
'{"low":500}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'Absolute Monocyte Count','/uL','number',NULL,'calculated',
'(Total WBC Count * Monocytes) / 100',
'Total WBC Count,Monocytes',
'Differential Count',12,
'{"min":200,"max":1000}'::jsonb,
'{"high":3000}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'Absolute Eosinophil Count','/uL','number',NULL,'calculated',
'(Total WBC Count * Eosinophils) / 100',
'Total WBC Count,Eosinophils',
'Differential Count',13,
'{"min":0,"max":450}'::jsonb,
'{"high":1500}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'Absolute Basophil Count','/uL','number',NULL,'calculated',
'(Total WBC Count * Basophils) / 100',
'Total WBC Count,Basophils',
'Differential Count',14,
'{"min":0,"max":200}'::jsonb,
'{"high":500}'::jsonb,
true,NOW(),NOW()),

-- BLOOD INDICES

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'Hematocrit (PCV)','%','number',NULL,'input',
NULL,NULL,
'Blood Indices',15,
'[{"age_min": 0, "age_max": 30, "age_max_unit": "days", "sex": "any", "low": 44.0, "high": 70.0, "note": "30 Days"}, {"age_min": 30, "age_min_unit": "days", "age_max": 2, "age_max_unit": "years", "sex": "any", "low": 32.0, "high": 42.0, "note": "2 Years"}, {"age_min": 2, "age_min_unit": "years", "age_max": 9, "age_max_unit": "years", "sex": "any", "low": 33.0, "high": 43.0, "note": "9 Years"}, {"age_min": 9, "age_min_unit": "years", "age_max": 17, "age_max_unit": "years", "sex": "female", "low": 35.0, "high": 45.0, "note": "17 Years"}, {"age_min": 9, "age_min_unit": "years", "age_max": 17, "age_max_unit": "years", "sex": "male", "low": 36.0, "high": 47.0, "note": "17 Years"}, {"age_min": 17, "age_min_unit": "years", "age_max": 110, "age_max_unit": "years", "sex": "female", "low": 37.0, "high": 47.0, "note": "ADULT"}, {"age_min": 17, "age_min_unit": "years", "age_max": 110, "age_max_unit": "years", "sex": "male", "low": 42.0, "high": 52.0, "note": "ADULT"}]'::jsonb,
'{"low":20,"high":60}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'MCHC','g/dL','number',NULL,'calculated',
'(Hemoglobin * 100) / Hematocrit (PCV)', 'Hemoglobin,Hematocrit (PCV)',
'Blood Indices',18,
'{"min":32,"max":36}'::jsonb,
'{"low":25,"high":40}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'MCH','pg','number',NULL,'calculated',
'(Hemoglobin * 10) / RBC Count', 'Hemoglobin,RBC Count',
'Blood Indices',17,
'[{"age_min": 0, "age_max": 30, "age_max_unit": "days", "sex": "any", "low": 33.0, "high": 39.0, "note": "30 Days"}, {"age_min": 30, "age_min_unit": "days", "age_max": 2, "age_max_unit": "years", "sex": "any", "low": 24.0, "high": 30.0, "note": "2 Years"}, {"age_min": 2, "age_min_unit": "years", "age_max": 9, "age_max_unit": "years", "sex": "any", "low": 25.0, "high": 31.0, "note": "9 Years"}, {"age_min": 9, "age_min_unit": "years", "age_max": 17, "age_max_unit": "years", "sex": "any", "low": 26.0, "high": 32.0, "note": "17 Years"}, {"age_min": 17, "age_min_unit": "years", "age_max": 110, "age_max_unit": "years", "sex": "any", "low": 27.0, "high": 31.0, "note": "ADULT"}]'::jsonb,
'{"low":20,"high":40}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'MCV','fL','number',NULL,'calculated',
'(Hematocrit (PCV) * 10) / RBC Count', 'Hematocrit (PCV),RBC Count',
'Blood Indices',16,
'[{"age_min": 0, "age_max": 30, "age_max_unit": "days", "sex": "any", "low": 102.0, "high": 115.0, "note": "30 Days"}, {"age_min": 30, "age_min_unit": "days", "age_max": 2, "age_max_unit": "years", "sex": "any", "low": 72.0, "high": 88.0, "note": "2 Years"}, {"age_min": 2, "age_min_unit": "years", "age_max": 9, "age_max_unit": "years", "sex": "any", "low": 76.0, "high": 90.0, "note": "9 Years"}, {"age_min": 9, "age_min_unit": "years", "age_max": 17, "age_max_unit": "years", "sex": "any", "low": 78.0, "high": 95.0, "note": "17 Years"}, {"age_min": 17, "age_min_unit": "years", "age_max": 110, "age_max_unit": "years", "sex": "any", "low": 78.0, "high": 100.0, "note": "ADULT"}]'::jsonb,
'{"low":60,"high":120}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'RDW-CV','%','number',NULL,'input',
NULL,NULL,
'Blood Indices',19,
'[{"age_min": 0, "age_max": 30, "age_max_unit": "days", "sex": "any", "low": 13.0, "high": 18.0, "note": "30 Days"}, {"age_min": 30, "age_min_unit": "days", "age_max": 2, "age_max_unit": "years", "sex": "any", "low": 11.5, "high": 16.0, "note": "2 Years"}, {"age_min": 2, "age_min_unit": "years", "age_max": 9, "age_max_unit": "years", "sex": "any", "low": 11.5, "high": 15.0, "note": "9 Years"}, {"age_min": 9, "age_min_unit": "years", "age_max": 17, "age_max_unit": "years", "sex": "any", "low": 11.5, "high": 14.0, "note": "17 Years"}, {"age_min": 17, "age_min_unit": "years", "age_max": 110, "age_max_unit": "years", "sex": "any", "low": 11.5, "high": 14.0, "note": "ADULT"}]'::jsonb,
'{"high":25}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'PCT','%','number',NULL,'input',
NULL,NULL,
'Blood Indices',20,
NULL,
NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'MPV','fL','number',NULL,'input',
NULL,NULL,
'Blood Indices',21,
'{"min":7.5,"max":11.5}'::jsonb,
'{"high":20}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'RBC Morphology',NULL,'textarea','Normocytic Normochromic,Normocytic Mild Hypochromic,Microcytic Hypochromic,Macrocytic,Dimorphic Picture,Mild Anisocytosis,Moderate Anisocytosis,Marked Anisocytosis,Mild Poikilocytosis,Moderate Poikilocytosis,Hypochromia Present,Polychromasia Present,Target Cells Seen,Tear Drop Cells Seen,Spherocytes Seen,Schistocytes Seen,Ovalocytes Seen,Elliptocytes Seen','input',
NULL,NULL,
'Peripheral Smear Examination',22,
NULL,
NULL,
false,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'WBC Morphology',NULL,'textarea','Normal Morphology,No Abnormal Cells Seen,Mature Neutrophils Seen,Reactive Lymphocytes Present,Left Shift Present,Toxic Granulation Present,Blast Cells Not Seen,Atypical Cells Not Seen,Eosinophilia Noted,Leukocytosis With Normal Morphology,Leukopenia With Normal Morphology','input',
NULL,NULL,
'Peripheral Smear Examination',23,
NULL,
NULL,
false,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'Platelet Morphology',NULL,'textarea','Adequate,Adequate In Number And Morphology,Platelets Reduced On Smear,Platelets Increased On Smear,Platelet Clumps Seen,Giant Platelets Present,Mild Thrombocytopenia,Moderate Thrombocytopenia,Severe Thrombocytopenia','input',
NULL,NULL,
'Peripheral Smear Examination',24,
NULL,
NULL,
false,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'MP',NULL,'textarea','Negative,Positive,Plasmodium vivax (PV),Plasmodium falciparum (PF),Mixed Infection (PV + PF),Rare Parasites Seen,Scanty Parasites Seen,Moderate Parasites Seen,Heavy Parasitemia','input',
NULL,NULL,
'Peripheral Smear Examination',25,
NULL,
NULL,
false,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'Impression',NULL,'textarea','Peripheral smear findings correlate with CBC parameters.,Peripheral smear shows normocytic normochromic red cells with normal leukocyte morphology and adequate platelets.,Peripheral smear shows microcytic hypochromic red cells suggestive of iron deficiency anemia. Correlate clinically.,Peripheral smear shows macrocytic red cells suggestive of megaloblastic anemia. Correlate clinically.,Peripheral smear shows anisopoikilocytosis. Clinical correlation advised.,No abnormal hemoparasites seen.,No abnormal cells seen on peripheral smear.','input',
NULL,NULL,
'Peripheral Smear Examination',26,
NULL,
NULL,
false,NOW(),NOW()),

-- LIVER FUNCTION TESTS (LFT-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='LFT-01'),
'Total Bilirubin','mg/dL','number',NULL,'input',
NULL,NULL,
'Serum Billirubin',1,
'{"min":0.2,"max":1.0}'::jsonb,NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='LFT-01'),
'Direct Bilirubin','mg/dL','number',NULL,'input',
NULL,NULL,
'Serum Billirubin',2,
'{"min":0.0,"max":0.8}'::jsonb,NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='LFT-01'),
'Indirect Bilirubin','mg/dL','number',NULL,'calculated',
'Total Bilirubin - Direct Bilirubin','Total Bilirubin,Direct Bilirubin',
'Serum Billirubin',3,
'{"min":0.0,"max":0.4}'::jsonb,NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='LFT-01'),
'S.G.P.T.','U/L','number',NULL,'input',
NULL,NULL,
'Enzymes',4,
'{"min":5.0,"max":40.0}'::jsonb,NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='LFT-01'),
'S.G.O.T.','U/L','number',NULL,'input',
NULL,NULL,
'Enzymes',5,
'{"min":5.0,"max":35.0}'::jsonb,NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='LFT-01'),
'S. Alkaline Phosphatase','U/L','number',NULL,'input',
NULL,NULL,
'Enzymes',6,
'{"male":{"min":25.0,"max":100.0},"female":{"min":25.0,"max":100.0},"pediatric":{"min":37.0,"max":147.0}}'::jsonb,NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='LFT-01'),
'Total Protein','gm/dL','number',NULL,'input',
NULL,NULL,
'Serum Proteins',7,
'{"min":6.0,"max":8.0}'::jsonb,NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='LFT-01'),
'Albumin','gm/dL','number',NULL,'input',
NULL,NULL,
'Serum Proteins',8,
'{"min":3.3,"max":5.5}'::jsonb,NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='LFT-01'),
'Globulin','gm/dL','number',NULL,'calculated',
'Total Protein - Albumin','Total Protein,Albumin',
'Serum Proteins',9,
'{"min":1.5,"max":3.8}'::jsonb,NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='LFT-01'),
'A : G Ratio',NULL,'number',NULL,'calculated',
'Albumin / Globulin','Albumin,Globulin',
'Serum Proteins',10,
'{"min":0.9,"max":2.0}'::jsonb,NULL,
true,NOW(),NOW()),

-- RENAL FUNCTION TESTS (KFT-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='KFT-01'),
'Blood Urea','mg/dL','number',NULL,'input',
NULL,NULL,
'Renal Function',1,
'{"min":10.0,"max":40.0}'::jsonb,NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='KFT-01'),
'Serum Creatinine','mg/dL','number',NULL,'input',
NULL,NULL,
'Renal Function',2,
'{"min":0.5,"max":1.3}'::jsonb,NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='KFT-01'),
'Urea/Creatinine Ratio',NULL,'number',NULL,'calculated',
'Blood Urea / Serum Creatinine','Blood Urea,Serum Creatinine',
'Renal Function',3,
'{"min":14.0,"max":24.0}'::jsonb,NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='KFT-01'),
'Serum Uric Acid','mg/dL','number',NULL,'input',
NULL,NULL,
'Renal Function',4,
'{"male":{"min":3.2,"max":7.0},"female":{"min":2.8,"max":6.0}}'::jsonb,NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='KFT-01'),
'Total Protein','gm/dL','number',NULL,'input',
NULL,NULL,
'Serum Proteins',5,
'{"min":6.0,"max":8.0}'::jsonb,NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='KFT-01'),
'Albumin','gm/dL','number',NULL,'input',
NULL,NULL,
'Serum Proteins',6,
'{"min":3.3,"max":5.5}'::jsonb,NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='KFT-01'),
'Globulin','gm/dL','number',NULL,'calculated',
'Total Protein - Albumin','Total Protein,Albumin',
'Serum Proteins',7,
'{"min":1.5,"max":3.8}'::jsonb,NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='KFT-01'),
'A/G Ratio',NULL,'number',NULL,'calculated',
'Albumin / Globulin','Albumin,Globulin',
'Serum Proteins',8,
'{"min":0.9,"max":2.0}'::jsonb,NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='KFT-01'),
'Serum Albumin-Creatinine Ratio','mg/g','number',NULL,'calculated',
'Albumin / Creatinine','Albumin,Creatinine',
'Renal Function',9,
'{"max":60.0}'::jsonb,NULL,
true,NOW(),NOW()),

-- LIPID PROFILE (LIPID-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='LIPID-01'),
'Serum Cholesterol','mg/dL','number',NULL,'input',
NULL,NULL,
'Lipid Values',1,
'{"min":0.0,"max":200.0}'::jsonb,NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='LIPID-01'),
'Serum Triglyceride','mg/dL','number',NULL,'input',
NULL,NULL,
'Lipid Values',2,
'{"min":0.0,"max":150.0}'::jsonb,NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='LIPID-01'),
'S. HDL Cholesterol','mg/dL','number',NULL,'input',
NULL,NULL,
'Lipid Values',3,
'{"min":40.0,"max":60.0}'::jsonb,NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='LIPID-01'),
'S. LDL Cholesterol','mg/dL','number',NULL,'calculated',
'Serum Cholesterol - S. HDL Cholesterol - (Serum Triglyceride / 5)',
'Serum Cholesterol,S. HDL Cholesterol,Serum Triglyceride',
'Lipid Values',4,
'{"min":0.0,"max":130.0}'::jsonb,NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='LIPID-01'),
'S. VLDL Cholesterol','mg/dL','number',NULL,'calculated',
'Serum Triglyceride / 5',
'Serum Triglyceride',
'Lipid Values',5,
'{"min":0.0,"max":34.0}'::jsonb,NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='LIPID-01'),
'LDL/HDL Ratio',NULL,'number',NULL,'calculated',
'S. LDL Cholesterol / S. HDL Cholesterol',
'S. LDL Cholesterol,S. HDL Cholesterol',
'Ratios',6,
'{"min":0.5,"max":3.0}'::jsonb,NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='LIPID-01'),
'Total Cholesterol/HDL',NULL,'number',NULL,'calculated',
'Serum Cholesterol / S. HDL Cholesterol',
'Serum Cholesterol,S. HDL Cholesterol',
'Ratios',7,
'{"min":3.3,"max":4.4}'::jsonb,NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='LIPID-01'),
'Total Lipids','mg/dL','number',NULL,'calculated',
'2.27 * Serum Cholesterol + Serum Triglyceride + 62.3',
'Serum Cholesterol,Serum Triglyceride',
'Lipid Values',8,
'{"min":400.0,"max":700.0}'::jsonb,NULL,
true,NOW(),NOW()),

-- PT PARAMETERS
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PT'),
'PT (Patient)','seconds','number',NULL,'input',
NULL,NULL,
'Prothrombin Time',1,
'{"min":11.0,"max":13.5}'::jsonb,
'{"low":7.0,"high":40.0}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PT'),
'PT (Control)','seconds','number',NULL,'input',
NULL,NULL,
'Prothrombin Time',2,
NULL,
NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PT'),
'INR','ratio','number',NULL,'calculated',
'(PT (Patient) / PT (Control))',
'PT (Patient),PT (Control)',
'Prothrombin Time',3,
'{"min":0.8,"max":1.2}'::jsonb,
'{"high":5.0}'::jsonb,
true,NOW(),NOW()),

-- APTT PARAMETERS
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='APTT'),
'APTT (Patient)','seconds','number',NULL,'input',
NULL,NULL,
'Activated Partial Thromboplastin Time',1,
'{"min":25.0,"max":35.0}'::jsonb,
'{"low":15.0,"high":100.0}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='APTT'),
'APTT (Control)','seconds','number',NULL,'input',
NULL,NULL,
'Activated Partial Thromboplastin Time',2,
NULL,
NULL,
true,NOW(),NOW()),

-- HbA1c (HBA1C-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='HBA1C-01'),
'HbA1c','%','number',NULL,'input',
NULL,NULL,
'Glycated Hemoglobin',1,
'{"min":4.0,"max":5.6}'::jsonb,
'{"high":15.0}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='HBA1C-01'),
'Estimated Average Glucose (eAG)','mg/dL','number',NULL,'calculated',
'(28.7 * HbA1c) - 46.7',
'HbA1c',
'Glycated Hemoglobin',2,
'{"min":68,"max":114}'::jsonb,
'{"high":300}'::jsonb,
false,NOW(),NOW()),

-- Malaria Antigen (MAL-AG-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='MAL-AG-01'),
'P. falciparum (HRP-2)',NULL,'select','Negative,Positive','input',
NULL,NULL,
'Malaria Antigen',1,
NULL,
'{"positive":"Positive"}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='MAL-AG-01'),
'P. vivax (pLDH)',NULL,'select','Negative,Positive','input',
NULL,NULL,
'Malaria Antigen',2,
NULL,
'{"positive":"Positive"}'::jsonb,
true,NOW(),NOW()),

-- Dengue NS1 rapid (DENGNS1-RAPID)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='DENGNS1-RAPID'),
'Dengue NS1 Antigen',NULL,'select','Negative,Positive','input',
NULL,NULL,
'Dengue Serology',1,
NULL,
'{"positive":"Positive"}'::jsonb,
true,NOW(),NOW()),

-- Dengue rapid (DENGUE-RAPID)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='DENGUE-RAPID'),
'Dengue NS1',NULL,'select','Negative,Positive','input',
NULL,NULL,
'Dengue Serology',1,
NULL,
'{"positive":"Positive"}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='DENGUE-RAPID'),
'Dengue IgM',NULL,'select','Negative,Positive','input',
NULL,NULL,
'Dengue Serology',2,
NULL,
'{"positive":"Positive"}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='DENGUE-RAPID'),
'Dengue IgG',NULL,'select','Negative,Positive','input',
NULL,NULL,
'Dengue Serology',3,
NULL,
'{"positive":"Positive"}'::jsonb,
true,NOW(),NOW()),

-- Total Protein (TP-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TP-01'),
'Total Protein','gm/dL','number',NULL,'input',
NULL,NULL,
'Total Protein',1,
'{"min":6.0,"max":8.0}'::jsonb,
'{"low":4.0,"high":10.0}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TP-01'),
'Albumin','gm/dL','number',NULL,'input',
NULL,NULL,
'Total Protein',2,
'{"min":3.3,"max":5.5}'::jsonb,
NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TP-01'),
'Globulin','gm/dL','number',NULL,'calculated',
'Total Protein - Albumin',
'Total Protein,Albumin',
'Total Protein',3,
'{"min":1.5,"max":3.8}'::jsonb,
NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TP-01'),
'A G Ratio',NULL,'number',NULL,'calculated',
'Albumin / Globulin',
'Albumin,Globulin',
'Total Protein',4,
'{"min":0.9,"max":2.0}'::jsonb,
NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TP-01'),
'Remarks',NULL,'textarea',NULL,'input',
NULL,NULL,
'Total Protein',5,
NULL,
NULL,
false,NOW(),NOW()),

-- HIV (HIV-01) - ELISA version (numeric, unit, reference range)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='HIV-01'),
'HIV I & II','S/CO','number',NULL,'input',
NULL,NULL,
'HIV Screening',1,
'{"min":0.00,"max":0.99}'::jsonb,
NULL,
true,NOW(),NOW()),

-- HBsAg (HBSAG-01) - ELISA version (numeric, unit, reference range)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='HBSAG-01'),
'HBsAg','S/CO','number',NULL,'input',
NULL,NULL,
'Hepatitis B Screening',1,
'{"min":0.00,"max":0.99}'::jsonb,
NULL,
true,NOW(),NOW()),

-- HCV (HCV-01) - ELISA version (numeric, unit, reference range)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='HCV-01'),
'Anti-HCV','S/CO','number',NULL,'input',
NULL,NULL,
'Hepatitis C Screening',1,
'{"min":0.00,"max":0.99}'::jsonb,
NULL,
true,NOW(),NOW()),

-- Chikungunya IgM (CHIK-IGM-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CHIK-IGM-01'),
'Chikungunya IgM',NULL,'select','Negative,Positive','input',
NULL,NULL,
'Chikungunya Serology',1,
NULL,
'{"positive":"Positive"}'::jsonb,
true,NOW(),NOW()),

-- URINE ALBUMIN/CREATININE RATIO (UACR-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='UACR-01'),
'Urine Albumin','mg/L','number',NULL,'input',
NULL,NULL,
'Urine ACR',1,
'{"min":0,"max":30}'::jsonb,
'{"high":300}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='UACR-01'),
'Urine Creatinine','mg/dL','number',NULL,'input',
NULL,NULL,
'Urine ACR',2,
'{"min":20,"max":320}'::jsonb,
NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='UACR-01'),
'Albumin/Creatinine Ratio (ACR)','mg/g','number',NULL,'calculated',
'(Urine Albumin / (Urine Creatinine * 10)) * 1000',
'Urine Albumin,Urine Creatinine',
'Urine ACR',3,
'{"min":0,"max":30}'::jsonb,
'{"high":300}'::jsonb,
true,NOW(),NOW()),

-- TORCH EVALUATION (TORCH-01)
-- Note: TORCH band cutoffs are kit-dependent placeholders
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TORCH-01'),
'Toxoplasma gondii IgG','Index','number',NULL,'input',
NULL,NULL,
'Toxoplasma',1,
'[{"age_group":"all","sex":"any","note":"Negative <0.8 | Equivocal 0.8–2.0 | Positive ≥2.0"}]'::jsonb,
NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TORCH-01'),
'Toxoplasma gondii IgM','Index','number',NULL,'input',
NULL,NULL,
'Toxoplasma',2,
'[{"age_group":"all","sex":"any","note":"Negative <0.8 | Equivocal 0.8–2.0 | Positive ≥2.0"}]'::jsonb,
NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TORCH-01'),
'Rubella IgG','Index','number',NULL,'input',
NULL,NULL,
'Rubella',3,
'[{"age_group":"all","sex":"any","note":"Negative <0.8 | Equivocal 0.8–2.0 | Positive ≥2.0"}]'::jsonb,
NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TORCH-01'),
'Rubella IgM','Index','number',NULL,'input',
NULL,NULL,
'Rubella',4,
'[{"age_group":"all","sex":"any","note":"Negative <0.8 | Equivocal 0.8–2.0 | Positive ≥2.0"}]'::jsonb,
NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TORCH-01'),
'CMV IgG','Index','number',NULL,'input',
NULL,NULL,
'CMV',5,
'[{"age_group":"all","sex":"any","note":"Negative <0.8 | Equivocal 0.8–2.0 | Positive ≥2.0"}]'::jsonb,
NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TORCH-01'),
'CMV IgM','Index','number',NULL,'input',
NULL,NULL,
'CMV',6,
'[{"age_group":"all","sex":"any","note":"Negative <0.8 | Equivocal 0.8–2.0 | Positive ≥2.0"}]'::jsonb,
NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TORCH-01'),
'HSV 1/2 IgG','Index','number',NULL,'input',
NULL,NULL,
'Herpes',7,
'[{"age_group":"all","sex":"any","note":"Negative <0.8 | Equivocal 0.8–2.0 | Positive ≥2.0"}]'::jsonb,
NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TORCH-01'),
'HSV 1/2 IgM','Index','number',NULL,'input',
NULL,NULL,
'Herpes',8,
'[{"age_group":"all","sex":"any","note":"Negative <0.8 | Equivocal 0.8–2.0 | Positive ≥2.0"}]'::jsonb,
NULL,
true,NOW(),NOW()),

-- HIV Rapid Test - HIV-RAPID-01
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='HIV-RAPID-01'),
'HIV Rapid',NULL,'select','Negative,Positive','input',
NULL,NULL,
'HIV Screening',1,
'[{"age_group":"all","sex":"any","note":"Negative"}]'::jsonb,
'{"positive":"Positive"}'::jsonb,
true,NOW(),NOW()),

-- HBsAg Rapid Test - HBSAG-RAPID-01
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='HBSAG-RAPID-01'),
'HBsAg Rapid',NULL,'select','Negative,Positive','input',
NULL,NULL,
'Hepatitis B Screening',1,
'[{"age_group":"all","sex":"any","note":"Negative"}]'::jsonb,
'{"positive":"Positive"}'::jsonb,
true,NOW(),NOW()),

-- Anti-HCV Rapid Test - HCV-RAPID-01
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='HCV-RAPID-01'),
'Anti-HCV Rapid',NULL,'select','Negative,Positive','input',
NULL,NULL,
'Hepatitis C Screening',1,
'[{"age_group":"all","sex":"any","note":"Negative"}]'::jsonb,
'{"positive":"Positive"}'::jsonb,
true,NOW(),NOW()),

-- RPR (Rapid Plasma Reagin) - RPR-01
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='RPR-01'),
'RPR (Qualitative)',NULL,'select','Negative,Positive','input',
NULL,NULL,
'Syphilis Screening',1,
NULL,
'{"positive":"Positive"}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='RPR-01'),
'RPR Titre (if Reactive)',NULL,'text',NULL,'input',
NULL,NULL,
'Syphilis Screening',2,
NULL,
NULL,
false,NOW(),NOW()),

-- TB GENE XPERT (Rapid TB) - TB-XPERT-01
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TB-XPERT-01'),
'MTB Detection',NULL,'select','Negative,Positive','input',
NULL,NULL,
'GeneXpert',1,
NULL,
'{"positive":"Positive"}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TB-XPERT-01'),
'Rifampicin Resistance',NULL,'select','Negative,Positive','input',
NULL,NULL,
'GeneXpert',2,
NULL,
'{"positive":"Positive"}'::jsonb,
false,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TB-XPERT-01'),
'Bacterial Load',NULL,'select','Negative,Positive','input',
NULL,NULL,
'GeneXpert',3,
NULL,
NULL,
false,NOW(),NOW()),

-- WIDAL TEST (WIDAL-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='WIDAL-01'), 'Salmonella typhi ''O'' (TO)', NULL, 'select', 'Negative,1:20,1:40,1:80,1:160,1:320,1:640', 'input', NULL, NULL, 'Widal Titers', 1, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='WIDAL-01'), 'Salmonella typhi ''H'' (TH)', NULL, 'select', 'Negative,1:20,1:40,1:80,1:160,1:320,1:640', 'input', NULL, NULL, 'Widal Titers', 2, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='WIDAL-01'), 'Salmonella paratyphi ''AH'' (AH)', NULL, 'select', 'Negative,1:20,1:40,1:80,1:160,1:320,1:640', 'input', NULL, NULL, 'Widal Titers', 3, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='WIDAL-01'), 'Salmonella paratyphi ''BH'' (BH)', NULL, 'select', 'Negative,1:20,1:40,1:80,1:160,1:320,1:640', 'input', NULL, NULL, 'Widal Titers', 4, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='WIDAL-01'), 'Method', NULL, 'select', 'Slide Agglutination,Tube Agglutination', 'input', NULL, NULL, 'Method', 5, NULL, NULL, true, NOW(), NOW()),

-- PERIPHERAL BLOOD SMEAR (PBS-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PBS-01'), 'RBC Morphology', NULL, 'text', NULL, 'input', NULL, NULL, 'Microscopic Findings', 1, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PBS-01'), 'WBC Morphology', NULL, 'text', NULL, 'input', NULL, NULL, 'Microscopic Findings', 2, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PBS-01'), 'Platelets', NULL, 'text', NULL, 'input', NULL, NULL, 'Microscopic Findings', 3, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PBS-01'), 'Hemoparasites', NULL, 'text', NULL, 'input', NULL, NULL, 'Microscopic Findings', 4, NULL, NULL, false, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PBS-01'), 'MP', NULL, 'textarea', 'Negative,Positive,Plasmodium vivax (PV),Plasmodium falciparum (PF),Mixed Infection (PV + PF),Rare Parasites Seen,Scanty Parasites Seen,Moderate Parasites Seen,Heavy Parasitemia', 'input', NULL, NULL, 'Microscopic Findings', 5, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PBS-01'), 'Impression', NULL, 'textarea', NULL, 'input', NULL, NULL, 'Impression', 6, NULL, NULL, true, NOW(), NOW()),

-- SERUM ELECTROLYTES (ELEC-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ELEC-01'), 'Serum Sodium (Na+)', 'mmol/L', 'number', NULL, 'input', NULL, NULL, 'Electrolytes', 1, '{"min":135,"max":145}'::jsonb, '{"low":120,"high":160}'::jsonb, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ELEC-01'), 'Serum Potassium (K+)', 'mmol/L', 'number', NULL, 'input', NULL, NULL, 'Electrolytes', 2, '{"min":3.5,"max":5.1}'::jsonb, '{"low":2.8,"high":6.2}'::jsonb, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ELEC-01'), 'Serum Chloride (Cl-)', 'mmol/L', 'number', NULL, 'input', NULL, NULL, 'Electrolytes', 3, '{"min":96,"max":106}'::jsonb, '{"low":80,"high":120}'::jsonb, true, NOW(), NOW()),

-- STOOL ROUTINE & MICROSCOPY (STOOL-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STOOL-01'), 'Quantity', 'gm', 'text', '10', 'input', NULL, NULL, 'Physical Examination', 1, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STOOL-01'), 'Color', NULL, 'select', 'Brownish,Yellowish,Creemish,Blackish,Reddish,Greenish', 'input', NULL, NULL, 'Physical Examination', 2, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STOOL-01'), 'Consistency', NULL, 'select', 'Semi-Solid,Liquid,Hard,Soft', 'input', NULL, NULL, 'Physical Examination', 3, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STOOL-01'), 'Adult Warm', NULL, 'select', 'Absent,Present', 'input', NULL, NULL, 'Physical Examination', 4, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STOOL-01'), 'Pus', NULL, 'select', 'Absent,Present', 'input', NULL, NULL, 'Physical Examination', 5, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STOOL-01'), 'Blood', NULL, 'select', 'Absent,Present', 'input', NULL, NULL, 'Physical Examination', 6, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STOOL-01'), 'Mucus', NULL, 'select', 'Absent,Present', 'input', NULL, NULL, 'Physical Examination', 7, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STOOL-01'), 'Parasites', NULL, 'select', 'Absent,Present', 'input', NULL, NULL, 'Physical Examination', 8, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STOOL-01'), 'Occult Blood', NULL, 'select', 'Negative,Positive', 'input', NULL, NULL, 'Chemical Examination', 9, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STOOL-01'), 'Reducing Sub.', NULL, 'select', 'Present,Absent', 'input', NULL, NULL, 'Chemical Examination', 10, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STOOL-01'), 'Reaction', NULL, 'select', 'Acidic,Alkaline,Neutral', 'input', NULL, NULL, 'Chemical Examination', 11, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STOOL-01'), 'Pus Cells', '/HPF', 'select', '1 - 2,2 - 4,3 - 5,6 - 8,8 - 10,15 - 20,20 - 40,30 - 50,40 - 60,60 - 80,80 - 100,OCCASIONAL,PLENTY', 'input', NULL, NULL, 'Microscopic Examination', 12, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STOOL-01'), 'RBCs', '/HPF', 'select', '1 - 2,2 - 4,3 - 5,6 - 8,8 - 10,15 - 20,20 - 40,30 - 50,40 - 60,60 - 80,80 - 100,OCCASIONAL,PLENTY', 'input', NULL, NULL, 'Microscopic Examination', 13, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STOOL-01'), 'Macrophages', '/HPF', 'select', 'Absent,Present', 'input', NULL, NULL, 'Microscopic Examination', 14, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STOOL-01'), 'Epithelial Cells', '/HPF', 'select', '1 - 2,2 - 4,3 - 5,6 - 8,8 - 10,15 - 20,20 - 40,30 - 50,40 - 60,60 - 80,80 - 100,OCCASIONAL,PLENTY', 'input', NULL, NULL, 'Microscopic Examination', 15, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STOOL-01'), 'Trophozoite', NULL, 'select', 'Absent,Present', 'input', NULL, NULL, 'Microscopic Examination', 16, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STOOL-01'), 'Ova', NULL, 'select', 'Absent,Present', 'input', NULL, NULL, 'Microscopic Examination', 17, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STOOL-01'), 'Bacteria', NULL, 'select', 'Present,Absent', 'input', NULL, NULL, 'Microscopic Examination', 18, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STOOL-01'), 'Muscle fibers', NULL, 'select', 'Absent,Present', 'input', NULL, NULL, 'Microscopic Examination', 19, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STOOL-01'), 'Vege. Cells', NULL, 'select', 'Absent,Present', 'input', NULL, NULL, 'Microscopic Examination', 20, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STOOL-01'), 'Fat Globules', NULL, 'select', 'Absent,Present,Fat Globules +,Fat Globules ++,Fat Globules +++,Fat Globules ++++', 'input', NULL, NULL, 'Microscopic Examination', 21, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STOOL-01'), 'Starch', NULL, 'select', 'Absent,Present', 'input', NULL, NULL, 'Microscopic Examination', 22, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STOOL-01'), 'Cysts', NULL, 'select', 'Absent,Present', 'input', NULL, NULL, 'Microscopic Examination', 23, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STOOL-01'), 'Larva', NULL, 'select', 'Absent,Present', 'input', NULL, NULL, 'Microscopic Examination', 24, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STOOL-01'), 'Ova (Concentration)', NULL, 'text', NULL, 'input', NULL, NULL, 'Concentration - Method', 25, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STOOL-01'), 'Cyst (Concentration)', NULL, 'text', NULL, 'input', NULL, NULL, 'Concentration - Method', 26, NULL, NULL, true, NOW(), NOW()),

-- HEMOGLOBIN (HB-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='HB-01'), 'Hemoglobin', 'g/dL', 'number', NULL, 'input', NULL, NULL, 'Hemoglobin', 1, '[{"age_min": 0, "age_max": 30, "age_max_unit": "days", "sex": "any", "low": 15.0, "high": 24.0, "note": "30 Days"}, {"age_min": 30, "age_min_unit": "days", "age_max": 2, "age_max_unit": "years", "sex": "any", "low": 10.5, "high": 14.0, "note": "2 Years"}, {"age_min": 2, "age_min_unit": "years", "age_max": 9, "age_max_unit": "years", "sex": "any", "low": 11.5, "high": 14.5, "note": "9 Years"}, {"age_min": 9, "age_min_unit": "years", "age_max": 17, "age_max_unit": "years", "sex": "female", "low": 12.0, "high": 15.0, "note": "17 Years"}, {"age_min": 9, "age_min_unit": "years", "age_max": 17, "age_max_unit": "years", "sex": "male", "low": 12.5, "high": 16.0, "note": "17 Years"}, {"age_min": 17, "age_min_unit": "years", "age_max": 110, "age_max_unit": "years", "sex": "female", "low": 12.0, "high": 16.0, "note": "ADULT"}, {"age_min": 17, "age_min_unit": "years", "age_max": 110, "age_max_unit": "years", "sex": "male", "low": 13.0, "high": 18.0, "note": "ADULT"}]'::jsonb, '{"low":7.0,"high":20.0}'::jsonb, true, NOW(), NOW()),

-- ABSOLUTE EOSINOPHIL COUNT (AEC-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='AEC-01'), 'Absolute Eosinophil Count (AEC)', '/uL', 'number', NULL, 'input', NULL, NULL, 'AEC', 1, '{"min":40,"max":440}'::jsonb, '{"high":1500}'::jsonb, true, NOW(), NOW()),

-- RETICULOCYTE COUNT (RETIC-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='RETIC-01'), 'Reticulocyte Count', '%', 'number', NULL, 'input', NULL, NULL, 'Reticulocyte Count', 1, '{"min":0.5,"max":2.5}'::jsonb, NULL, true, NOW(), NOW()),

-- MALARIA PARASITE SMEAR (MP-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='MP-01'), 'Malaria Parasite', NULL, 'select', 'Negative,Positive', 'input', NULL, NULL, 'Microscopic Findings', 1, NULL, '{"positive":"Positive"}'::jsonb, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='MP-01'), 'Microscopic Findings', NULL, 'text', NULL, 'input', NULL, NULL, 'Microscopic Findings', 2, NULL, NULL, false, NOW(), NOW()),

-- PLATELET COUNT (PLT-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PLT-01'), 'Platelet Count', '/uL', 'number', NULL, 'input', NULL, NULL, 'Platelet Count', 1, '{"min":150000,"max":450000}'::jsonb, '{"low":20000,"high":1000000}'::jsonb, true, NOW(), NOW()),

-- POST GLUCOSE BLOOD SUGAR (PGBS-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PGBS-01'), 'Post Glucose Blood Sugar', 'mg/dL', 'number', NULL, 'input', NULL, NULL, 'Blood Glucose', 1, '{"max":140}'::jsonb, '{"low":50,"high":400}'::jsonb, true, NOW(), NOW()),

-- SERUM UREA (UREA-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='UREA-01'), 'Serum Urea', 'mg/dL', 'number', NULL, 'input', NULL, NULL, 'Renal Function', 1, '{"min":10.0,"max":40.0}'::jsonb, '{"high":100.0}'::jsonb, true, NOW(), NOW()),

-- SERUM CREATININE (CREAT-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CREAT-01'), 'Serum Creatinine', 'mg/dL', 'number', NULL, 'input', NULL, NULL, 'Renal Function', 1, '{"min":0.5,"max":1.3}'::jsonb, '{"high":5.0}'::jsonb, true, NOW(), NOW()),

-- SERUM BILIRUBIN (BIL-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='BIL-01'), 'Total Bilirubin', 'mg/dL', 'number', NULL, 'input', NULL, NULL, 'Serum Bilirubin', 1, '{"min":0.2,"max":1.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='BIL-01'), 'Direct Bilirubin', 'mg/dL', 'number', NULL, 'input', NULL, NULL, 'Serum Bilirubin', 2, '{"min":0.0,"max":0.8}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='BIL-01'), 'Indirect Bilirubin', 'mg/dL', 'number', NULL, 'calculated', 'Total Bilirubin - Direct Bilirubin', 'Total Bilirubin,Direct Bilirubin', 'Serum Bilirubin', 3, '{"min":0.0,"max":0.4}'::jsonb, NULL, true, NOW(), NOW()),

-- SGPT (ALT) (SGPT-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='SGPT-01'), 'SGPT (ALT)', 'U/L', 'number', NULL, 'input', NULL, NULL, 'Enzymes', 1, '{"min":5.0,"max":40.0}'::jsonb, NULL, true, NOW(), NOW()),

-- SGOT (AST) (SGOT-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='SGOT-01'), 'SGOT (AST)', 'U/L', 'number', NULL, 'input', NULL, NULL, 'Enzymes', 1, '{"min":5.0,"max":35.0}'::jsonb, NULL, true, NOW(), NOW()),

-- ALKALINE PHOSPHATASE (ALP-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ALP-01'), 'Alkaline Phosphatase (ALP)', 'U/L', 'number', NULL, 'input', NULL, NULL, 'Enzymes', 1, '{"min":25.0,"max":100.0}'::jsonb, NULL, true, NOW(), NOW()),

-- SERUM CHOLESTEROL (CHOL-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CHOL-01'), 'Serum Cholesterol', 'mg/dL', 'number', NULL, 'input', NULL, NULL, 'Lipids', 1, '{"max":200.0}'::jsonb, NULL, true, NOW(), NOW()),

-- SERUM TRIGLYCERIDES (TRIG-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TRIG-01'), 'Serum Triglycerides', 'mg/dL', 'number', NULL, 'input', NULL, NULL, 'Lipids', 1, '{"max":150.0}'::jsonb, NULL, true, NOW(), NOW()),

-- HDL CHOLESTEROL (HDL-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='HDL-01'), 'HDL Cholesterol', 'mg/dL', 'number', NULL, 'input', NULL, NULL, 'Lipids', 1, '{"min":40.0,"max":60.0}'::jsonb, NULL, true, NOW(), NOW()),

-- SPUTUM ROUTINE & MICROSCOPY (SPUTUM-RM)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='SPUTUM-RM'), 'Color', NULL, 'select', 'Purulent,Mucoid,Bloody,Watery', 'input', NULL, NULL, 'Macroscopic Examination', 1, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='SPUTUM-RM'), 'Appearance', NULL, 'select', 'Thick,Viscid,Thin', 'input', NULL, NULL, 'Macroscopic Examination', 2, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='SPUTUM-RM'), 'Pus Cells', '/HPF', 'number', NULL, 'input', NULL, NULL, 'Microscopic Examination', 3, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='SPUTUM-RM'), 'RBCs', '/HPF', 'number', NULL, 'input', NULL, NULL, 'Microscopic Examination', 4, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='SPUTUM-RM'), 'Gram Stain', NULL, 'text', NULL, 'input', NULL, NULL, 'Microscopic Examination', 5, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='SPUTUM-RM'), 'AFB Stain', NULL, 'select', 'Negative,Positive', 'input', NULL, NULL, 'Microscopic Examination', 6, NULL, '{"positive":"Positive"}'::jsonb, true, NOW(), NOW()),

-- MANTOUX TEST (MANTOUX-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='MANTOUX-01'), 'Date & Time of Injection', NULL, 'text', NULL, 'input', NULL, NULL, 'Procedure Details', 1, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='MANTOUX-01'), 'Date & Time of Reading', NULL, 'text', NULL, 'input', NULL, NULL, 'Procedure Details', 2, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='MANTOUX-01'), 'Induration', 'mm', 'number', NULL, 'input', NULL, NULL, 'Result', 3, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='MANTOUX-01'), 'Interpretation', NULL, 'select', 'Negative,Positive', 'input', NULL, NULL, 'Result', 4, NULL, '{"positive":"Positive"}'::jsonb, true, NOW(), NOW()),

-- TYPHIDOT (TYPHIDOT-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TYPHIDOT-01'), 'Typhidot IgM', NULL, 'select', 'Negative,Positive', 'input', NULL, NULL, 'Serology Findings', 1, NULL, '{"positive":"Positive"}'::jsonb, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TYPHIDOT-01'), 'Typhidot IgG', NULL, 'select', 'Negative,Positive', 'input', NULL, NULL, 'Serology Findings', 2, NULL, NULL, true, NOW(), NOW()),



-- BRUCELLA IgM (BRUC-IGM)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='BRUC-IGM'), 'Brucella IgM Antibody', 'Index', 'number', NULL, 'input', NULL, NULL, 'Brucella Serology', 1, '{"min":0.0,"max":0.9}'::jsonb, NULL, true, NOW(), NOW()),

-- BRUCELLA IgG (BRUC-IGG)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='BRUC-IGG'), 'Brucella IgG Antibody', 'Index', 'number', NULL, 'input', NULL, NULL, 'Brucella Serology', 1, '{"min":0.0,"max":0.9}'::jsonb, NULL, true, NOW(), NOW()),

-- APLA / APLZ PROFILE (APLA-PRO)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='APLA-PRO'), 'Lupus Anticoagulant (LA1 - Screen)', 'seconds', 'number', NULL, 'input', NULL, NULL, 'Lupus Anticoagulant', 1, '{"min":30.0,"max":45.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='APLA-PRO'), 'Lupus Anticoagulant (LA2 - Confirm)', 'seconds', 'number', NULL, 'input', NULL, NULL, 'Lupus Anticoagulant', 2, '{"min":30.0,"max":40.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='APLA-PRO'), 'Lupus Anticoagulant Ratio (LA1/LA2)', 'ratio', 'number', NULL, 'calculated', '(Lupus Anticoagulant (LA1 - Screen) / Lupus Anticoagulant (LA2 - Confirm))', 'Lupus Anticoagulant (LA1 - Screen),Lupus Anticoagulant (LA2 - Confirm)', 'Lupus Anticoagulant', 3, '{"min":0.8,"max":1.2}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='APLA-PRO'), 'Anti-Cardiolipin IgG', 'GPL', 'number', NULL, 'input', NULL, NULL, 'Cardiolipin Antibodies', 4, '{"min":0.0,"max":10.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='APLA-PRO'), 'Anti-Cardiolipin IgM', 'MPL', 'number', NULL, 'input', NULL, NULL, 'Cardiolipin Antibodies', 5, '{"min":0.0,"max":10.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='APLA-PRO'), 'Anti-Beta-2 Glycoprotein I IgG', 'U/mL', 'number', NULL, 'input', NULL, NULL, 'Beta-2 Glycoprotein I Antibodies', 6, '{"min":0.0,"max":20.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='APLA-PRO'), 'Anti-Beta-2 Glycoprotein I IgM', 'U/mL', 'number', NULL, 'input', NULL, NULL, 'Beta-2 Glycoprotein I Antibodies', 7, '{"min":0.0,"max":20.0}'::jsonb, NULL, true, NOW(), NOW()),

-- DOUBLE MARKER TEST (DBLM-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='DBLM-01'), 'Free Beta HCG', 'ng/mL', 'number', NULL, 'input', NULL, NULL, 'Biochemical Markers', 1, '{"min":20.0,"max":100.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='DBLM-01'), 'Free Beta HCG MoM', 'MoM', 'number', NULL, 'input', NULL, NULL, 'Biochemical Markers', 2, '{"min":0.5,"max":2.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='DBLM-01'), 'PAPP-A', 'mIU/L', 'number', NULL, 'input', NULL, NULL, 'Biochemical Markers', 3, '{"min":1000.0,"max":5000.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='DBLM-01'), 'PAPP-A MoM', 'MoM', 'number', NULL, 'input', NULL, NULL, 'Biochemical Markers', 4, '{"min":0.5,"max":2.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='DBLM-01'), 'Nuchal Translucency (NT) MoM', 'MoM', 'number', NULL, 'input', NULL, NULL, 'Biochemical Markers', 5, '{"min":0.5,"max":2.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='DBLM-01'), 'Down Syndrome (Trisomy 21) Risk', 'ratio', 'text', NULL, 'input', NULL, NULL, 'Risk Calculation', 6, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='DBLM-01'), 'Edwards/Patau Syndrome (Trisomy 18/13) Risk', 'ratio', 'text', NULL, 'input', NULL, NULL, 'Risk Calculation', 7, NULL, NULL, true, NOW(), NOW()),

-- TRIPLE MARKER TEST (TRPM-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TRPM-01'), 'Maternal AFP', 'ng/mL', 'number', NULL, 'input', NULL, NULL, 'Biochemical Markers', 1, '{"min":10.0,"max":50.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TRPM-01'), 'Maternal AFP MoM', 'MoM', 'number', NULL, 'input', NULL, NULL, 'Biochemical Markers', 2, '{"min":0.5,"max":2.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TRPM-01'), 'Total HCG', 'mIU/mL', 'number', NULL, 'input', NULL, NULL, 'Biochemical Markers', 3, '{"min":5000.0,"max":50000.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TRPM-01'), 'Total HCG MoM', 'MoM', 'number', NULL, 'input', NULL, NULL, 'Biochemical Markers', 4, '{"min":0.5,"max":2.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TRPM-01'), 'Unconjugated Estriol (uE3)', 'ng/mL', 'number', NULL, 'input', NULL, NULL, 'Biochemical Markers', 5, '{"min":0.5,"max":4.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TRPM-01'), 'Unconjugated Estriol MoM', 'MoM', 'number', NULL, 'input', NULL, NULL, 'Biochemical Markers', 6, '{"min":0.5,"max":2.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TRPM-01'), 'Down Syndrome (Trisomy 21) Risk', 'ratio', 'text', NULL, 'input', NULL, NULL, 'Risk Calculation', 7, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TRPM-01'), 'Edwards/Patau Syndrome (Trisomy 18/13) Risk', 'ratio', 'text', NULL, 'input', NULL, NULL, 'Risk Calculation', 8, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TRPM-01'), 'Neural Tube Defects (NTD) Risk', 'ratio', 'text', NULL, 'input', NULL, NULL, 'Risk Calculation', 9, NULL, NULL, true, NOW(), NOW()),

-- RUBELLA IgG (RUB-IGG)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='RUB-IGG'), 'Rubella IgG Antibody', 'IU/mL', 'number', NULL, 'input', NULL, NULL, 'Rubella Serology', 1, '{"min":10.0,"max":500.0}'::jsonb, NULL, true, NOW(), NOW()),

-- RUBELLA IgM (RUB-IGM)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='RUB-IGM'), 'Rubella IgM Antibody', 'Index', 'number', NULL, 'input', NULL, NULL, 'Rubella Serology', 1, '{"min":0.0,"max":0.9}'::jsonb, NULL, true, NOW(), NOW()),

-- CRP (C-REACTIVE PROTEIN) (CRP-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CRP-01'), 'C-Reactive Protein', 'mg/L', 'number', NULL, 'input', NULL, NULL, 'Inflammation Markers', 1, '{"min":0.0,"max":6.0}'::jsonb, NULL, true, NOW(), NOW()),

-- GTT (GLUCOSE TOLERANCE TEST) (GTT-01)
-- Fasting
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='GTT-01'), 'Fasting Blood Glucose', 'mg/dl', 'number', NULL, 'input', NULL, NULL, 'Fasting', 1, '{"min":70.0,"max":110.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='GTT-01'), 'Urine Glucose (Fasting)', 'gm/dl', 'select', 'Absent,Trace,Present +,Present ++,Present +++', 'input', NULL, NULL, 'Fasting', 2, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='GTT-01'), 'Urine Acetone (Fasting)', 'mg/dl', 'select', 'Absent,Trace,Present +,Present ++,Present +++', 'input', NULL, NULL, 'Fasting', 3, NULL, NULL, true, NOW(), NOW()),
-- 1st Hour
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='GTT-01'), '1st Hour Blood Glucose', 'mg/dl', 'number', NULL, 'input', NULL, NULL, '1st Hour', 4, '{"min":120.0,"max":170.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='GTT-01'), 'Urine Glucose (1st Hour)', 'gm/dl', 'select', 'Absent,Trace,Present +,Present ++,Present +++', 'input', NULL, NULL, '1st Hour', 5, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='GTT-01'), 'Urine Acetone (1st Hour)', 'mg/dl', 'select', 'Absent,Trace,Present +,Present ++,Present +++', 'input', NULL, NULL, '1st Hour', 6, NULL, NULL, true, NOW(), NOW()),
-- 2nd Hour
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='GTT-01'), '2nd Hour Blood Glucose', 'mg/dl', 'number', NULL, 'input', NULL, NULL, '2nd Hour', 7, '{"min":80.0,"max":120.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='GTT-01'), 'Urine Glucose (2nd Hour)', 'gm/dl', 'select', 'Absent,Trace,Present +,Present ++,Present +++', 'input', NULL, NULL, '2nd Hour', 8, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='GTT-01'), 'Urine Acetone (2nd Hour)', 'mg/dl', 'select', 'Absent,Trace,Present +,Present ++,Present +++', 'input', NULL, NULL, '2nd Hour', 9, NULL, NULL, true, NOW(), NOW()),

-- FBS (FASTING BLOOD SUGAR) (FBS-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='FBS-01'), 'Fasting Blood Sugar', 'mg/dL', 'number', NULL, 'input', NULL, NULL, Null, 1, '{"min":70.0,"max":110.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='FBS-01'), 'Urine Glucose', NULL, 'select', 'Absent,Trace,Present +,Present ++,Present +++', 'input', NULL, NULL, NULL, 2, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='FBS-01'), 'Urine Ketone', NULL, 'select', 'Absent,Trace,Present +,Present ++,Present +++', 'input', NULL, NULL, NULL, 3, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='FBS-01'), 'Urine Protein', NULL, 'select', 'Absent,Trace,Present +,Present ++,Present +++', 'input', NULL, NULL, NULL, 4, NULL, NULL, true, NOW(), NOW()),

-- PPBS (POST PRANDIAL BLOOD SUGAR) (PPBS-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PPBS-01'), 'Post Prandial Blood Sugar', 'mg/dL', 'number', NULL, 'input', NULL, NULL, Null, 1, '{"min":70.0,"max":140.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PPBS-01'), 'Urine Glucose', NULL, 'select', 'Absent,Trace,Present +,Present ++,Present +++', 'input', NULL, NULL, NULL, 2, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PPBS-01'), 'Urine Ketone', NULL, 'select', 'Absent,Trace,Present +,Present ++,Present +++', 'input', NULL, NULL, NULL, 3, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PPBS-01'), 'Urine Protein', NULL, 'select', 'Absent,Trace,Present +,Present ++,Present +++', 'input', NULL, NULL, NULL, 4, NULL, NULL, true, NOW(), NOW()),

-- RBS (RANDOM BLOOD SUGAR) (RBS-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='RBS-01'), 'Random Blood Sugar', 'mg/dL', 'number', NULL, 'input', NULL, NULL, Null, 1, '{"min":70.0,"max":140.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='RBS-01'), 'Urine Glucose', NULL, 'select', 'Absent,Trace,Present +,Present ++,Present +++', 'input', NULL, NULL, NULL, 2, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='RBS-01'), 'Urine Ketone', NULL, 'select', 'Absent,Trace,Present +,Present ++,Present +++', 'input', NULL, NULL, NULL, 3, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='RBS-01'), 'Urine Protein', NULL, 'select', 'Absent,Trace,Present +,Present ++,Present +++', 'input', NULL, NULL, NULL, 4, NULL, NULL, true, NOW(), NOW()),

-- URINE ROUTINE EXAMINATION (URINE-01)
-- PHYSICAL
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='URINE-01'), 'Quantity', 'c.c.', 'number', '20', 'input', NULL, NULL, 'PHYSICAL', 1, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='URINE-01'), 'Colour', NULL, 'select', 'Pale Yellow,Yellow,Dark Yellow,Milky,Orange,Reddish Yellow,Deep Yellow,Colorless', 'input', NULL, NULL, 'PHYSICAL', 2, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='URINE-01'), 'Transparency', NULL, 'select', 'Clear,Slightly Turbid,Turbid,Cloudy', 'input', NULL, NULL, 'PHYSICAL', 3, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='URINE-01'), 'Deposite', NULL, 'select', 'Absent,Present', 'input', NULL, NULL, 'PHYSICAL', 4, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='URINE-01'), 'Reaction', NULL, 'select', 'Acidic,Alkaline,Neutral', 'input', NULL, NULL, 'PHYSICAL', 5, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='URINE-01'), 'Sp. Gravity', NULL, 'select', '1.015,1.010,1.020,1.025', 'input', NULL, NULL, 'PHYSICAL', 6, '{"min":1.005,"max":1.030}'::jsonb, NULL, true, NOW(), NOW()),

-- CHEMICAL
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='URINE-01'), 'Albumin', NULL, 'select', 'Absent,Trace,Present +,Present ++,Present +++,Present ++++', 'input', NULL, NULL, 'CHEMICAL', 7, '[{"age_group":"all","sex":"any","note":"Nil"}]'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='URINE-01'), 'Ketone', NULL, 'select', 'Absent,Trace,Present +,Present ++,Present +++,Present ++++', 'input', NULL, NULL, 'CHEMICAL', 8, '[{"age_group":"all","sex":"any","note":"Absent"}]'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='URINE-01'), 'Sugar', NULL, 'select', 'Absent,Trace,Present +,Present ++,Present +++,Present ++++', 'input', NULL, NULL, 'CHEMICAL', 9, '[{"age_group":"all","sex":"any","note":"Nil"}]'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='URINE-01'), 'Bile Salts', NULL, 'select', 'Negative,Positive', 'input', NULL, NULL, 'CHEMICAL', 10, '[{"age_group":"all","sex":"any","note":"Negative"}]'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='URINE-01'), 'Bile Pigments', NULL, 'select', 'Negative,Positive', 'input', NULL, NULL, 'CHEMICAL', 11, '[{"age_group":"all","sex":"any","note":"Negative"}]'::jsonb, NULL, true, NOW(), NOW()),

-- MICROSCOPIC
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='URINE-01'), 'Pus Cells', '/H.P.F.', 'select', '1 - 2,2 - 4,3 - 5,6 - 8,8 - 10,15 - 20,20 - 40,30 - 50,40 - 60,60 - 80,80 - 100,OCCASIONAL,PLENTY', 'input', NULL, NULL, 'MICROSCOPIC: ( After centrifugation at 2000 r.p.m. for 10 minutes )', 12, '{"min":0,"max":5}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='URINE-01'), 'Red Cells', '/H.P.F.', 'select', '1 - 2,2 - 4,3 - 5,6 - 8,8 - 10,15 - 20,20 - 40,30 - 50,40 - 60,60 - 80,80 - 100,OCCASIONAL,PLENTY', 'input', NULL, NULL, 'MICROSCOPIC: ( After centrifugation at 2000 r.p.m. for 10 minutes )', 13, '{"min":0,"max":2}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='URINE-01'), 'Epithelial Cells', '/H.P.F.', 'select', '1 - 2,2 - 4,3 - 5,6 - 8,8 - 10,15 - 20,20 - 40,30 - 50,40 - 60,60 - 80,80 - 100,OCCASIONAL,PLENTY', 'input', NULL, NULL, 'MICROSCOPIC: ( After centrifugation at 2000 r.p.m. for 10 minutes )', 14, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='URINE-01'), 'Casts', NULL, 'select', 'Absent,Hyaline,Granular,Cellular,Wbc Cast,Rbc Cast', 'input', NULL, NULL, 'MICROSCOPIC: ( After centrifugation at 2000 r.p.m. for 10 minutes )', 15, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='URINE-01'), 'Crystals', NULL, 'select', 'Absent,Calcium Oxalate,Uric Acid,Triple Phosphate,Calcium Monooxalate,Calcium Carbonate', 'input', NULL, NULL, 'MICROSCOPIC: ( After centrifugation at 2000 r.p.m. for 10 minutes )', 16, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='URINE-01'), 'Amorphous', NULL, 'select', 'Absent,Present', 'input', NULL, NULL, 'MICROSCOPIC: ( After centrifugation at 2000 r.p.m. for 10 minutes )', 17, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='URINE-01'), 'T. Vaginalis', NULL, 'select', 'Absent,Present', 'input', NULL, NULL, 'MICROSCOPIC: ( After centrifugation at 2000 r.p.m. for 10 minutes )', 18, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='URINE-01'), 'Bacteria', NULL, 'select', 'Absent,Present', 'input', NULL, NULL, 'MICROSCOPIC: ( After centrifugation at 2000 r.p.m. for 10 minutes )', 19, '[{"age_group":"all","sex":"any","note":"Absent"}]'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='URINE-01'), 'Budding Yeast', NULL, 'select', 'Absent,Present', 'input', NULL, NULL, 'MICROSCOPIC: ( After centrifugation at 2000 r.p.m. for 10 minutes )', 20, NULL, NULL, true, NOW(), NOW())

ON CONFLICT (test_id, field_name)
DO UPDATE SET
  unit = EXCLUDED.unit,
  input_type = EXCLUDED.input_type,
  options = EXCLUDED.options,
  field_type = EXCLUDED.field_type,
  formula = EXCLUDED.formula,
  depends_on = EXCLUDED.depends_on,
  section_group = EXCLUDED.section_group,
  order_index = EXCLUDED.order_index,
  reference_rules = EXCLUDED.reference_rules,
  critical_rules = EXCLUDED.critical_rules,
  is_mandatory = EXCLUDED.is_mandatory,
  updated_at = NOW();

WITH template_fields (
  template_code,
  field_name,
  unit,
  min_value,
  max_value,
  input_type,
  options,
  order_index,
  field_type,
  formula,
  depends_on,
  section_group,
  reference_rules,
  critical_rules,
  interpretation_logic,
  is_mandatory
) AS (
  VALUES

  -- CBC, KFT, Lipid fields now seeded directly via migration 002 - New simplified structure
  -- Old template entries (CBC_EXTENDED, KFT_COMPREHENSIVE, LIPID_ADVANCED) removed per migration 003

  ('THYROID_COMPREHENSIVE', 'TSH', 'uIU/mL', 0.40, 4.50, 'number', NULL, 1, 'input', NULL, NULL, 'Thyroid | Hormones', NULL, '{"high":100,"low":0.01}'::jsonb, NULL, true),
  ('THYROID_COMPREHENSIVE', 'Total T3', 'ng/dL', 80.00, 200.00, 'number', NULL, 2, 'input', NULL, NULL, 'Thyroid | Hormones', NULL, NULL, NULL, true),
  ('THYROID_COMPREHENSIVE', 'Total T4', 'ug/dL', 4.60, 12.00, 'number', NULL, 3, 'input', NULL, NULL, 'Thyroid | Hormones', NULL, NULL, NULL, true),

  ('URINE_ROUTINE_COMPLETE', 'Color', NULL, NULL, NULL, 'select', 'Straw,Light yellow,Yellow,Dark yellow,Amber,Red,Brown,Black,Green', 1, 'input', NULL, NULL, 'Urine | Physical', NULL, NULL, NULL, true),
  ('URINE_ROUTINE_COMPLETE', 'Appearance', NULL, NULL, NULL, 'select', 'Clear,Slightly hazy,Turbid,Milky', 2, 'input', NULL, NULL, 'Urine | Physical', NULL, NULL, NULL, true),
  ('URINE_ROUTINE_COMPLETE', 'Specific Gravity', NULL, 1.005, 1.030, 'number', NULL, 3, 'input', NULL, NULL, 'Urine | Physical', NULL, NULL, NULL, true),
  ('URINE_ROUTINE_COMPLETE', 'pH', NULL, 4.50, 8.00, 'number', NULL, 4, 'input', NULL, NULL, 'Urine | Physical', NULL, NULL, NULL, true),
  ('URINE_ROUTINE_COMPLETE', 'Volume (24h if applicable)', 'mL', 800.00, 2000.00, 'number', NULL, 5, 'input', NULL, NULL, 'Urine | Physical', NULL, NULL, NULL, false),
  ('URINE_ROUTINE_COMPLETE', 'Protein', NULL, NULL, NULL, 'select', 'Negative,Trace,1+,2+,3+,4+', 6, 'input', NULL, NULL, 'Urine | Chemical', NULL, NULL, NULL, true),
  ('URINE_ROUTINE_COMPLETE', 'Glucose', NULL, NULL, NULL, 'select', 'Negative,Trace,1+,2+,3+,4+', 7, 'input', NULL, NULL, 'Urine | Chemical', NULL, NULL, NULL, true),
  ('URINE_ROUTINE_COMPLETE', 'Ketone Bodies', NULL, NULL, NULL, 'select', 'Negative,Trace,1+,2+,3+', 8, 'input', NULL, NULL, 'Urine | Chemical', NULL, NULL, NULL, true),
  ('URINE_ROUTINE_COMPLETE', 'Blood/Hemoglobin', NULL, NULL, NULL, 'select', 'Negative,Trace,1+,2+,3+', 9, 'input', NULL, NULL, 'Urine | Chemical', NULL, NULL, NULL, true),
  ('URINE_ROUTINE_COMPLETE', 'Bilirubin', NULL, NULL, NULL, 'select', 'Negative,Positive', 10, 'input', NULL, NULL, 'Urine | Chemical', NULL, NULL, NULL, true),
  ('URINE_ROUTINE_COMPLETE', 'Urobilinogen', 'mg/dL', 0.20, 1.00, 'number', NULL, 11, 'input', NULL, NULL, 'Urine | Chemical', NULL, NULL, NULL, true),
  ('URINE_ROUTINE_COMPLETE', 'Nitrite', NULL, NULL, NULL, 'select', 'Negative,Positive', 12, 'input', NULL, NULL, 'Urine | Chemical', NULL, NULL, NULL, true),
  ('URINE_ROUTINE_COMPLETE', 'Leukocyte Esterase', NULL, NULL, NULL, 'select', 'Negative,Trace,1+,2+,3+', 13, 'input', NULL, NULL, 'Urine | Chemical', NULL, NULL, NULL, true),
  ('URINE_ROUTINE_COMPLETE', 'Ascorbic Acid Interference', NULL, NULL, NULL, 'select', 'Absent,Present', 14, 'input', NULL, NULL, 'Urine | Chemical', NULL, NULL, NULL, false),
  ('URINE_ROUTINE_COMPLETE', 'Pus Cells', '/HPF', NULL, NULL, 'select', '1 - 2,2 - 4,3 - 5,6 - 8,8 - 10,15 - 20,20 - 40,30 - 50,40 - 60,60 - 80,80 - 100,OCCASIONAL,PLENTY', 15, 'input', NULL, NULL, 'Urine | Microscopy', '[{"age_group":"all","sex":"any","note":"-"}]'::jsonb, NULL, NULL, true),
  ('URINE_ROUTINE_COMPLETE', 'RBCs', '/HPF', NULL, NULL, 'select', '1 - 2,2 - 4,3 - 5,6 - 8,8 - 10,15 - 20,20 - 40,30 - 50,40 - 60,60 - 80,80 - 100,OCCASIONAL,PLENTY', 16, 'input', NULL, NULL, 'Urine | Microscopy', '[{"age_group":"all","sex":"any","note":"-"}]'::jsonb, NULL, NULL, true),
  ('URINE_ROUTINE_COMPLETE', 'Epithelial Cells', '/HPF', NULL, NULL, 'select', '1 - 2,2 - 4,3 - 5,6 - 8,8 - 10,15 - 20,20 - 40,30 - 50,40 - 60,60 - 80,80 - 100,OCCASIONAL,PLENTY', 17, 'input', NULL, NULL, 'Urine | Microscopy', '[{"age_group":"all","sex":"any","note":"-"}]'::jsonb, NULL, NULL, true),
  ('URINE_ROUTINE_COMPLETE', 'Casts', NULL, NULL, NULL, 'select', 'None,Hyaline,Granular,Waxy,RBC cast,WBC cast', 18, 'input', NULL, NULL, 'Urine | Microscopy', NULL, NULL, NULL, true),
  ('URINE_ROUTINE_COMPLETE', 'Crystals', NULL, NULL, NULL, 'select', 'None,Uric acid,Calcium oxalate,Triple phosphate,Cystine,Amorphous', 19, 'input', NULL, NULL, 'Urine | Microscopy', NULL, NULL, NULL, true),
  ('URINE_ROUTINE_COMPLETE', 'Bacteria', NULL, NULL, NULL, 'select', 'Absent,Few,Moderate,Many', 20, 'input', NULL, NULL, 'Urine | Microscopy', NULL, NULL, NULL, true),
  ('URINE_ROUTINE_COMPLETE', 'Yeast Cells', NULL, NULL, NULL, 'select', 'Absent,Present', 21, 'input', NULL, NULL, 'Urine | Microscopy', NULL, NULL, NULL, true),
  ('URINE_ROUTINE_COMPLETE', 'Mucus Threads', NULL, NULL, NULL, 'select', 'Absent,Few,Moderate,Many', 22, 'input', NULL, NULL, 'Urine | Microscopy', NULL, NULL, NULL, false),
  ('URINE_ROUTINE_COMPLETE', 'Parasites', NULL, NULL, NULL, 'select', 'Absent,Present', 23, 'input', NULL, NULL, 'Urine | Microscopy', NULL, NULL, NULL, false),
  ('URINE_ROUTINE_COMPLETE', 'Method', NULL, NULL, NULL, 'text', NULL, 24, 'input', NULL, NULL, 'Urine | Method', NULL, NULL, NULL, true),
  ('URINE_ROUTINE_COMPLETE', 'Interpretation', NULL, NULL, NULL, 'textarea', NULL, 25, 'input', NULL, NULL, 'Urine | Interpretation', NULL, NULL, NULL, true),

  ('SEMEN_WHO_COMPLETE', 'Method of Collection', NULL, NULL, NULL, 'text', 'Self Manipulation', 1, 'input', NULL, NULL, 'SEMEN EXAMINATION', '[{"age_group":"all","sex":"any","note":"-"}]'::jsonb, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Period of Abstinence', NULL, 3.00, 7.00, 'number', '3', 2, 'input', NULL, NULL, 'SEMEN EXAMINATION', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Time of Collection', NULL, NULL, NULL, 'text', NULL, 3, 'input', NULL, NULL, 'SEMEN EXAMINATION', '[{"age_group":"all","sex":"any","note":"-"}]'::jsonb, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Time of Examination', NULL, NULL, NULL, 'text', NULL, 4, 'input', NULL, NULL, 'SEMEN EXAMINATION', '[{"age_group":"all","sex":"any","note":"-"}]'::jsonb, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Volume', 'ml', 5.00, 7.00, 'number', '5.5', 5, 'input', NULL, NULL, 'PHYSICAL EXAMINATION', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Color', NULL, NULL, NULL, 'select', 'Opalescent Grayish White,Yellowish', 6, 'input', NULL, NULL, 'PHYSICAL EXAMINATION', '[{"age_group":"all","sex":"any","note":"-"}]'::jsonb, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Reaction', NULL, NULL, NULL, 'select', 'Alkaline,Acidic,Neutral', 7, 'input', NULL, NULL, 'PHYSICAL EXAMINATION', '[{"age_group":"all","sex":"any","note":"-"}]'::jsonb, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Viscocity', NULL, NULL, NULL, 'select', 'Viscous,Low,Moderate,High,Liquified', 8, 'input', NULL, NULL, 'PHYSICAL EXAMINATION', '[{"age_group":"all","sex":"any","note":"-"}]'::jsonb, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Liquification Time', 'Minutes', NULL, 30.00, 'number', '15', 9, 'input', NULL, NULL, 'PHYSICAL EXAMINATION', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Total Sperm Count', 'Million/ml', 60.00, 300.00, 'number', NULL, 10, 'input', NULL, NULL, 'MICROSCOPIC EXAMINATION', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Motility Actively Motile', '%', 60.00, 100.00, 'number', NULL, 11, 'input', NULL, NULL, 'MICROSCOPIC EXAMINATION', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Sluggish Motile', '%', NULL, NULL, 'number', NULL, 12, 'input', NULL, NULL, 'MICROSCOPIC EXAMINATION', '[{"age_group":"all","sex":"any","note":"-"}]'::jsonb, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Non Motile', '%', NULL, NULL, 'number', NULL, 13, 'input', NULL, NULL, 'MICROSCOPIC EXAMINATION', '[{"age_group":"all","sex":"any","note":"-"}]'::jsonb, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Head defect', '%', NULL, 20.00, 'number', NULL, 14, 'input', NULL, NULL, 'MICROSCOPIC EXAMINATION', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Body defect', '%', NULL, NULL, 'number', NULL, 15, 'input', NULL, NULL, 'MICROSCOPIC EXAMINATION', '[{"age_group":"all","sex":"any","note":"-"}]'::jsonb, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'tail defect', '%', NULL, NULL, 'number', NULL, 16, 'input', NULL, NULL, 'MICROSCOPIC EXAMINATION', '[{"age_group":"all","sex":"any","note":"-"}]'::jsonb, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Linearity', 'Sec.', NULL, NULL, 'select', '00 - 10 Sec - excellent,11 - 15 Sec - Good,16 - 20 Sec - Average,> 20 Sec - Poor', 17, 'input', NULL, NULL, 'MICROSCOPIC EXAMINATION', '[{"age_group":"all","sex":"any","note":"00 - 10 Sec - excellent\n11 - 15 Sec - Good\n16 - 20 Sec - Average\n> 20 Sec - Poor"}]'::jsonb, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Pus Cells', '/HPF', NULL, NULL, 'select', '1 - 2,2 - 4,3 - 5,6 - 8,8 - 10,15 - 20,20 - 40,30 - 50,40 - 60,60 - 80,80 - 100,OCCASIONAL,PLENTY', 18, 'input', NULL, NULL, 'MICROSCOPIC EXAMINATION', '[{"age_group":"all","sex":"any","note":"-"}]'::jsonb, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'RBCs', '/HPF', NULL, NULL, 'select', '1 - 2,2 - 4,3 - 5,6 - 8,8 - 10,15 - 20,20 - 40,30 - 50,40 - 60,60 - 80,80 - 100,OCCASIONAL,PLENTY', 19, 'input', NULL, NULL, 'MICROSCOPIC EXAMINATION', '[{"age_group":"all","sex":"any","note":"-"}]'::jsonb, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Epithelial Cells', '/HPF', NULL, NULL, 'select', '1 - 2,2 - 4,3 - 5,6 - 8,8 - 10,15 - 20,20 - 40,30 - 50,40 - 60,60 - 80,80 - 100,OCCASIONAL,PLENTY', 20, 'input', NULL, NULL, 'MICROSCOPIC EXAMINATION', '[{"age_group":"all","sex":"any","note":"-"}]'::jsonb, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Fructose Test', NULL, NULL, NULL, 'select', 'Present,Absent', 21, 'input', NULL, NULL, 'MICROSCOPIC EXAMINATION', '[{"age_group":"all","sex":"any","note":"-"}]'::jsonb, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Auto Agglutination', NULL, NULL, NULL, 'select', 'Absent,Present', 22, 'input', NULL, NULL, 'MICROSCOPIC EXAMINATION', '[{"age_group":"all","sex":"any","note":"-"}]'::jsonb, NULL, NULL, true),

  ('CULTURE_COMPLETE', 'Specimen Type', NULL, NULL, NULL, 'text', NULL, 1, 'input', NULL, NULL, 'Culture | Specimen', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Collection Date-Time', NULL, NULL, NULL, 'datetime', NULL, 2, 'input', NULL, NULL, 'Culture | Specimen', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Received Date-Time', NULL, NULL, NULL, 'datetime', NULL, 3, 'input', NULL, NULL, 'Culture | Specimen', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Gram Stain', NULL, NULL, NULL, 'textarea', NULL, 4, 'input', NULL, NULL, 'Culture | Microscopy', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Pus Cells', '/HPF', 0.00, 5.00, 'number', NULL, 5, 'input', NULL, NULL, 'Culture | Microscopy', NULL, NULL, NULL, false),
  ('CULTURE_COMPLETE', 'Epithelial Cells', '/HPF', 0.00, 5.00, 'number', NULL, 6, 'input', NULL, NULL, 'Culture | Microscopy', NULL, NULL, NULL, false),
  ('CULTURE_COMPLETE', 'Growth', NULL, NULL, NULL, 'select', 'No growth,Scanty,Moderate,Heavy,Mixed growth', 7, 'input', NULL, NULL, 'Culture | Culture Findings', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Organism 1', NULL, NULL, NULL, 'text', NULL, 8, 'input', NULL, NULL, 'Culture | Culture Findings', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Colony Count', 'CFU/mL', 0.00, 99999999.99, 'number', NULL, 9, 'input', NULL, NULL, 'Culture | Culture Findings', NULL, NULL, NULL, false),
  ('CULTURE_COMPLETE', 'MDR/XDR Flag', NULL, NULL, NULL, 'select', 'No,Possible MDR,Confirmed MDR,Possible XDR,Confirmed XDR', 10, 'input', NULL, NULL, 'Culture | Culture Findings', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Ampicillin', NULL, NULL, NULL, 'select', 'Sensitive,Intermediate,Resistant', 11, 'input', NULL, NULL, 'Culture | Antibiotic Panel', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Amoxicillin-Clavulanate', NULL, NULL, NULL, 'select', 'Sensitive,Intermediate,Resistant', 12, 'input', NULL, NULL, 'Culture | Antibiotic Panel', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Piperacillin-Tazobactam', NULL, NULL, NULL, 'select', 'Sensitive,Intermediate,Resistant', 13, 'input', NULL, NULL, 'Culture | Antibiotic Panel', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Ceftriaxone', NULL, NULL, NULL, 'select', 'Sensitive,Intermediate,Resistant', 14, 'input', NULL, NULL, 'Culture | Antibiotic Panel', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Cefotaxime', NULL, NULL, NULL, 'select', 'Sensitive,Intermediate,Resistant', 15, 'input', NULL, NULL, 'Culture | Antibiotic Panel', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Ceftazidime', NULL, NULL, NULL, 'select', 'Sensitive,Intermediate,Resistant', 16, 'input', NULL, NULL, 'Culture | Antibiotic Panel', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Cefepime', NULL, NULL, NULL, 'select', 'Sensitive,Intermediate,Resistant', 17, 'input', NULL, NULL, 'Culture | Antibiotic Panel', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Ertapenem', NULL, NULL, NULL, 'select', 'Sensitive,Intermediate,Resistant', 18, 'input', NULL, NULL, 'Culture | Antibiotic Panel', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Imipenem', NULL, NULL, NULL, 'select', 'Sensitive,Intermediate,Resistant', 19, 'input', NULL, NULL, 'Culture | Antibiotic Panel', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Meropenem', NULL, NULL, NULL, 'select', 'Sensitive,Intermediate,Resistant', 20, 'input', NULL, NULL, 'Culture | Antibiotic Panel', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Amikacin', NULL, NULL, NULL, 'select', 'Sensitive,Intermediate,Resistant', 21, 'input', NULL, NULL, 'Culture | Antibiotic Panel', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Gentamicin', NULL, NULL, NULL, 'select', 'Sensitive,Intermediate,Resistant', 22, 'input', NULL, NULL, 'Culture | Antibiotic Panel', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Tobramycin', NULL, NULL, NULL, 'select', 'Sensitive,Intermediate,Resistant', 23, 'input', NULL, NULL, 'Culture | Antibiotic Panel', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Ciprofloxacin', NULL, NULL, NULL, 'select', 'Sensitive,Intermediate,Resistant', 24, 'input', NULL, NULL, 'Culture | Antibiotic Panel', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Levofloxacin', NULL, NULL, NULL, 'select', 'Sensitive,Intermediate,Resistant', 25, 'input', NULL, NULL, 'Culture | Antibiotic Panel', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Co-trimoxazole', NULL, NULL, NULL, 'select', 'Sensitive,Intermediate,Resistant', 26, 'input', NULL, NULL, 'Culture | Antibiotic Panel', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Nitrofurantoin', NULL, NULL, NULL, 'select', 'Sensitive,Intermediate,Resistant', 27, 'input', NULL, NULL, 'Culture | Antibiotic Panel', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Fosfomycin', NULL, NULL, NULL, 'select', 'Sensitive,Intermediate,Resistant', 28, 'input', NULL, NULL, 'Culture | Antibiotic Panel', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Linezolid', NULL, NULL, NULL, 'select', 'Sensitive,Intermediate,Resistant', 29, 'input', NULL, NULL, 'Culture | Antibiotic Panel', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Vancomycin', NULL, NULL, NULL, 'select', 'Sensitive,Intermediate,Resistant', 30, 'input', NULL, NULL, 'Culture | Antibiotic Panel', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Teicoplanin', NULL, NULL, NULL, 'select', 'Sensitive,Intermediate,Resistant', 31, 'input', NULL, NULL, 'Culture | Antibiotic Panel', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Clindamycin', NULL, NULL, NULL, 'select', 'Sensitive,Intermediate,Resistant', 32, 'input', NULL, NULL, 'Culture | Antibiotic Panel', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Erythromycin', NULL, NULL, NULL, 'select', 'Sensitive,Intermediate,Resistant', 33, 'input', NULL, NULL, 'Culture | Antibiotic Panel', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Colistin', NULL, NULL, NULL, 'select', 'Sensitive,Intermediate,Resistant', 34, 'input', NULL, NULL, 'Culture | Antibiotic Panel', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Tigecycline', NULL, NULL, NULL, 'select', 'Sensitive,Intermediate,Resistant', 35, 'input', NULL, NULL, 'Culture | Antibiotic Panel', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Oxacillin/Cefoxitin Screen', NULL, NULL, NULL, 'select', 'Sensitive,Intermediate,Resistant', 36, 'input', NULL, NULL, 'Culture | Resistant Phenotype', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'ESBL Screen', NULL, NULL, NULL, 'select', 'Negative,Positive', 37, 'input', NULL, NULL, 'Culture | Resistant Phenotype', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Carbapenemase Screen', NULL, NULL, NULL, 'select', 'Negative,Positive', 38, 'input', NULL, NULL, 'Culture | Resistant Phenotype', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'MIC Summary', NULL, NULL, NULL, 'textarea', NULL, 39, 'input', NULL, NULL, 'Culture | MIC', NULL, NULL, NULL, false),
  ('CULTURE_COMPLETE', 'Method', NULL, NULL, NULL, 'text', NULL, 40, 'input', NULL, NULL, 'Culture | Method', NULL, NULL, NULL, true),
  ('CULTURE_COMPLETE', 'Interpretation', NULL, NULL, NULL, 'textarea', NULL, 41, 'input', NULL, NULL, 'Culture | Interpretation', NULL, NULL, '{"rule":"Interpret using CLSI/EUCAST current breakpoints"}'::jsonb, true),

  ('HISTOPATH_STANDARD', 'Specimen Received', NULL, NULL, NULL, 'text', NULL, 1, 'input', NULL, NULL, 'Histopathology | Administrative', NULL, NULL, NULL, true),
  ('HISTOPATH_STANDARD', 'Clinical Details', NULL, NULL, NULL, 'textarea', NULL, 2, 'input', NULL, NULL, 'Histopathology | Administrative', NULL, NULL, NULL, true),
  ('HISTOPATH_STANDARD', 'Gross Description', NULL, NULL, NULL, 'textarea', NULL, 3, 'input', NULL, NULL, 'Histopathology | Gross', NULL, NULL, NULL, true),
  ('HISTOPATH_STANDARD', 'Specimen Size', NULL, NULL, NULL, 'text', NULL, 4, 'input', NULL, NULL, 'Histopathology | Gross', NULL, NULL, NULL, false),
  ('HISTOPATH_STANDARD', 'External Surface', NULL, NULL, NULL, 'textarea', NULL, 5, 'input', NULL, NULL, 'Histopathology | Gross', NULL, NULL, NULL, false),
  ('HISTOPATH_STANDARD', 'Cut Surface', NULL, NULL, NULL, 'textarea', NULL, 6, 'input', NULL, NULL, 'Histopathology | Gross', NULL, NULL, NULL, false),
  ('HISTOPATH_STANDARD', 'Microscopy', NULL, NULL, NULL, 'textarea', NULL, 7, 'input', NULL, NULL, 'Histopathology | Microscopy', NULL, NULL, NULL, true),
  ('HISTOPATH_STANDARD', 'Tumor Type', NULL, NULL, NULL, 'text', NULL, 8, 'input', NULL, NULL, 'Histopathology | Microscopy', NULL, NULL, NULL, false),
  ('HISTOPATH_STANDARD', 'Tumor Grade', NULL, NULL, NULL, 'text', NULL, 9, 'input', NULL, NULL, 'Histopathology | Microscopy', NULL, NULL, NULL, false),
  ('HISTOPATH_STANDARD', 'Lymphovascular Invasion', NULL, NULL, NULL, 'select', 'Absent,Present,Indeterminate', 10, 'input', NULL, NULL, 'Histopathology | Microscopy', NULL, NULL, NULL, false),
  ('HISTOPATH_STANDARD', 'Perineural Invasion', NULL, NULL, NULL, 'select', 'Absent,Present,Indeterminate', 11, 'input', NULL, NULL, 'Histopathology | Microscopy', NULL, NULL, NULL, false),
  ('HISTOPATH_STANDARD', 'Margin Status', NULL, NULL, NULL, 'select', 'Negative,Positive,Close', 12, 'input', NULL, NULL, 'Histopathology | Microscopy', NULL, NULL, NULL, false),
  ('HISTOPATH_STANDARD', 'Special Stains', NULL, NULL, NULL, 'textarea', NULL, 13, 'input', NULL, NULL, 'Histopathology | Ancillary', NULL, NULL, NULL, false),
  ('HISTOPATH_STANDARD', 'Immunohistochemistry', NULL, NULL, NULL, 'textarea', NULL, 14, 'input', NULL, NULL, 'Histopathology | Ancillary', NULL, NULL, NULL, false),
  ('HISTOPATH_STANDARD', 'Final Diagnosis', NULL, NULL, NULL, 'textarea', NULL, 15, 'input', NULL, NULL, 'Histopathology | Diagnosis', NULL, NULL, NULL, true),
  ('HISTOPATH_STANDARD', 'Differential Diagnosis', NULL, NULL, NULL, 'textarea', NULL, 16, 'input', NULL, NULL, 'Histopathology | Diagnosis', NULL, NULL, NULL, false),
  ('HISTOPATH_STANDARD', 'Pathological Stage (if applicable)', NULL, NULL, NULL, 'text', NULL, 17, 'input', NULL, NULL, 'Histopathology | Diagnosis', NULL, NULL, NULL, false),
  ('HISTOPATH_STANDARD', 'Synoptic Checklist', NULL, NULL, NULL, 'textarea', NULL, 18, 'input', NULL, NULL, 'Histopathology | Diagnosis', NULL, NULL, NULL, false),
  ('HISTOPATH_STANDARD', 'Comment', NULL, NULL, NULL, 'textarea', NULL, 19, 'input', NULL, NULL, 'Histopathology | Comment', NULL, NULL, NULL, false),
  ('HISTOPATH_STANDARD', 'Sign-out Pathologist', NULL, NULL, NULL, 'text', NULL, 20, 'input', NULL, NULL, 'Histopathology | Authorization', NULL, NULL, NULL, true),

  ('CYTOLOGY_BETHESDA', 'Specimen Adequacy', NULL, NULL, NULL, 'select', 'Satisfactory,Unsatisfactory', 1, 'input', NULL, NULL, 'Cytology | Specimen', NULL, NULL, NULL, true),
  ('CYTOLOGY_BETHESDA', 'Transformation Zone Component', NULL, NULL, NULL, 'select', 'Present,Absent', 2, 'input', NULL, NULL, 'Cytology | Specimen', NULL, NULL, NULL, false),
  ('CYTOLOGY_BETHESDA', 'General Categorization', NULL, NULL, NULL, 'select', 'Negative for intraepithelial lesion or malignancy,Other,Epithelial cell abnormality', 3, 'input', NULL, NULL, 'Cytology | Bethesda', NULL, NULL, NULL, true),
  ('CYTOLOGY_BETHESDA', 'Bethesda Interpretation', NULL, NULL, NULL, 'select', 'NILM,ASC-US,ASC-H,LSIL,HSIL,AGC,AIS,SCC,Adenocarcinoma', 4, 'input', NULL, NULL, 'Cytology | Bethesda', NULL, NULL, NULL, true),
  ('CYTOLOGY_BETHESDA', 'Infection', NULL, NULL, NULL, 'select', 'None,Trichomonas,Candida,Bacterial vaginosis,Actinomyces,HSV', 5, 'input', NULL, NULL, 'Cytology | Organisms', NULL, NULL, NULL, false),
  ('CYTOLOGY_BETHESDA', 'Reactive Cellular Changes', NULL, NULL, NULL, 'textarea', NULL, 6, 'input', NULL, NULL, 'Cytology | Findings', NULL, NULL, NULL, false),
  ('CYTOLOGY_BETHESDA', 'Atrophy', NULL, NULL, NULL, 'select', 'Absent,Present', 7, 'input', NULL, NULL, 'Cytology | Findings', NULL, NULL, NULL, false),
  ('CYTOLOGY_BETHESDA', 'Endometrial Cells (>45y)', NULL, NULL, NULL, 'select', 'Absent,Present', 8, 'input', NULL, NULL, 'Cytology | Findings', NULL, NULL, NULL, false),
  ('CYTOLOGY_BETHESDA', 'Microscopy', NULL, NULL, NULL, 'textarea', NULL, 9, 'input', NULL, NULL, 'Cytology | Microscopy', NULL, NULL, NULL, true),
  ('CYTOLOGY_BETHESDA', 'HPV Co-test', NULL, NULL, NULL, 'select', 'Not done,Negative,Positive 16/18,Positive other high-risk', 10, 'input', NULL, NULL, 'Cytology | Ancillary', NULL, NULL, NULL, false),
  ('CYTOLOGY_BETHESDA', 'Bethesda Recommendation', NULL, NULL, NULL, 'textarea', NULL, 11, 'input', NULL, NULL, 'Cytology | Recommendation', NULL, NULL, NULL, true),
  ('CYTOLOGY_BETHESDA', 'Final Cytology Diagnosis', NULL, NULL, NULL, 'textarea', NULL, 12, 'input', NULL, NULL, 'Cytology | Diagnosis', NULL, NULL, NULL, true),
  ('CYTOLOGY_BETHESDA', 'Method', NULL, NULL, NULL, 'text', NULL, 13, 'input', NULL, NULL, 'Cytology | Method', NULL, NULL, NULL, true),
  ('CYTOLOGY_BETHESDA', 'Sign-out Pathologist', NULL, NULL, NULL, 'text', NULL, 14, 'input', NULL, NULL, 'Cytology | Authorization', NULL, NULL, NULL, true),

  ('HORMONE_QUANT_INTERP', 'Result', NULL, NULL, NULL, 'number', NULL, 1, 'input', NULL, NULL, NULL, NULL, NULL, NULL, true),
  ('HORMONE_QUANT_INTERP', 'Unit', NULL, NULL, NULL, 'text', NULL, 2, 'input', NULL, NULL, NULL, NULL, NULL, NULL, true),
  ('HORMONE_QUANT_INTERP', 'Assay Method', NULL, NULL, NULL, 'text', NULL, 3, 'input', NULL, NULL, 'Hormone | Method', NULL, NULL, NULL, true),
  ('HORMONE_QUANT_INTERP', 'Biological Reference Interval', NULL, NULL, NULL, 'textarea', NULL, 4, 'input', NULL, NULL, 'Hormone | Reference', NULL, NULL, NULL, true),
  ('HORMONE_QUANT_INTERP', 'Clinical Interpretation', NULL, NULL, NULL, 'textarea', NULL, 5, 'input', NULL, NULL, 'Hormone | Interpretation', NULL, NULL, '{"rule":"Interpret by age, sex, menstrual phase, pregnancy and circadian rhythm"}'::jsonb, true),
  ('HORMONE_QUANT_INTERP', 'Recommendation', NULL, NULL, NULL, 'textarea', NULL, 6, 'input', NULL, NULL, 'Hormone | Interpretation', NULL, NULL, NULL, false),

  ('TUMOR_MARKER_QUANT_INTERP', 'Result', NULL, NULL, NULL, 'number', NULL, 1, 'input', NULL, NULL, NULL, NULL, NULL, NULL, true),
  ('TUMOR_MARKER_QUANT_INTERP', 'Unit', NULL, NULL, NULL, 'text', NULL, 2, 'input', NULL, NULL, NULL, NULL, NULL, NULL, true),
  ('TUMOR_MARKER_QUANT_INTERP', 'Method', NULL, NULL, NULL, 'text', NULL, 3, 'input', NULL, NULL, 'Tumor Marker | Method', NULL, NULL, NULL, true),
  ('TUMOR_MARKER_QUANT_INTERP', 'Decision Threshold', NULL, NULL, NULL, 'textarea', NULL, 4, 'input', NULL, NULL, 'Tumor Marker | Reference', NULL, NULL, NULL, true),
  ('TUMOR_MARKER_QUANT_INTERP', 'Interpretation', NULL, NULL, NULL, 'textarea', NULL, 5, 'input', NULL, NULL, 'Tumor Marker | Interpretation', NULL, NULL, '{"rule":"Use for trend monitoring and clinical-radiology correlation; not stand-alone diagnosis"}'::jsonb, true),
  ('TUMOR_MARKER_QUANT_INTERP', 'Recommendation', NULL, NULL, NULL, 'textarea', NULL, 6, 'input', NULL, NULL, 'Tumor Marker | Interpretation', NULL, NULL, NULL, false),

  ('SEROLOGY_METHOD_RESULT_INTERP', 'Method', NULL, NULL, NULL, 'text', NULL, 1, 'input', NULL, NULL, 'Serology | Method', NULL, NULL, NULL, true),
  ('SEROLOGY_METHOD_RESULT_INTERP', 'Result', NULL, NULL, NULL, 'text', NULL, 2, 'input', NULL, NULL, NULL, NULL, NULL, NULL, true),
  ('SEROLOGY_METHOD_RESULT_INTERP', 'Result Index/Cutoff', NULL, NULL, NULL, 'text', NULL, 3, 'input', NULL, NULL, NULL, NULL, NULL, NULL, false),
  ('SEROLOGY_METHOD_RESULT_INTERP', 'Interpretation', NULL, NULL, NULL, 'textarea', NULL, 4, 'input', NULL, NULL, 'Serology | Interpretation', NULL, NULL, '{"rule":"Interpret considering vaccination history, acute/convalescent windows and cross-reactivity"}'::jsonb, true),
  ('SEROLOGY_METHOD_RESULT_INTERP', 'Clinical Correlation', NULL, NULL, NULL, 'textarea', NULL, 5, 'input', NULL, NULL, 'Serology | Interpretation', NULL, NULL, NULL, false),
  ('SEROLOGY_METHOD_RESULT_INTERP', 'Repeat/Confirmatory Advice', NULL, NULL, NULL, 'textarea', NULL, 6, 'input', NULL, NULL, 'Serology | Interpretation', NULL, NULL, NULL, false),
  ('SEROLOGY_METHOD_RESULT_INTERP', 'Reviewed By', NULL, NULL, NULL, 'text', NULL, 7, 'input', NULL, NULL, 'Serology | Authorization', NULL, NULL, NULL, true),

  ('BASIC_QUANT_PANEL', 'Result', NULL, NULL, NULL, 'number', NULL, 1, 'input', NULL, NULL, NULL, NULL, NULL, NULL, true),
  ('BASIC_QUANT_PANEL', 'Unit', NULL, NULL, NULL, 'text', NULL, 2, 'input', NULL, NULL, NULL, NULL, NULL, NULL, true),
  ('BASIC_QUANT_PANEL', 'Reference Interval', NULL, NULL, NULL, 'text', NULL, 3, 'input', NULL, NULL, 'General | Reference', NULL, NULL, NULL, true),
  ('BASIC_QUANT_PANEL', 'Critical Value Policy', NULL, NULL, NULL, 'text', NULL, 4, 'input', NULL, NULL, 'General | Critical', NULL, NULL, NULL, true),
  ('BASIC_QUANT_PANEL', 'Interpretation', NULL, NULL, NULL, 'textarea', NULL, 5, 'input', NULL, NULL, 'General | Interpretation', NULL, NULL, NULL, true),

  ('GLUCOSE_TOLERANCE_PANEL', 'Fasting Glucose', 'mg/dL', 70.00, 99.00, 'number', NULL, 1, 'input', NULL, NULL, 'Glucose Tolerance | Values', NULL, '{"low":50,"high":400}'::jsonb, NULL, true),
  ('GLUCOSE_TOLERANCE_PANEL', '1 Hour Glucose', 'mg/dL', 0.00, 180.00, 'number', NULL, 2, 'input', NULL, NULL, 'Glucose Tolerance | Values', NULL, '{"high":450}'::jsonb, NULL, true),
  ('GLUCOSE_TOLERANCE_PANEL', '2 Hour Glucose', 'mg/dL', 0.00, 140.00, 'number', NULL, 3, 'input', NULL, NULL, 'Glucose Tolerance | Values', NULL, '{"high":450}'::jsonb, NULL, true),
  ('GLUCOSE_TOLERANCE_PANEL', 'AUC (Glucose)', 'mg*h/dL', 0.00, 1000.00, 'number', NULL, 4, 'calculated', '(Fasting Glucose + 1 Hour Glucose + 2 Hour Glucose)', 'Fasting Glucose,1 Hour Glucose,2 Hour Glucose', 'Glucose Tolerance | Calculated', NULL, NULL, NULL, true),
  ('GLUCOSE_TOLERANCE_PANEL', 'Diagnostic Category', NULL, NULL, NULL, 'text', NULL, 5, 'input', NULL, NULL, 'Glucose Tolerance | Interpretation', NULL, NULL, NULL, true),
  ('GLUCOSE_TOLERANCE_PANEL', 'Interpretation', NULL, NULL, NULL, 'textarea', NULL, 6, 'input', NULL, NULL, 'Glucose Tolerance | Interpretation', NULL, NULL, NULL, true),

  ('FLUID_ANALYSIS_PANEL', 'Color', NULL, NULL, NULL, 'text', NULL, 1, 'input', NULL, NULL, 'Fluid Analysis | Physical', NULL, NULL, NULL, true),
  ('FLUID_ANALYSIS_PANEL', 'Appearance', NULL, NULL, NULL, 'text', NULL, 2, 'input', NULL, NULL, 'Fluid Analysis | Physical', NULL, NULL, NULL, true),
  ('FLUID_ANALYSIS_PANEL', 'Specific Gravity', NULL, 1.005, 1.030, 'number', NULL, 3, 'input', NULL, NULL, 'Fluid Analysis | Physical', NULL, NULL, NULL, false),
  ('FLUID_ANALYSIS_PANEL', 'Protein', 'g/dL', 0.00, 3.00, 'number', NULL, 4, 'input', NULL, NULL, 'Fluid Analysis | Biochemical', NULL, NULL, NULL, true),
  ('FLUID_ANALYSIS_PANEL', 'Glucose', 'mg/dL', 40.00, 120.00, 'number', NULL, 5, 'input', NULL, NULL, 'Fluid Analysis | Biochemical', NULL, NULL, NULL, true),
  ('FLUID_ANALYSIS_PANEL', 'LDH', 'U/L', 0.00, 200.00, 'number', NULL, 6, 'input', NULL, NULL, 'Fluid Analysis | Biochemical', NULL, NULL, NULL, true),
  ('FLUID_ANALYSIS_PANEL', 'Cell Count Total', '/uL', 0.00, 5000.00, 'number', NULL, 7, 'input', NULL, NULL, 'Fluid Analysis | Cell Count', NULL, NULL, NULL, true),
  ('FLUID_ANALYSIS_PANEL', 'Polymorphs', '%', 0.00, 100.00, 'number', NULL, 8, 'input', NULL, NULL, 'Fluid Analysis | Differential', NULL, NULL, NULL, true),
  ('FLUID_ANALYSIS_PANEL', 'Lymphocytes', '%', 0.00, 100.00, 'number', NULL, 9, 'input', NULL, NULL, 'Fluid Analysis | Differential', NULL, NULL, NULL, true),
  ('FLUID_ANALYSIS_PANEL', 'RBC Count', '/uL', 0.00, 1000000.00, 'number', NULL, 10, 'input', NULL, NULL, 'Fluid Analysis | Cell Count', NULL, NULL, NULL, true),
  ('FLUID_ANALYSIS_PANEL', 'Gram Stain', NULL, NULL, NULL, 'textarea', NULL, 11, 'input', NULL, NULL, 'Fluid Analysis | Microscopy', NULL, NULL, NULL, true),
  ('FLUID_ANALYSIS_PANEL', 'AFB Stain', NULL, NULL, NULL, 'select', 'Negative,Positive', 12, 'input', NULL, NULL, 'Fluid Analysis | Microscopy', NULL, NULL, NULL, false),
  ('FLUID_ANALYSIS_PANEL', 'Culture', NULL, NULL, NULL, 'text', NULL, 13, 'input', NULL, NULL, 'Fluid Analysis | Culture', NULL, NULL, NULL, true),
  ('FLUID_ANALYSIS_PANEL', 'Cytology', NULL, NULL, NULL, 'textarea', NULL, 14, 'input', NULL, NULL, 'Fluid Analysis | Cytology', NULL, NULL, NULL, false),
  ('FLUID_ANALYSIS_PANEL', 'Interpretation', NULL, NULL, NULL, 'textarea', NULL, 15, 'input', NULL, NULL, 'Fluid Analysis | Interpretation', NULL, NULL, NULL, true),
  ('FLUID_ANALYSIS_PANEL', 'Method', NULL, NULL, NULL, 'text', NULL, 16, 'input', NULL, NULL, 'Fluid Analysis | Method', NULL, NULL, NULL, true),

  ('TB_XPERT_PANEL', 'MTB Detected', NULL, NULL, NULL, 'select', 'Detected,Not Detected,Invalid', 1, 'input', NULL, NULL, 'GeneXpert | MTB', NULL, NULL, NULL, true),
  ('TB_XPERT_PANEL', 'Rifampicin Resistance', NULL, NULL, NULL, 'select', 'Detected,Not Detected,Indeterminate,NA', 2, 'input', NULL, NULL, 'GeneXpert | Resistance', NULL, NULL, NULL, true),
  ('TB_XPERT_PANEL', 'Semi-Quantitative Category', NULL, NULL, NULL, 'select', 'High,Medium,Low,Very low,Trace,NA', 3, 'input', NULL, NULL, 'GeneXpert | Load', NULL, NULL, NULL, true),
  ('TB_XPERT_PANEL', 'Internal Control', NULL, NULL, NULL, 'select', 'Pass,Fail', 4, 'input', NULL, NULL, 'GeneXpert | Quality', NULL, NULL, NULL, true),
  ('TB_XPERT_PANEL', 'Sample Processing Control', NULL, NULL, NULL, 'select', 'Pass,Fail', 5, 'input', NULL, NULL, 'GeneXpert | Quality', NULL, NULL, NULL, true),
  ('TB_XPERT_PANEL', 'Method', NULL, NULL, NULL, 'text', NULL, 6, 'input', NULL, NULL, 'GeneXpert | Method', NULL, NULL, NULL, true),
  ('TB_XPERT_PANEL', 'Interpretation', NULL, NULL, NULL, 'textarea', NULL, 7, 'input', NULL, NULL, 'GeneXpert | Interpretation', NULL, NULL, NULL, true),
  ('TB_XPERT_PANEL', 'Repeat Advice', NULL, NULL, NULL, 'textarea', NULL, 8, 'input', NULL, NULL, 'GeneXpert | Interpretation', NULL, NULL, NULL, false),

  ('BLOOD_GROUP_PANEL', 'ABO Group', NULL, NULL, NULL, 'select', 'A,B,AB,O', 1, 'input', NULL, NULL, 'Blood Group | Typing', NULL, NULL, NULL, true),
  ('BLOOD_GROUP_PANEL', 'Rh(D)', NULL, NULL, NULL, 'select', 'Positive,Negative,Weak D', 2, 'input', NULL, NULL, 'Blood Group | Typing', NULL, NULL, NULL, true),
  ('BLOOD_GROUP_PANEL', 'Result Remark', NULL, NULL, NULL, 'text', NULL, 3, 'input', NULL, NULL, 'Blood Group | Typing', NULL, NULL, NULL, false),

  ('SINGLE_ANALYTE_NUMERIC', 'Result', NULL, NULL, NULL, 'number', NULL, 1, 'input', NULL, NULL, NULL, NULL, NULL, NULL, true),
  ('SINGLE_ANALYTE_QUALITATIVE', 'Result', NULL, NULL, NULL, 'select', 'Negative,Positive,Reactive,Non Reactive,Detected,Not Detected,Normal,Abnormal,Trace', 1, 'input', NULL, NULL, NULL, NULL, NULL, NULL, true)
),
test_panel_map AS (
  SELECT
    t.id AS test_id,
    t.test_code,
    t.test_name,
    CASE
      WHEN t.test_code = 'THYPRO-01' THEN 'THYROID_COMPREHENSIVE'
      WHEN t.test_code = 'URINE-01' THEN 'URINE_ROUTINE_COMPLETE'
      WHEN t.test_code = 'SEMEN-01' THEN 'SEMEN_WHO_COMPLETE'
      WHEN t.test_code IN ('UCULT-01', 'BCULT-01', 'SCULT-01', 'SPCULT-01', 'PCULT-01', 'TCULT-01', 'FCULT-01', 'TBCULT-01') THEN 'CULTURE_COMPLETE'
      WHEN t.test_code IN ('BIOPSY-01', 'BM-01') THEN 'HISTOPATH_STANDARD'
      WHEN t.test_code IN ('FNAC-01', 'PAP-01') THEN 'CYTOLOGY_BETHESDA'
      WHEN t.test_code = 'GTT-01' THEN 'GLUCOSE_TOLERANCE_PANEL'
      WHEN t.test_code IN ('CSF-01', 'PLEURAL-01', 'ASCITIC-01', 'JOINT-01') THEN 'FLUID_ANALYSIS_PANEL'
      WHEN t.test_code = 'BG-01' THEN 'BLOOD_GROUP_PANEL'
      WHEN t.category = 'Serology' THEN 'SINGLE_ANALYTE_QUALITATIVE'
      ELSE 'SINGLE_ANALYTE_NUMERIC'
    END AS template_code
  FROM tests t
  WHERE t.test_code NOT IN ('CBC-01', 'LFT-01', 'KFT-01', 'LIPID-01', 'PT', 'APTT', 'HBA1C-01', 'MAL-AG-01', 'TP-01', 'HIV-01', 'HBSAG-01', 'HCV-01', 'CHIK-IGM-01', 'UACR-01', 'TORCH-01', 'HIV-RAPID-01', 'RPR-01', 'TB-XPERT-01', 'DENGUE-01', 'DENGUE-RAPID', 'DENGNS1-RAPID', 'DENGNS1-01', 'DENGIGG-01', 'HBSAG-RAPID-01', 'HCV-RAPID-01', 'HB-01', 'AEC-01', 'RETIC-01', 'MP-01', 'PLT-01', 'PGBS-01', 'UREA-01', 'CREAT-01', 'BIL-01', 'SGPT-01', 'SGOT-01', 'ALP-01', 'CHOL-01', 'TRIG-01', 'HDL-01', 'SPUTUM-RM', 'MANTOUX-01', 'TYPHIDOT-01', 'WIDAL-01', 'PBS-01', 'ELEC-01', 'STOOL-01', 'BRUC-IGM', 'BRUC-IGG', 'APLA-PRO', 'DBLM-01', 'TRPM-01', 'RUB-IGG', 'RUB-IGM', 'GTT-01', 'CRP-01', 'FBS-01', 'PPBS-01', 'RBS-01', 'URINE-01')
),
test_parameters_override(test_code, field_name_override, unit_override, min_val, max_val) AS (
  VALUES
    ('TSH-01', 'TSH', 'uIU/mL', 0.40, 4.50),
    ('FT3-01', 'Free T3', 'pg/mL', 2.00, 4.40),
    ('FT4-01', 'Free T4', 'ng/dL', 0.80, 1.80),
    ('T3-01', 'Total T3', 'ng/dL', 80.00, 200.00),
    ('T4-01', 'Total T4', 'ug/dL', 4.60, 12.00),
    ('PSA-01', 'PSA', 'ng/mL', 0.00, 4.00),
    ('FREE-PSA-01', 'Free PSA', 'ng/mL', 0.00, 0.50),
    ('PTH-01', 'PTH', 'pg/mL', 15.00, 65.00),
    ('CORT-AM-01', 'Cortisol', 'ug/dL', 6.00, 23.00),
    ('CORT-PM-01', 'Cortisol', 'ug/dL', 3.00, 12.00),
    ('CORT-RAND-01', 'Cortisol', 'ug/dL', 3.00, 16.00),
    ('ESR-01', 'ESR', 'mm/hr', 0.00, 15.00),
    ('BT-01', 'Bleeding Time', 'minutes', 2.00, 7.00),
    ('CT-01', 'Clotting Time', 'minutes', 5.00, 11.00),
    ('FIBR-01', 'Fibrinogen', 'mg/dL', 200.00, 400.00),
    ('DD-01', 'D-Dimer', 'ng/mL', 0.00, 500.00),
    ('CALC-01', 'Serum Calcium', 'mg/dL', 8.80, 10.20),
    ('PHOS-01', 'Serum Phosphorus', 'mg/dL', 2.50, 4.50),
    ('MAG-01', 'Serum Magnesium', 'mg/dL', 1.70, 2.20),
    ('AMYL-01', 'Serum Amylase', 'U/L', 28.00, 100.00),
    ('LIPAS-01', 'Serum Lipase', 'U/L', 0.00, 160.00),
    ('INS-F-01', 'Fasting Insulin', 'uIU/mL', 2.60, 24.90),
    ('CPEP-01', 'C-Peptide', 'ng/mL', 1.10, 4.40),
    ('MALB-01', 'Urine Microalbumin', 'mg/L', 0.00, 20.00),
    ('ATPO-01', 'Anti-TPO', 'IU/mL', 0.00, 34.00),
    ('ATG-01', 'Anti-Thyroglobulin', 'IU/mL', 0.00, 115.00),
    ('TG-01', 'Thyroglobulin', 'ng/mL', 1.40, 78.00),
    ('FSH-01', 'FSH', 'mIU/mL', 1.50, 12.40),
    ('LH-01', 'LH', 'mIU/mL', 1.70, 8.60),
    ('PROL-01', 'Prolactin', 'ng/mL', 4.00, 23.00),
    ('TEST-01', 'Testosterone', 'ng/dL', 240.00, 870.00),
    ('FTEST-01', 'Free Testosterone', 'pg/mL', 4.50, 25.00),
    ('ESTR-01', 'Estradiol', 'pg/mL', 7.60, 43.00),
    ('PROG-01', 'Progesterone', 'ng/mL', 0.10, 20.00),
    ('AMH-01', 'AMH', 'ng/mL', 0.70, 19.00),
    ('BHCG-Q-01', 'Beta-HCG (Quantitative)', 'mIU/mL', 0.00, 5.00),
    ('ACTH-01', 'ACTH', 'pg/mL', 7.20, 63.30),
    ('GH-01', 'Growth Hormone', 'ng/mL', 0.00, 3.00),
    ('IRON-01', 'Serum Iron', 'ug/dL', 59.00, 158.00),
    ('TIBC-01', 'TIBC', 'ug/dL', 250.00, 450.00),
    ('FERR-01', 'Ferritin', 'ng/mL', 30.00, 400.00),
    ('IROS-01', 'Iron Saturation', '%', 20.00, 50.00),
    ('VITD-01', 'Vitamin D', 'ng/mL', 30.00, 100.00),
    ('VITB12-01', 'Vitamin B12', 'pg/mL', 197.00, 938.00),
    ('FOLIC-01', 'Folic Acid', 'ng/mL', 4.60, 18.70),
    ('VITB1-01', 'Vitamin B1', 'nmol/L', 70.00, 180.00),
    ('VITB6-01', 'Vitamin B6', 'nmol/L', 30.00, 110.00),
    ('VITC-01', 'Vitamin C', 'mg/dL', 0.40, 1.50),
    ('TROP-01', 'Troponin I', 'ng/mL', 0.00, 0.04),
    ('CKMB-01', 'CK-MB', 'ng/mL', 0.00, 5.00),
    ('MYO-01', 'Myoglobin', 'ng/mL', 25.00, 72.00),
    ('NTPNB-01', 'NT-ProBNP', 'pg/mL', 0.00, 125.00),
    ('BNP-01', 'BNP', 'pg/mL', 0.00, 100.00),
    ('HCYS-01', 'Homocysteine', 'umol/L', 0.00, 15.00),
    ('APOA1-01', 'Apo A1', 'mg/dL', 110.00, 205.00),
    ('APOB-01', 'Apo B', 'mg/dL', 55.00, 140.00),
    ('CA125-01', 'CA-125', 'U/mL', 0.00, 35.00),
    ('CA199-01', 'CA 19-9', 'U/mL', 0.00, 37.00),
    ('CEA-01', 'CEA', 'ng/mL', 0.00, 5.00),
    ('AFP-01', 'AFP', 'ng/mL', 0.00, 8.00),
    ('HER2-01', 'HER2/neu', 'ng/mL', 0.00, 15.00),
    ('S100-01', 'S100 Protein', 'ug/L', 0.00, 0.10),
    ('CALC-TM-01', 'Calcitonin', 'pg/mL', 0.00, 10.00),
    ('BHCG-TM-01', 'Beta-HCG (Tumor Marker)', 'mIU/mL', 0.00, 2.00),
    ('AHBC-01', 'Anti-HBc', 'Index', 0.00, 1.00),
    ('AHBS-01', 'Anti-HBs', 'mIU/mL', 10.00, 1000.00),
    ('HBEAG-01', 'HBeAg', 'Index', 0.00, 1.00),
    ('HCV-RNA-01', 'HCV RNA', 'IU/mL', 0.00, 15.00),
    ('ASO-01', 'ASO', 'IU/mL', 0.00, 200.00),
    ('C3-01', 'Complement C3', 'mg/dL', 90.00, 180.00),
    ('C4-01', 'Complement C4', 'mg/dL', 10.00, 40.00),
    ('IGA-01', 'IgA', 'mg/dL', 70.00, 400.00),
    ('ACE-01', 'ACE', 'U/L', 8.00, 52.00),
    ('LDH-01', 'LDH', 'U/L', 140.00, 280.00),
    ('BAL-01', 'Blood Alcohol', 'mg/dL', 0.00, 10.00),
    ('AMMON-01', 'Ammonia', 'umol/L', 15.00, 45.00),
    ('PAPPA-01', 'PAPP-A', 'mIU/mL', 1.00, 10.00),
    ('AFP-MAT-01', 'AFP (Maternal)', 'ng/mL', 10.00, 100.00),
    ('UE3-01', 'uE3', 'ng/mL', 0.50, 10.00),
    ('URIC-01', 'Serum Uric Acid', 'mg/dL', 3.50, 7.20),
    ('IGG-01', 'IgG', 'mg/dL', 700.00, 1600.00),
    ('IGM-01', 'IgM', 'mg/dL', 40.00, 230.00),
    ('G6PD-01', 'G6PD', 'U/g Hb', 4.60, 13.50)
),
seed_rows AS (
  SELECT
    gen_random_uuid() AS id,
    tpm.test_id,
    COALESCE(o.field_name_override, 
      CASE 
        WHEN tf.field_name = 'Result' THEN REGEXP_REPLACE(SPLIT_PART(tpm.test_name, ' (', 1), '\s*\(.*\)\s*$', '')
        ELSE tf.field_name 
      END
    ) AS field_name,
    COALESCE(o.unit_override, tf.unit) AS unit,
    COALESCE(o.min_val, tf.min_value) AS min_value,
    COALESCE(o.max_val, tf.max_value) AS max_value,
    tf.input_type,
    tf.options,
    tf.order_index,
    tf.field_type,
    tf.formula,
    tf.depends_on,
    tf.section_group,
    COALESCE(
      tf.reference_rules::jsonb,
      CASE
        WHEN COALESCE(o.min_val, tf.min_value) IS NOT NULL OR COALESCE(o.max_val, tf.max_value) IS NOT NULL THEN jsonb_build_array(
          jsonb_build_object('age_group', 'adult', 'sex', 'male', 'low', COALESCE(o.min_val, tf.min_value), 'high', COALESCE(o.max_val, tf.max_value)),
          jsonb_build_object('age_group', 'adult', 'sex', 'female', 'low', COALESCE(o.min_val, tf.min_value), 'high', COALESCE(o.max_val, tf.max_value)),
          jsonb_build_object('age_group', 'pediatric', 'sex', 'any', 'low', COALESCE(o.min_val, tf.min_value), 'high', COALESCE(o.max_val, tf.max_value))
        )
        ELSE jsonb_build_array(
          jsonb_build_object('age_group', 'all', 'sex', 'any', 'note', 'Qualitative cutoff based interpretation')
        )
      END::jsonb
    ) AS reference_rules,
    COALESCE(
      tf.critical_rules::jsonb,
      CASE
        WHEN COALESCE(o.min_val, tf.min_value) IS NOT NULL OR COALESCE(o.max_val, tf.max_value) IS NOT NULL THEN jsonb_build_object(
          'low', CASE WHEN COALESCE(o.min_val, tf.min_value) IS NOT NULL THEN round((COALESCE(o.min_val, tf.min_value) * 0.60)::numeric, 2) ELSE NULL END,
          'high', CASE WHEN COALESCE(o.max_val, tf.max_value) IS NOT NULL THEN round((COALESCE(o.max_val, tf.max_value) * 1.80)::numeric, 2) ELSE NULL END,
          'policy', 'Immediate critical alert and documented clinician communication'
        )
        ELSE jsonb_build_object(
          'policy', 'Critical if positive / grossly abnormal with urgent clinical context'
        )
      END::jsonb
    ) AS critical_rules,
    COALESCE(
      tf.interpretation_logic::jsonb,
      jsonb_build_object(
        'template', tpm.template_code,
        'auto_flag', 'L/H/Critical',
        'delta_check', true,
        'age_gender_sensitive', true,
        'clinical_correlation_required', true
      )
    ) AS interpretation_logic,
    tf.is_mandatory
  FROM test_panel_map tpm
  JOIN template_fields tf ON tf.template_code = tpm.template_code
  LEFT JOIN test_parameters_override o ON o.test_code = tpm.test_code
  WHERE tf.field_type <> 'calculated'
    AND tf.field_name NOT IN (
      'Clinical Interpretation',
      'Analyzer Flags',
      'Recommendation',
      'Recommended Follow-up',
      'Method',
      'Assay Method',
      'Biological Reference Interval',
      'Decision Threshold',
      'Interpretation',
      'Clinical Correlation',
      'Repeat/Confirmatory Advice',
      'Reviewed By',
      'Critical Value Policy',
      'Reference Interval',
      'Diagnostic Category',
      'WHO Reference Version',
      'Repeat Advice',
      'Internal Control',
      'Sample Processing Control'
    )
    AND (
      CASE
        WHEN tpm.template_code = 'HISTOPATH_STANDARD' THEN tf.field_name IN ('Gross Description', 'Microscopy', 'Final Diagnosis')
        WHEN tpm.template_code = 'CYTOLOGY_BETHESDA' THEN tf.field_name IN ('Specimen Adequacy', 'Bethesda Interpretation', 'Microscopy', 'Final Cytology Diagnosis')
        WHEN tpm.template_code = 'TB_XPERT_PANEL' THEN tf.field_name IN ('MTB Detected', 'Rifampicin Resistance', 'Semi-Quantitative Category')
        ELSE true
      END
    )
)
INSERT INTO test_fields (
  id,
  test_id,
  field_name,
  unit,
  min_value,
  max_value,
  input_type,
  options,
  order_index,
  field_type,
  formula,
  depends_on,
  section_group,
  reference_rules,
  critical_rules,
  interpretation_logic,
  is_mandatory,
  created_at,
  updated_at
)
SELECT
  sr.id,
  sr.test_id,
  sr.field_name,
  sr.unit,
  sr.min_value,
  sr.max_value,
  sr.input_type,
  sr.options,
  sr.order_index,
  sr.field_type,
  sr.formula,
  sr.depends_on,
  sr.section_group,
  sr.reference_rules,
  sr.critical_rules,
  sr.interpretation_logic,
  sr.is_mandatory,
  NOW(),
  NOW()
FROM seed_rows sr
WHERE NOT EXISTS (
  SELECT 1 FROM test_fields tf
  WHERE tf.test_id = sr.test_id AND tf.field_name = sr.field_name
);

INSERT INTO test_packages (id, package_name, package_code, category, description, price, is_active)
VALUES
  (gen_random_uuid(), 'Fever Profile', 'PKG-FEVER-01', 'Infections', 'CBC, malaria, blood culture', 1200, true),
  (gen_random_uuid(), 'Diabetic Profile', 'PKG-DIA-01', 'Metabolic', 'FBS, PPBS, HbA1c, Lipids', 1500, true),
  (gen_random_uuid(), 'Thyroid Advanced', 'PKG-THY-ADV-01', 'Endocrine', 'TSH, FT3, FT4, Anti-TPO', 1800, true),
  (gen_random_uuid(), 'Executive Checkup', 'PKG-EXEC-01', 'Wellness', 'Comprehensive health', 5000, true),
  (gen_random_uuid(), 'Women''s Health', 'PKG-WOMEN-01', 'Reproductive', 'Hormones, PAP, anemia', 3000, true),
  (gen_random_uuid(), 'Men''s Health', 'PKG-MEN-01', 'Reproductive', 'PSA, testosterone, semen', 2500, true),
  (gen_random_uuid(), 'Cardiac Risk', 'PKG-CARD-01', 'Cardiac', 'Troponin, CK-MB, NT-ProBNP', 3500, true),
  (gen_random_uuid(), 'Arthritis Profile', 'PKG-ARTH-01', 'Autoimmune', 'RA, Anti-CCP, ESR, CRP', 1800, true),
  (gen_random_uuid(), 'Anemia Profile', 'PKG-ANEM-01', 'Hematology', 'CBC, Iron, B12, Folate', 2000, true),
  (gen_random_uuid(), 'Antenatal', 'PKG-ANTE-01', 'Obstetric', 'Blood group, VDRL, HIV, CBC', 2500, true),
  (gen_random_uuid(), 'Infertility', 'PKG-INFER-01', 'Reproductive', 'FSH, LH, Prolactin, Semen', 4000, true),
  (gen_random_uuid(), 'Liver Advanced', 'PKG-LIVER-ADV-01', 'Hepatic', 'LFT, Viral Hepatitis, PT/INR', 2500, true),
  (gen_random_uuid(), 'Kidney Advanced', 'PKG-KIDNEY-ADV-01', 'Renal', 'KFT, Urine, Culture, Protein', 2200, true)
ON CONFLICT (package_code) WHERE branch_id IS NULL DO NOTHING;

-- Populate test_ids for seeded default packages
UPDATE test_packages SET test_ids = (SELECT jsonb_agg(id) FROM tests WHERE test_code IN ('CBC-01', 'MP-01', 'BCULT-01')) WHERE package_code = 'PKG-FEVER-01' AND branch_id IS NULL;
UPDATE test_packages SET test_ids = (SELECT jsonb_agg(id) FROM tests WHERE test_code IN ('FBS-01', 'PPBS-01', 'HBA1C-01', 'CHOL-01', 'TRIG-01', 'HDL-01')) WHERE package_code = 'PKG-DIA-01' AND branch_id IS NULL;
UPDATE test_packages SET test_ids = (SELECT jsonb_agg(id) FROM tests WHERE test_code IN ('TSH-01', 'THYPRO-01')) WHERE package_code = 'PKG-THY-ADV-01' AND branch_id IS NULL;
UPDATE test_packages SET test_ids = (SELECT jsonb_agg(id) FROM tests WHERE test_code IN ('CBC-01', 'LFT-01', 'KFT-01', 'LIPID-01', 'URINE-01')) WHERE package_code = 'PKG-EXEC-01' AND branch_id IS NULL;
UPDATE test_packages SET test_ids = (SELECT jsonb_agg(id) FROM tests WHERE test_code IN ('CBC-01', 'PAP-01', 'URINE-01')) WHERE package_code = 'PKG-WOMEN-01' AND branch_id IS NULL;
UPDATE test_packages SET test_ids = (SELECT jsonb_agg(id) FROM tests WHERE test_code IN ('SEMEN-01', 'CBC-01', 'LIPID-01')) WHERE package_code = 'PKG-MEN-01' AND branch_id IS NULL;
UPDATE test_packages SET test_ids = (SELECT jsonb_agg(id) FROM tests WHERE test_code IN ('LIPID-01', 'ELEC-01')) WHERE package_code = 'PKG-CARD-01' AND branch_id IS NULL;
UPDATE test_packages SET test_ids = (SELECT jsonb_agg(id) FROM tests WHERE test_code IN ('ESR-01', 'CBC-01')) WHERE package_code = 'PKG-ARTH-01' AND branch_id IS NULL;
UPDATE test_packages SET test_ids = (SELECT jsonb_agg(id) FROM tests WHERE test_code IN ('HB-01', 'CBC-01', 'AEC-01', 'RETIC-01')) WHERE package_code = 'PKG-ANEM-01' AND branch_id IS NULL;
UPDATE test_packages SET test_ids = (SELECT jsonb_agg(id) FROM tests WHERE test_code IN ('BG-01', 'CBC-01', 'HIV-01', 'RPR-01')) WHERE package_code = 'PKG-ANTE-01' AND branch_id IS NULL;
UPDATE test_packages SET test_ids = (SELECT jsonb_agg(id) FROM tests WHERE test_code IN ('SEMEN-01', 'TSH-01')) WHERE package_code = 'PKG-INFER-01' AND branch_id IS NULL;
UPDATE test_packages SET test_ids = (SELECT jsonb_agg(id) FROM tests WHERE test_code IN ('LFT-01', 'PT', 'APTT')) WHERE package_code = 'PKG-LIVER-ADV-01' AND branch_id IS NULL;
UPDATE test_packages SET test_ids = (SELECT jsonb_agg(id) FROM tests WHERE test_code IN ('KFT-01', 'URINE-01', 'UCULT-01')) WHERE package_code = 'PKG-KIDNEY-ADV-01' AND branch_id IS NULL;


 

-- Category-level default clinical significance updates
UPDATE tests SET clinical_significance = 'Hematology tests, including evaluation of red blood cells, white blood cells, platelets, and hemoglobin, are critical for screening, diagnosing, and monitoring hematologic disorders. They evaluate oxygen-carrying capacity, cellular production, immune responses, and inflammatory processes. These assessments assist in diagnosing anemias, leukemias, myeloproliferative disorders, thrombocytopenia, and systemic responses to bacterial or viral infections. Clinical interpretation must integrate patient age, sex, clinical history, and other diagnostic findings.' WHERE category = 'Hematology';

UPDATE tests SET clinical_significance = 'Biochemistry panels measure essential metabolic markers, organ enzymes, proteins, and electrolytes to evaluate physiological function and homeostatic balance. These tests assess liver function, renal excretory capacity, blood glucose regulation, and lipid metabolism. Anomalous levels assist in diagnosing metabolic syndrome, diabetes mellitus, hepatobiliary diseases, acute or chronic kidney injury, myocardial injury, pancreatitis, and severe electrolyte imbalances. Results must be interpreted in context with clinical presentation.' WHERE category = 'Biochemistry';

UPDATE tests SET clinical_significance = 'Endocrine and hormone assays measure circulating chemical messengers to evaluate endocrine gland function, including the thyroid, pituitary, adrenal, and reproductive glands. These evaluations are critical in assessing thyroid disorders (hypo- and hyperthyroidism), pituitary adenomas, adrenal insufficiency, growth abnormalities, fertility issues, menstrual irregularities, and gestational endocrinopathy. Hormonal levels vary based on age, biological sex, menstrual cycle phase, circadian rhythms, and medication use; therefore, clinical correlation is mandatory.' WHERE category = 'Hormone';

UPDATE tests SET clinical_significance = 'Serological testing detects specific humoral antibodies (IgM/IgG) or microbial antigens in serum to diagnose active, acute, or chronic infections, and assess immunity. These assays aid in identifying exposure to viral pathogens (hepatitis, HIV, dengue), bacterial infections (syphilis, typhoid), and parasites. They differentiate between active, primary, or past exposure and track antibody titer progression. Results must be interpreted with caution, factoring in serological windows, potential cross-reactivity, vaccination status, and clinical timeline.' WHERE category = 'Serology';

UPDATE tests SET clinical_significance = 'Immunology assays evaluate components of the immune system, including immunoglobulins, complement proteins, autoimmune autoantibodies, and inflammatory cytokines. These markers are diagnostic of systemic autoimmune diseases (rheumatoid arthritis, systemic lupus erythematosus), chronic inflammatory states, immunodeficiencies, and allergy-mediated hypersensitivity. Positive results suggest immune dysregulation or hypersensitivity and must be interpreted in conjunction with tissue-specific markers, clinical history, and symptoms.' WHERE category = 'Immunology';

UPDATE tests SET clinical_significance = 'Clinical pathology analyses of urine, stool, or other body fluids involve physical, chemical, and microscopic examinations to screen for local or systemic pathologies. Urinalysis evaluates renal health, urinary tract infections, metabolic diseases (e.g., glucosuria), and hydration status. Stool routine and microscopic exams screen for occult bleeding, gastrointestinal inflammation, and parasitic ova or protozoan cysts. Findings must be correlated with clinical symptoms and culture results where infection is suspected.' WHERE category = 'Clinical Pathology';

UPDATE tests SET clinical_significance = 'Microbiological culture, microscopic staining, and antimicrobial susceptibility testing (AST) isolate and identify pathogenic bacteria or fungi from clinical specimens. These panels guide targeted antimicrobial therapy by determining the minimum inhibitory concentration (MIC) or zone of inhibition for various antibiotics. Gram stains and specialized stains (e.g., AFB) provide rapid presumptive evidence of infection, while culture serves as the gold standard. Results must differentiate true pathogens from normal flora or contaminants.' WHERE category = 'Microbiology';

UPDATE tests SET clinical_significance = 'Cytopathology evaluations analyze cellular morphology in liquid-based preparations, smears, or fine-needle aspirates (FNA) to screen for dysplasia, precancerous changes, or malignancy. The Bethesda system and other standardized cytological frameworks are used to categorize specimens (e.g., PAP smears, thyroid aspirates). Cytological findings provide rapid screening but should be clinically correlated with clinical imaging and confirmed by histopathological biopsy where atypical or malignant cells are identified.' WHERE category = 'Cytology';

UPDATE tests SET clinical_significance = 'Histopathology tissue examinations provide definitive microscopic diagnosis of biopsy and surgical resection specimens. Microscopic analysis of tissue architecture, cellular features, and specific immunohistochemical (IHC) markers determines the benign or malignant nature of lesions, tumor histotype, grade, depth of invasion, surgical margin status, and pathological stage (pTNM). These findings are crucial for oncological staging, determining prognosis, and planning patient-specific surgical, chemotherapeutic, or radiation therapies.' WHERE category = 'Histopathology';

UPDATE tests SET clinical_significance = 'Coagulation assays assess the clotting pathways (intrinsic, extrinsic, and common pathways) and platelet function. These tests are essential for preoperative screening, evaluating bleeding disorders (e.g., hemophilia, von Willebrand disease), assessing hypercoagulable states, and monitoring anticoagulant therapies (such as Heparin, Warfarin, or Direct Oral Anticoagulants). Abnormal results suggest factor deficiencies, circulating inhibitors, or consumption coagulopathies (DIC) and require immediate clinical assessment.' WHERE category = 'Coagulation';

UPDATE tests SET clinical_significance = 'Andology assessments (such as semen analysis) evaluate male reproductive health, sperm parameters, and factors affecting fertility per WHO clinical standards. Semen parameters are highly variable; thus, multiple samples collected after appropriate abstinence are recommended for clinical diagnosis.' WHERE category = 'Andology';

UPDATE tests SET clinical_significance = 'Toxicology testing screen for and quantify therapeutic drug levels, drugs of abuse, or environmental toxins in physiological fluids. These assays are used to ensure therapeutic drug monitoring (TDM) compliance, prevent toxicity of narrow therapeutic index drugs (e.g., digoxin, antiepileptics), and detect substance use. Positive screens are presumptive and require confirmation using highly specific methods (e.g., GC-MS or LC-MS) in forensic or clinical management contexts.' WHERE category = 'Toxicology';

-- Specific key individual test updates
UPDATE tests SET clinical_significance = 'CBC (Complete Blood Count) is a routine screening test used to evaluate overall health and detect a wide range of disorders, including anemia, infection, and leukemia. Hemoglobin levels evaluate oxygen-carrying capacity. White Blood Cell (WBC) count and differentials assess immune status and inflammatory response. Platelet counts are crucial for blood clotting assessment. Clinical correlation is recommended.' WHERE test_code = 'CBC-01';

UPDATE tests SET clinical_significance = 'Liver Function Tests (LFTs) assess hepatic synthetic, metabolic, and excretory function. Elevations in transaminases (SGOT/SGPT) suggest hepatocellular injury, while increases in alkaline phosphatase (ALP) and bilirubin indicate cholestasis or biliary tract pathology. Total protein and albumin levels reflect synthetic function.' WHERE test_code = 'LFT-01';

UPDATE tests SET clinical_significance = 'Kidney Function Tests (KFTs) are used to evaluate renal function. Serum creatinine and urea are excretory waste products; elevations suggest reduced glomerular filtration rate (GFR). Electrolyte levels (sodium, potassium, chloride) are critical for maintaining fluid and acid-base balance.' WHERE test_code = 'KFT-01';

UPDATE tests SET clinical_significance = 'Lipid Profile is used to assess cardiovascular risk. Elevated levels of Total Cholesterol, LDL ("bad") Cholesterol, and Triglycerides, combined with low levels of HDL ("good") Cholesterol, are associated with an increased risk of atherosclerosis and coronary heart disease.' WHERE test_code = 'LIPID-01';

UPDATE tests SET clinical_significance = 'Erythrocyte Sedimentation Rate (ESR) measures the rate at which red blood cells settle in a tube over one hour. It is a highly sensitive but non-specific indicator of systemic inflammation. Elevated ESR is associated with acute or chronic infections, autoimmune disorders (such as temporal artetitis, polymyalgia rheumatica, rheumatoid arthritis, and lupus), and certain tissue injuries or malignancies. It is used as a screening tool and to monitor disease activity and treatment response.' WHERE test_code = 'ESR-01';

UPDATE tests SET clinical_significance = 'Blood Group & Rh Typing determines the specific ABO antigens and Rh(D) factor present on the surface of red blood cells. This typing is critically mandatory prior to any blood transfusion, surgical procedure, organ transplantation, or during prenatal care to prevent life-threatening hemolytic transfusion reactions or hemolytic disease of the newborn (HDN) caused by maternal-fetal Rh incompatibility.' WHERE test_code = 'BG-01';

UPDATE tests SET clinical_significance = 'Prothrombin Time (PT) and International Normalized Ratio (INR) measure the extrinsic and common coagulation pathways. It is primarily used to monitor oral anticoagulant therapy (e.g., warfarin), evaluate liver synthetic function (as clotting factors are produced in the liver), and screen for bleeding disorders, Vitamin K deficiency, or disseminated intravascular coagulation (DIC).' WHERE test_code = 'PT';

UPDATE tests SET clinical_significance = 'Activated Partial Thromboplastin Time (APTT) evaluates the intrinsic and common coagulation pathways. It is used to monitor unfractionated heparin therapy, detect factor deficiencies (such as Hemophilia A, B, or C), screen for lupus anticoagulants or other circulating inhibitors, and investigate unexplained bleeding or thrombotic episodes.' WHERE test_code = 'APTT';

UPDATE tests SET clinical_significance = 'Glycated Hemoglobin (HbA1c) represents the percentage of hemoglobin that is chemically linked to glucose. It reflects the average blood glucose concentration over the preceding 2 to 3 months (the lifespan of a red blood cell). It is the gold standard for diagnosing diabetes mellitus, monitoring glycemic control, and assessing the risk of microvascular and macrovascular complications.' WHERE test_code = 'HBA1C-01';

UPDATE tests SET clinical_significance = 'Blood sugar measurements (Fasting, Post-Prandial, or Random) assess circulating glucose levels. Fasting blood sugar (FBS) reflects basal glucose control, Post-Prandial (PPBS) measures glucose clearance after a carbohydrate load, and Random (RBS) is a rapid screen. These are critical in diagnosing diabetes mellitus, prediabetes, insulin resistance, and evaluating hypoglycemic or hyperglycemic emergencies.' WHERE test_code IN ('FBS-01', 'PPBS-01', 'RBS-01');

UPDATE tests SET clinical_significance = 'Urine Routine & Microscopy evaluates physical, chemical, and microscopic parameters of urine. It is an essential diagnostic screen to detect renal diseases (e.g., glomerulonephritis), urinary tract infections (UTIs), systemic metabolic disorders (such as diabetes mellitus, marked by glucosuria and ketonuria), and monitor fluid balance and drug-induced nephrotoxicity.' WHERE test_code = 'URINE-01';

UPDATE tests SET clinical_significance = 'Semen analysis evaluates sperm volume, pH, concentration, total count, progressive motility, vitality, and strict morphological characteristics in accordance with WHO clinical standards. It is the primary tool used to investigate male factor infertility, evaluate testicular function, and verify the success of vasectomy procedures.' WHERE test_code = 'SEMEN-01';

UPDATE tests SET clinical_significance = 'The Widal test detects serum agglutinins against Salmonella enterica serovars Typhi and Paratyphi (O, H, AH, BH antigens). While widely used to support the diagnosis of enteric (typhoid and paratyphoid) fevers in endemic regions, results must be interpreted with caution. Cross-reactivity, subclinical exposure, anamnesis, and prior vaccinations can cause elevated titers; hence, paired sera showing a four-fold rise are clinically significant.' WHERE test_code = 'WIDAL-01';

UPDATE tests SET clinical_significance = 'Peripheral Blood Smear (PBS) provides a detailed microscopic evaluation of red blood cell, white blood cell, and platelet size, shape, and structure. It is vital for diagnosing anemias (e.g., sickle cell, megaloblastic, microcytic), detecting leukemias, myelodysplastic syndromes, reactive blood disorders, and identifying blood-borne parasites such as Plasmodium (malaria), Babesia, or microfilariae.' WHERE test_code = 'PBS-01';

UPDATE tests SET clinical_significance = 'Serum Electrolytes measures circulating levels of Sodium (Na+), Potassium (K+), and Chloride (Cl-). These ions are essential for maintaining osmotic pressure, fluid volume, acid-base homeostasis, and proper neuromuscular, cardiac, and renal functions. Imbalances can lead to severe complications, including arrhythmias, seizures, muscle weakness, and altered mental status.' WHERE test_code = 'ELEC-01';

UPDATE tests SET clinical_significance = 'Stool Routine & Microscopy evaluates physical characteristics (color, consistency) and microscopic components (pus cells, RBCs, ova, parasites, yeast cells). It is crucial for identifying gastrointestinal infections, malabsorption syndromes, inflammatory bowel diseases, and parasitic infestations (such as Entamoeba histolytica or Giardia lamblia).' WHERE test_code = 'STOOL-01';

UPDATE tests SET clinical_significance = 'C-Reactive Protein (CRP) is an acute-phase reactant synthesized by the liver. Its levels rise rapidly in response to acute inflammation, tissue necrosis, or bacterial infection. It is used clinically to screen for infections, monitor inflammatory disease activity (e.g., rheumatoid arthritis, Crohn''s disease), and assess the efficacy of anti-inflammatory therapies.' WHERE test_code = 'CRP-01';

UPDATE tests SET clinical_significance = 'Thyroid Stimulating Hormone (TSH) is synthesized by the anterior pituitary gland to regulate thyroid hormone production. TSH is the most sensitive screening marker for primary hypo- and hyperthyroidism. Elevated TSH indicates thyroid gland failure (hypothyroidism), whereas suppressed TSH indicates thyroid hormone excess (hyperthyroidism).' WHERE test_code = 'TSH-01';

UPDATE tests SET clinical_significance = 'HIV screening detects antibodies against HIV-1 and HIV-2, and/or the p24 antigen. A reactive screen indicates potential infection and requires mandatory confirmatory testing (such as western blot or nucleic acid testing) before diagnosis. Results must be correlated with clinical history, exposure timeline, and patient counseling.' WHERE test_code IN ('HIV-01', 'HIV-RAPID-01');

UPDATE tests SET clinical_significance = 'Hepatitis B Surface Antigen (HBsAg) is the earliest serological marker of acute or chronic Hepatitis B infection. Its persistence for more than six months indicates chronic carrier status and increased risk for liver cirrhosis and hepatocellular carcinoma. Negative results indicate absence of active infection but do not rule out acute window phase.' WHERE test_code IN ('HBSAG-01', 'HBSAG-RAPID-01');

UPDATE tests SET clinical_significance = 'Anti-HCV detects antibodies against the Hepatitis C Virus. A positive test indicates exposure to the virus, which could represent acute, chronic, or resolved infection. Confirmatory HCV RNA testing is required to verify active replication and guide antiviral therapy.' WHERE test_code IN ('HCV-01', 'HCV-RAPID-01');

UPDATE tests SET clinical_significance = 'Dengue Rapid tests detect NS1 antigen alongside IgM and IgG antibodies to diagnose Dengue virus infection. NS1 is detectable from day 1 of fever, IgM indicates acute/recent infection (appearing on days 3-5), and IgG indicates past exposure or secondary infection. Secondary infection is associated with an increased risk of Dengue Hemorrhagic Fever (DHF).' WHERE test_code = 'DENGUE-RAPID';

UPDATE tests SET clinical_significance = 'Chikungunya IgM antibodies indicate recent infection with the Chikungunya virus. IgM antibodies become detectable 3 to 5 days after onset of symptoms and persist for up to 3 to 4 months. Differentiating Chikungunya from Dengue is crucial due to overlapping clinical presentations (fever, severe arthralgia) and geographical distribution.' WHERE test_code = 'CHIK-IGM-01';

UPDATE tests SET clinical_significance = 'TB GeneXpert (MTB/RIF) is a rapid molecular assay that detects Mycobacterium tuberculosis DNA and genetic mutations conferring resistance to Rifampicin. It provides highly sensitive detection in sputum or fluid samples within hours, enabling early diagnosis of tuberculosis and drug-resistant strains to optimize treatment protocols.' WHERE test_code = 'TB-XPERT-01';

UPDATE tests SET clinical_significance = 'The Mantoux (Tuberculin Skin Test) evaluates delayed-type hypersensitivity reaction to Purified Protein Derivative (PPD). An induration measured 48 to 72 hours post-injection indicates exposure to Mycobacterium tuberculosis. False-positives can occur due to prior BCG vaccination, and false-negatives can occur in immunocompromised states (anergy).' WHERE test_code = 'MANTOUX-01';

UPDATE tests SET clinical_significance = 'Typhidot is a rapid dot-ELISA that detects specific IgM and IgG antibodies against the outer membrane protein of Salmonella typhi. IgM indicates acute typhoid fever, while IgG indicates past exposure or relapse. It offers a faster diagnostic alternative to blood cultures, but clinical correlation is essential.' WHERE test_code = 'TYPHIDOT-01';

UPDATE tests SET clinical_significance = 'Standalone Hemoglobin (Hb) test measures the total oxygen-carrying protein in red blood cells. It is the primary marker used to diagnose, classify, and monitor anemia (decreased Hb) or polycythemia (increased Hb), which can result from nutritional deficiencies, chronic disease, hemolysis, or bone marrow disorders.' WHERE test_code = 'HB-01';

UPDATE tests SET clinical_significance = 'Absolute Eosinophil Count (AEC) measures the absolute number of circulating eosinophils. Eosinophils are granulocytes involved in allergic reactions, asthma, parasitic infections, and drug hypersensitivity. Elevated AEC (eosinophilia) assists in diagnosing these conditions, while depressed levels can occur in acute infections or steroid therapy.' WHERE test_code = 'AEC-01';

UPDATE tests SET clinical_significance = 'Reticulocyte Count measures young, immature red blood cells in circulation, reflecting bone marrow erythropoietic activity. It is crucial in classifying anemias: elevated levels indicate active marrow response to hemorrhage or hemolysis, whereas low levels suggest bone marrow suppression, nutritional deficiency, or renal disease.' WHERE test_code = 'RETIC-01';

UPDATE tests SET clinical_significance = 'Malaria Parasite Smear involves microscopic evaluation of thick and thin blood smears. Thick smears offer high sensitivity for detecting Plasmodium parasites, while thin smears are used for species identification (P. falciparum, P. vivax, P. malariae, P. ovale) and determining parasite density (parasitemia), which guides clinical management.' WHERE test_code = 'MP-01';

UPDATE tests SET clinical_significance = 'Platelet Count measures the absolute concentration of blood platelets, which are essential for primary hemostasis and clot formation. Thrombocytopenia (low platelets) increases bleeding risk (e.g., in dengue, autoimmune states), while thrombocytosis (high platelets) increases thrombotic risk and can occur in chronic inflammation or myeloproliferative disorders.' WHERE test_code = 'PLT-01';

UPDATE tests SET clinical_significance = 'Post Glucose Blood Sugar (PGBS) measures glucose clearance two hours after consuming a standardized oral glucose load (typically 75g). It is used to diagnose impaired glucose tolerance, prediabetes, gestational diabetes mellitus (GDM), or overt diabetes, reflecting postprandial metabolic capacity.' WHERE test_code = 'PGBS-01';

UPDATE tests SET clinical_significance = 'Serum Urea measures urea nitrogen, a nitrogenous waste product of protein catabolism excreted by the kidneys. Elevated levels (uremia/azotemia) occur in renal impairment, dehydration, high-protein diets, or gastrointestinal hemorrhage, while low levels can indicate severe liver disease or malnutrition.' WHERE test_code = 'UREA-01';

UPDATE tests SET clinical_significance = 'Serum Creatinine is a waste product of muscle creatine metabolism excreted at a constant rate by the kidneys. It is a highly specific marker of glomerular filtration rate (GFR). Elevated levels indicate renal dysfunction, kidney injury, or chronic kidney disease (CKD), requiring medical evaluation.' WHERE test_code = 'CREAT-01';

UPDATE tests SET clinical_significance = 'Serum Bilirubin measures Total, Direct (conjugated), and Indirect (unconjugated) bilirubin levels, which are clinical markers of hemoglobin catabolism. Elevated levels cause jaundice. Differentiating conjugated from unconjugated fractions is crucial for distinguishing pre-hepatic (hemolytic), hepatic (hepatitis/cirrhosis), and post-hepatic (biliary obstruction) conditions.' WHERE test_code = 'BIL-01';

UPDATE tests SET clinical_significance = 'SGPT (ALT) is an enzyme found primarily in hepatocytes. Hepatic injury or inflammation causes ALT leakage into the bloodstream, making it a highly sensitive marker for liver damage (e.g., from viral hepatitis, non-alcoholic fatty liver disease (NAFLD), alcohol, or hepatotoxic medications).' WHERE test_code = 'SGPT-01';

UPDATE tests SET clinical_significance = 'SGOT (AST) is an enzyme found in the liver, heart, skeletal muscle, and kidneys. Elevated levels suggest tissue injury, and in combination with ALT, AST helps differentiate hepatic conditions (e.g., AST/ALT ratio > 2 suggests alcoholic liver disease) and evaluate skeletal muscle or myocardial damage.' WHERE test_code = 'SGOT-01';

UPDATE tests SET clinical_significance = 'Alkaline Phosphatase (ALP) is an enzyme present in high concentrations in bile canaliculi, bone, and placenta. Elevated ALP occurs in cholestatic liver diseases (biliary obstruction, primary biliary cholangitis) and bone disorders involving osteoblast activity (Paget''s disease, rickets, bone metastases).' WHERE test_code = 'ALP-01';

UPDATE tests SET clinical_significance = 'Serum Total Cholesterol measures all circulating lipoproteins. It is a key biomarker for assessing cardiovascular health, estimating atherosclerotic cardiovascular disease (ASCVD) risk, and managing dyslipidemia. High levels contribute to plaque formation, increasing risk of coronary artery disease.' WHERE test_code = 'CHOL-01';

UPDATE tests SET clinical_significance = 'Serum Triglycerides measure the chemical form in which fat exists in the body. Elevated levels (hypertriglyceridemia) are an independent risk factor for cardiovascular disease and, in severe cases (typically > 500-1000 mg/dL), can trigger acute pancreatitis.' WHERE test_code = 'TRIG-01';

UPDATE tests SET clinical_significance = 'HDL Cholesterol measures "good" cholesterol, which facilitates reverse cholesterol transport from peripheral tissues back to the liver. High HDL levels are cardioprotective, while low levels (men < 40 mg/dL, women < 50 mg/dL) are associated with an increased risk of atherosclerosis and coronary heart disease.' WHERE test_code = 'HDL-01';

UPDATE tests SET clinical_significance = 'Sputum Routine & Microscopy evaluates macroscopic properties and microscopic features of respiratory secretions. Used to detect inflammatory cells, alveolar macrophages, elastic fibers, and pathogenic organisms (via Gram and AFB staining) to diagnose pulmonary infections like pneumonia, bronchitis, or tuberculosis.' WHERE test_code = 'SPUTUM-RM';

-- Additional custom updates for clinical significance
UPDATE tests SET clinical_significance = '• The degree of prolongation of PTT / APTT is neither predictive of bleeding risk nor underlying diagnosis
• Results should be clinically correlated
• Test conducted on Citrated plasma
• Heparin therapeutic range is not established. For heparin monitoring, Anti-Xa is recommended.
Causes of prolonged PTT / APTT:
·Liver disease ·Consumptive coagulopathy
·Circulating anticoagulants including Lupus anticoagulants
·Oral Anticoagulant therapy.
·Factor deficiencies' WHERE test_code = 'APTT';

UPDATE tests SET clinical_significance = '
This is a screening test. Positive or negative result of the screen test is considered "preliminary" and requires confirmation by definitive, specific testing, like HIV-RNA PCR assay.

Limitation
• False-negative results can occur due to acute infection and failure to detect certain HIV subtypes.
• Indeterminate results may occur due to partial seroconversion during acute HIV infection, advanced HIV infection with decreased titers of p24 antibodies, or infection with HIV-2.
• Other causes for an indeterminate test result in persons who are not infected with HIV include Cross-reacting alloantibodies from' WHERE test_code = 'HIV-01';

UPDATE tests SET clinical_significance = '
This is a screening test. Positive or negative result of the screen test is considered "preliminary" and requires confirmation by definitive, specific testing, like HIV-RNA PCR assay.
Limitation
• False-negative results can occur due to acute infection and failure to detect certain HIV subtypes.
• Indeterminate results may occur due to partial seroconversion during acute HIV infection, advanced HIV infection with decreased titers of p24 antibodies, or infection with HIV-2.' WHERE test_code = 'HIV-RAPID-01';

UPDATE tests SET clinical_significance = '
• Hepatitis B surface antigen (HBsAg) appears several days to several weeks after contact with the virus and can persist for several months.
• Acute hepatitis- Diagnosis relies on the presence of HBsAg and Anti-HBc IgM with absence of anti-HBs total Ab.
• Chronic Hepatitis- HbsAg test remain positive over 6 month & absence of anti-HBc IgM. Disappearance of the HBeAg is normally followed by the appearance of anti-HBs antibodies, which is a sign of recovery.' WHERE test_code = 'HBSAG-RAPID-01';

UPDATE tests SET clinical_significance = '
1. Measurement of CRP is useful for the detection and evaluation of infection, tissue injury, inflammatory disorders and associated diseases .
2. High sensitivity CRP (hsCRP) measurements may be used as an independent risk marker for the identification of individual at risk for future cardiovascular disease.
3. Increase in CRP values are non-Specific and should not be interpreted without a complete history.' WHERE test_code = 'CRP-01';

UPDATE tests SET clinical_significance = '
• RF is found in sera of patients with Rheumatoid Arthritis and is believed to be IgM antibodies directed against the patient''s own immunoglobulin.
• RF tests are important in distinguishing between Rheumatoid Arthritis, Autoimmune and other inflammatory disease states.
• The test has a detection limit of 25 IU/ml.
• Healthy individuals can give positive reaction in RF tests and the incidence is between 3 - 5 % of the population.
• Positive reactions do occur in condition such as infectious mononucleosis, syphilis,' WHERE test_code = 'RAF-01';

UPDATE tests SET clinical_significance = '
While sample should be collected as soon as possible after onset of illness, it is recommended that follow up of testing should be done on day 10 after the first sample to allow seroconversion, especially when the test is negative and Dengue virus infection is clinically suspected.

80% of the patients may have detectable levels of IgM antibody by day 5 of illness and 99% by day 10.

IgM levels rise quickly and peak by two weeks after onset of symptoms and then' WHERE test_code = 'DENGUE-RAPID';

UPDATE tests SET clinical_significance = '
1.Positive results in serum indicates ongoing or recent infection by Chikungunya virus causing rash, fever and severe joint pain (arthralgia). The test cannot be used to differentiate between primary and secondary infection.
2.Negative results are seen in absence of Chikungunya virus infection. However, it does not rule out the disease.
3.False positive results may be seen due to cross reactivity with other mosquito borne diseases like Dengue and Zika Virus infections, in patients with high levels of heterophile antibodies and Rheumatoid factor.' WHERE test_code = 'CHIK-IGM-01';

UPDATE tests SET clinical_significance = '
• The lipid profile is used to evaluate risk of coronary arterial occlusion, atherosclerosis and myocardial infarction.
• Total cholesterol & LDL-Chol. levels are increased in familial dyslipoproteinemias [type II & III], secondary to obstructive liver disease, hypothyroidism, nephrotic syndrome, primary billary cirrhosis & type 2 diabetes mellitus. They are decreased in abetalipoproteinemia, severe nutritional anemia, malnutrition, hyperthyroidism & malabsorption.
• There is a direct relationship between LDL-C & the incidence of CAD. Intervention to decrease the LDL-C will decrease the CAD risk. Treatment decisions and therapeutic goals are also largely based on LDL-C levels.
• It is necessary to ensure that the patient is fasting for 10 hrs for this test' WHERE test_code = 'LIPID-01';

UPDATE tests SET clinical_significance = '
TSH levels are subject to circadian variation, reaching peak levels between 2-4 am and at a minimum between 6-10 pm. The variation is of the order of 50%, hence time of the day has influence on the measured serum TSH concentrations.
• Rheumatoid factor, human antimouse antibodies, heterophile antibodies may produce spurious results, especially in patients with autoimmune disorders (=10%). - Amiodarone may interfere with TSH.
• Non thyroidal illness like severe infections, liver disease, renal and hear failure, severe burns, trauma and surgery, pregnancy, Acute psychiatric illness, Severe dehydration may show transient variation in TSH value.' WHERE test_code = 'THYPRO-01';

UPDATE tests SET clinical_significance = '
• Diagnose Hypothyroidism and Hyperthyroidism
• Monitor T4 replacement or T4 suppressive therapy
• Quantify TSH levels in the subnormal range
Increased Levels:
• Primary hypothyroidism, Subclinical hypothyroidism, TSH dependent Hyperthyroidism, Thyroid hormone resistance
Decreased Levels:
• Graves disease, Autonomous thyroid hormone secretion, TSH deficiency
• Non-thyroidal illnesses like severe infections, liver disease, renal and heart failure, severe burns, trauma and surgery, Acute psychiatric illness, Severe dehydration may show transient variation in TSH value.
• TSH levels are subject to circadian variation, reaching peak levels...' WHERE test_code = 'TSH-01';

UPDATE tests SET clinical_significance = '
1. Free PSA values regardless of levels should not be interpreted as absolute evidence for the presence or absence of disease. All values should be correlated with clinical findings and results of other investigations
2. False negative / positive results are observed in patients receiving mouse monoclonal antibodies for diagnosis or therapy
3. Free PSA levels may appear consistently elevated / depressed due to the interference by heterophilic antibodies & nonspecific protein binding
4. Immediate Free PSA testing following digital rectal examination, ejaculation, prostatic massage, ultrasonography and needle biopsy of prostate is not recommended as they falsely elevate levels
5. Hormone therapy affects Free PSA expression
6. The concentration of PSA,Free in a given specimen, determined with...' WHERE test_code = 'FREE-PSA-01';

UPDATE tests SET clinical_significance = '
Free T3 is the active form that enters your tissues where it''s needed.
Bound T3 is attached to certain proteins which prevent it from entering your tissues. Most of your T3 is bound.

A total T3 test measures both bound and free T3 together. Medical experts think that this test is the more accurate way to measure T3.
A free T3 test only measures free T3.' WHERE test_code = 'FT3-01';

UPDATE tests SET clinical_significance = 'Free T4 is the active form of thyroxine hormone that enters your body tissues where you need it.
Bound T4 is thyroxine that attaches or binds to certain proteins which prevent it from entering your body tissues.
It stays in your bloodstream as a "backup supply" until your tissues need it.

A free T4 test measures the amount of free T4 in your blood. Medical experts believe this test is more accurate than a total T4 test, so it''s used more often.

A total T4 test measures free and bound T4 together.' WHERE test_code = 'FT4-01';

UPDATE tests SET clinical_significance = '
Increase
• Myeloproliferative diseases (Leukemia, Polycythemia vera)
• Vitamin B12 Therapy
• Chronic renal failure, Congestive heart failure
• Carcinomas with liver metastasis
• Liver disease,
• Drug induced cholestasis
• Protein Malnutrition and Uremia
Decrease
• Dietary deficiency: strict Vegetarians
• Deficiency of IF: Total or partial gastrectomy, Atrophic gastritis, Intrinsic factor antibodies
• Malabsorption: Regional ileitis, resected bowel, Tropical Sprue, Celiac disease, pancreatic insufficiency, bacterial overgrowth & achlorhydria' WHERE test_code = 'VITB12-01';

UPDATE tests SET clinical_significance = '
• The assay measures both D2 (Ergocalciferol) and D3 (Cholecalciferol) metabolites of vitamin D.
• Vitamin D3 (cholecalciferol) and Vitamin D2 (ergocalciferol) are the most abundant Vitamin D in nature. Vitamin D3 is synthesized in the skin from 7-dehydrocholesterol in response to UV-B rays in sunlight. The best nutrition sources of D3 are oily fish primary salmon and mackerel. Vitamin D2''s nutrition sources are from some vegetables, yeast and fungi.
• Vitamin D (D3 and D2) is hydroxylated to 25-hydroxyvitamin D by an enzyme in the liver. The measurement of total 25-OH vitamin D concentration in the serum or plasma is the best indicator of vitamin D nutritional status.
• Vitamin D promotes absorption of calcium and phosphorus and' WHERE test_code = 'VITD-01';

UPDATE tests SET clinical_significance = '
Increase in serum ferritin due to inflammatory conditions (Acute phase response) can mask a diagnostically low result

Comments :
Serum ferritin appears to be in equilibrium with tissue ferritin and is a good indicator of storage iron in normal subjects and in most disorders. In patients with some hepatocellular diseases, malignancies and inflammatory diseases, serum ferritin is a disproportionately high estimate of storage iron because serum ferritin is an acute phase reactant. In such disorders iron deficiency anemia may exist with a normal serum ferritin concentration. In the presence of inflammation, persons with low serum ferritin are likely to' WHERE test_code = 'FERR-01';

UPDATE tests SET clinical_significance = '
- Diagnosis of gonadal, pituitary, hypothalamic disorders
- Management and treatment of infertility in both genders
Increased Levels
- Primary hypogonadism
- Gonadotropin secreting pituitary tumors
- Precocious puberty (secondary to a CNS lesion or idiopathic)
- The luteal phase of the menstrual cycle
Decreased Levels
- Hypothalamic GnRH deficiency
- Pituitary FSH deficiency
- Ectopic steroid hormone production' WHERE test_code = 'FSH-01';

UPDATE tests SET clinical_significance = '
• Diagnosis of gonadal function disorders
• Diagnosis of pituitary disorders

Increased levels
• Primary hypogonadism
• Gonadotropin secreting pituitary tumors

Decreased levels
• Hypothalamic GnRH deficiency
• Pituitary LH deficiency
• Ectopic steroid hormone production
• GnRH analog treatment' WHERE test_code = 'LH-01';

UPDATE tests SET clinical_significance = '
• Since prolactin is secreted in a pulsatile manner and is also influenced by a variety of Physiologic stimuli, it is recommended to test 3 specimens at 20-30 minute intervals after pooling.
• The primary circulating form of Prolactin is a nonglycosylated monomer, but several forms of prolactin linked with immunoglobulin can give falsely high Prolactin results.
• Prolactin levels in normal individuals tend to rise in response to physiologic stimuli including sleep, exercise, nipple stimulation, sexual intercourse, hypoglycemia, pregnancy, and surgical stress.' WHERE test_code = 'PROL-01';

UPDATE tests SET clinical_significance = '
• Congential adrenal hyperplasia
• Lipoid ovarian tumor
• Molar preganancy
• Chorionepithelioma of ovary
• Ovarian tumor
• Adrenal tumor
• Selected steroid hormone biosynthetic defects
Decreased:
• Thretened spontaneous abortion
• Galactorrhea-amenorrhea syndrome (Primary or secondary hypogonadism)
• Short luteal phase syndrome.' WHERE test_code = 'PROG-01';

UPDATE tests SET clinical_significance = 'Method : Electrochemiluminescence lmmunoassay "ECLIA"
• Anti-Mullerian Hormone (AMH) is produced directly by the ovarian follicles, AMH levels correlate with the number of antral follicles in the ovaries. Women with lower AMH have lower antral follicular counts and produce a lower number of oocytes compared with women with higher levels.

• AMH can be used for:
• Evaluating Fertility Potential and ovarian response in IVF - Serum AMH levels correlate with the number of early antral follicles. This makes is useful for prediciting your ovarian response in an IVF cycle. Women with low AMH levels are more likely to be poor ovarian responders.' WHERE test_code = 'AMH-01';

UPDATE tests SET clinical_significance = '
• HCG is staloglycoprotein secreted by trophoblastic cells of Placenta. Rapid rise of HCG serum level after conception makes it an excellent marker for early confirmation & monitoring of pregnancy.
• B-HCG is useful in predicting spontaneous abortion, aiding in detection of ectopic pregnancy and multiple gestation.
• B-HCG aid in monitoring & diagnosis of trophoblastic tumor.' WHERE test_code IN ('BHCG-Q-01', 'BHCG-QL-01', 'BHCG-TM-01');

UPDATE tests SET clinical_significance = 'Generally found elevated in carcinoma of ovary, uterine tumour and some times even in endometriosis.
Schedule for tumour marker determination

Pre-operatively
Post operatively - At regular intervas until the values have shown a marked decrease.
Potential clinical applications of tumour markers are :
Prognosis - The level of tumour marker corresponds to the mass of tumour. Moderate elevations are suggestive of better prognosis than persistent high levels.
Monitoring - The profile of tumour marker concentration against time can mirror the condition of patients diagnosed to have cancer.' WHERE test_code = 'CA125-01';

UPDATE tests SET clinical_significance = '
• Homocysteine is an amino acid resulting from the synthesis of cysteine from methionine with enzyme reaction of cobalamin and folate.
• Certain drugs, such as anticonvulsants, methotrexate, or nitrous oxide, may interfere with the assay.
• Cigarette smoking and coffee consumption increase Homocysteine levels.

Use :
• Elevated levels of Hcy may be used to exclude or confirm deficiencies of vitamin B12 or folate.
• Elevation in Hcy levels have also been used as an independent risk factor of coronary or cerebral vascular disease.' WHERE test_code = 'HCYS-01';

UPDATE tests SET clinical_significance = '
D-Dimer is one of the measurable byproducts of activation of the fibrinolytic system. It assesses fibrinolytic activation and intravascular thrombosis. D-dimer assays are characteristic for Disseminated Intravascular Coagulation (DIC) as this test demonstrates simultaneous presence of thrombin and plasmin formation.

Increased
• large vessel thrombosis, soft tissue hematomas, Pulmonary embolism, recent surgery, active or recent bleeding, pregnancy, - liver disease, malignancy and hypercoagulable states, Renal failure, disseminated cancer, Covid-19 and cardiac failure.' WHERE test_code = 'DD-01';

UPDATE tests SET clinical_significance = '
• The current high-sensitivity troponin (hsTn) assay can detect low levels upto 0.003 &mu;g/L (3 ng/L). (Following are the conversion factors- Concentration in pg/ml x 0.001= µg/L, Concentration in pg/ml x1.0 =ng/L)
• Reporting in many decimal point placements causes confusion and potentially can lead to misinterpretations, hence it has been recommended (IFCC2014) that the results are expressed in whole numbers by using ng/L as the unit of measurement.
• the high tissue specificity of cTnI measurements is beneficial for identifying cardiac injury in clinical conditions involving skeletal muscle injury resulting from surgery, trauma, extensive exercise, or muscular disease.
• Highly sensitive troponin (cTn) assay allows earlier detection of acute Myocardial Infarction (MI), with shortening of time' WHERE test_code = 'TROP-01';

UPDATE tests SET clinical_significance = '

CK-MB (Creatine Kinase-Myocardial Band) is a heart enzyme indicating heart muscle damage, historically crucial for diagnosing heart attacks (myocardial infarction) by showing elevated levels after injury, though now often supplemented or replaced by more specific troponin tests, but still useful for monitoring reinfarction or when troponins aren''t available, helping differentiate heart from skeletal muscle issues. 
Heart Attack Diagnosis: CK-MB rises 4-6 hours post-heart attack, peaks around 10-24 hours, and returns to normal in 48-72 hours, helping confirm myocardial damage, especially in early stages.
Differentiating Muscle Injury: Helps distinguish heart damage from skeletal muscle damage, as CK-MB is more concentrated in heart tissue than other CK isoenzymes (CK-MM).' WHERE test_code = 'CKMB-01';

UPDATE tests SET clinical_significance = '• Generally recommended in : prostatic malignancy 

• Schedule for tumour marker determination
Pre-operatively
Post operatively - At regular intervas until the values have shown a marked decrease.

• Potential clinical applications of tumour markers are :

Prognosis - The level of tumour marker corresponds to the mass of tumour. Moderate elevations are suggestive of better prognosis than persistent high levels.
Monitoring - The profile of tumour marker concentration against time can mirror the condition of patients diagnosed to have cancer.' WHERE test_code = 'PSA-01';

UPDATE tests SET clinical_significance = '
• Pancreas is the major and primary source of serum lipase though lipases are also present in liver, stomach, intestine, WBC, fat cells and milk.
• In acute pancreatitis, serum lipase becomes elevated at the same time as amylase and remains high for 7-10 days.
• Increased lipase activity rarely lasts longer than 14 days.
• Prolonged increase suggests poor prognosis or presence of a cyst.
• The combined use of serum lipase and serum amylase is effective in ruling out acute pancreatitis.

Increased levels :
• Acute & Chronic pancreatitis.
• Obstruction of pancreatic duct.
• Non pancreatic conditions like renal diseases, acute cholecystitis, intestinal obstruction, duodenal ulcer, alcoholism, diabetic ketoacidosis and…' WHERE test_code = 'LIPAS-01';

UPDATE tests SET clinical_significance = 'An amylase test measures the amount of amylase in blood or urine (pee). Amylase is an enzyme made by your pancreas and salivary glands that helps your body break down carbohydrates. If an amylase test finds too much amylase in your blood or urine, it may indicate a pancreas disorder or other health condition.' WHERE test_code = 'AMYL-01';

UPDATE tests SET clinical_significance = '• Generally recommended in : Ca lung, liver, stomach, Colorectal, prostate and less frequently in Ca. breast.
• Schedule for tumour marker determination
Pre-operatively
Post operatively - At regular intervas until the values have shown a marked decrease.
• Potential clinical applications of tumour markers are :
Prognosis - The level of tumour marker corresponds to the mass of tumour. Moderate elevation is suggestive of better prognosis than persistent high levels.
Monitoring - The profile of tumour marker concentration against time can mirror the condition of patients diagnosed to have cancer.
• Tumour marker profile usually reflects one of the following classica…' WHERE test_code = 'CEA-01';

UPDATE tests SET clinical_significance = '
1. Test results should be interpreted in conjunction with serum calcium and phosphorus levels, and clinical findings.
2. Elevated PTH with normal serum calcium levels may be indicative of Secondary causes of hyperparathyroidism like vitamin D deficiency. It may not always be indicative of Primary hyperparathyroidism.
3. PTH is secreted in a pulsatile manner with an overall circadian rhythm characterized by a nocturnal rise.

Use
• Diagnose hyperparathyroidism
• Monitor severity of secondary hyperparathyroidism in chronic renal failure
• Discriminate primary hyperparathyroidism from tumor hypercalcemia' WHERE test_code = 'PTH-01';

UPDATE tests SET clinical_significance = '
Interpretation guide:
Anti-CCP is an autoantibodies against the citruline, highly specific markers for rheumatoid arthritis with specificity of 92% and sensitivity of 68% in a control group of overlapping rheumatic disease.' WHERE test_code = 'ANTICCP-01';

UPDATE tests SET clinical_significance = '

The CA 19.9 assay is frequently elevated in the serum subjects with various gastrointestinal malignancies, such as pancreatic, colorectal, gastric and hepatic carcinomas.
Increased serum CA - 19.9 values have also been observed in patients with metastasis and in nonmalignant conditions such as hepatitis, cirrhosis, pancreatitis and in cystic fibrosis.

To determine preoperative resectability of pancreatic cancer very high concentrations predict unresectable cancer-only 5% of patients with concentration >1000 U/ml have surgically resectable disease; 50% of patients with concentration <1000 U/ml have surgically resectable cancers. Postsurgical recurrence correlates with increased concentrations in 1-7 months. May be a useful adjunct of CEA for diagnosis and detection of early…' WHERE test_code = 'CA199-01';

UPDATE tests SET clinical_significance = '

Serum Calcium Decreases in Hypoparathyrodism, Surgical/Idiopathic/Herediatary/ Infiltration, Insufficient Intake (Starvation/ Rickets/Osteomalacia), Chronic Renal Disease with Uremia and Phosphate retention ,Renal tubular acidosis, Malabsorption of Vitamin D & Calcium, Psedohypoparathyrodism, Dialysis with citrate anticoagulation, Hyperphosphatemia, Chemotherapeutic Drugs, Toxic shock syndrome and Maternal Hypoparathyrodism

Serum Calcium Increases in Primary /Secondary Hyper-parathyroidism, Acute /chronic Renal failure, Malignant tumors (Breast,Lung,Kindney,Lymphoma), Granulomatous Disease(like TB,Sarcoidosis), VitaminD & VitaminA Intoxication, Drugs (like Diurectics and Tamoxifane, androgens), Paget''s Disease, Rhabdomyolysis with Acute renal failure, Dehydration with Hyperprotenemia and Idiopathic Hypercalcemia of Infancy.' WHERE test_code = 'CALC-01';

-- Generic fallback to ensure no test has empty clinical significance
UPDATE tests SET clinical_significance = 'Clinical significance provides diagnostic context. Results should be interpreted by a qualified clinician in correlation with clinical history, other diagnostic findings, and physical symptoms.' WHERE clinical_significance IS NULL OR clinical_significance = '';

-- ============================================
-- WHATSAPP SYSTEM TEMPLATES (from old migration 003)
-- ============================================
INSERT INTO whatsapp_templates (id, branch_id, event_key, template_name, template_body, is_enabled, is_system, created_at, updated_at)
VALUES
(gen_random_uuid(), NULL, 'report_ready', 'Report Ready', 'Hello {{patient_name}}, your report for {{test_name}} is ready at {{branch_name}}. View report: {{report_link}}', TRUE, TRUE, NOW(), NOW()),
(gen_random_uuid(), NULL, 'report_approved', 'Report Approved', 'Hello {{patient_name}}, your report for {{test_name}} has been approved by our pathologist at {{branch_name}}. View report: {{report_link}}', TRUE, TRUE, NOW(), NOW()),
(gen_random_uuid(), NULL, 'appointment_confirmation', 'Appointment Confirmation', 'Hello {{patient_name}}, your appointment is confirmed at {{branch_name}} on {{appointment_date}} at {{appointment_time}}.', TRUE, TRUE, NOW(), NOW()),
(gen_random_uuid(), NULL, 'appointment_reminder', 'Appointment Reminder', 'Reminder: {{patient_name}}, you have an appointment at {{branch_name}} on {{appointment_date}} at {{appointment_time}}.', TRUE, TRUE, NOW(), NOW()),
(gen_random_uuid(), NULL, 'payment_confirmation', 'Payment Confirmation', 'Hello {{patient_name}}, we received your payment of {{payment_amount}} for {{test_name}} at {{branch_name}}. Thank you.', TRUE, TRUE, NOW(), NOW()),
(gen_random_uuid(), NULL, 'registration_confirmation', 'Registration Confirmation', 'Welcome {{patient_name}}. Your registration at {{branch_name}} is complete for tests: {{patient_tests}}. Thank you for choosing us!', TRUE, TRUE, NOW(), NOW())
ON CONFLICT (branch_id, event_key) DO NOTHING;

-- ============================================
-- QUALITATIVE REFERENCE RULES
-- ============================================
UPDATE test_fields 
SET reference_rules = '[{"age_group":"all","sex":"any","note":"Negative"}]'::jsonb
WHERE input_type = 'select' 
  AND options ILIKE '%Negative%';

UPDATE test_fields 
SET reference_rules = '[{"age_group":"all","sex":"any","note":"Absent"}]'::jsonb
WHERE input_type = 'select' 
  AND options ILIKE '%Absent%'
  AND field_name <> 'Fructose Test';

UPDATE test_fields 
SET reference_rules = '[{"age_group":"all","sex":"any","note":"Present"}]'::jsonb
WHERE field_name = 'Fructose Test';

-- ============================================
-- CLEANUP CRITICAL RULES
-- ============================================
UPDATE test_fields SET critical_rules = NULL;

-- ============================================
-- SUMMARY COUNTS
-- ============================================
SELECT COUNT(*) AS total_tests FROM tests;
SELECT COUNT(*) AS total_test_fields FROM test_fields;
SELECT COUNT(*) AS total_packages FROM test_packages;
SELECT 'Seed migration 002 complete' AS status;