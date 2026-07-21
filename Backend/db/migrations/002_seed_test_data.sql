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
  (gen_random_uuid(), 'Anti TG', 'ATG-01', 'Immunology', 'Blood', 400, 4, 'Thyroid antibodies', NOW(), NOW()),
  (gen_random_uuid(), 'Thyroglobulin', 'TG-01', 'Hormone', 'Blood', 350, 4, 'Thyroid hormone precursor', NOW(), NOW()),
  (gen_random_uuid(), 'FSH (Follicle Stimulating Hormone)', 'FSH-01', 'Hormone', 'Blood', 350, 4, 'Reproductive hormone - pituitary', NOW(), NOW()),
  (gen_random_uuid(), 'LH (Luteinizing Hormone)', 'LH-01', 'Hormone', 'Blood', 350, 4, 'Reproductive hormone - pituitary', NOW(), NOW()),
  (gen_random_uuid(), 'Prolactin', 'PROL-01', 'Hormone', 'Blood', 350, 4, 'Milk production hormone', NOW(), NOW()),
  (gen_random_uuid(), 'Testosterone', 'TEST-01', 'Hormone', 'Blood', 400, 4, 'Male reproductive hormone', NOW(), NOW()),
  (gen_random_uuid(), 'Free Testosterone', 'FTEST-01', 'Hormone', 'Blood', 450, 4, 'Bioavailable testosterone', NOW(), NOW()),
  (gen_random_uuid(), 'Estradiol (E2)', 'ESTR-01', 'Hormone', 'Blood', 400, 4, 'Female reproductive hormone', NOW(), NOW()),
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
  (gen_random_uuid(), 'Dengue Card', 'DENGUE-RAPID', 'Serology', 'Serum', 650, 4, 'Qualitative detection of Dengue IgM and IgG antibodies', NOW(), NOW()),
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
  (gen_random_uuid(), 'G6PD (Glucose-6-Phosphate Dehydrogenase)', 'G6PD-01', 'Biochemistry', 'Whole Blood (EDTA)', 450, 6, 'Measures Glucose-6-Phosphate Dehydrogenase activity in red blood cells to detect G6PD deficiency', NOW(), NOW()),  -- NEW TESTS BATCH (Protein CSF through ZN Stain)
  (gen_random_uuid(), 'Protein CSF', 'PROT-CSF-01', 'Biochemistry', 'CSF', 350, 4, 'Quantitative measurement of total protein in cerebrospinal fluid to evaluate blood-brain barrier integrity and CNS pathology', NOW(), NOW()),
  (gen_random_uuid(), 'Protein Electrophoresis', 'PROT-ELEC-01', 'Biochemistry', 'Serum', 1200, 24, 'Separates serum proteins into albumin, alpha-1, alpha-2, beta, and gamma globulin fractions to detect monoclonal or polyclonal gammopathies', NOW(), NOW()),
  (gen_random_uuid(), 'Protein Urine', 'PROT-URINE-01', 'Biochemistry', 'Urine', 200, 4, 'Quantitative measurement of total protein in urine to assess renal function and detect proteinuria', NOW(), NOW()),
  (gen_random_uuid(), 'Quadruple Marker', 'QUADM-01', 'Hormone', 'Serum', 2500, 24, 'Second trimester maternal screening using AFP, hCG, uE3 and Inhibin A for chromosomal abnormalities and neural tube defects', NOW(), NOW()),
  (gen_random_uuid(), 'Ratio BUN / Creatinine', 'BUN-CREAT-01', 'Biochemistry', 'Serum', 250, 4, 'Calculates ratio of Blood Urea Nitrogen to Creatinine to differentiate pre-renal, renal, and post-renal azotemia', NOW(), NOW()),
  (gen_random_uuid(), 'Reticulocyte Panel', 'RETIC-PNL-01', 'Hematology', 'Whole Blood (EDTA)', 450, 6, 'Comprehensive reticulocyte assessment including percentage, absolute count, corrected count, and reticulocyte production index', NOW(), NOW()),
  (gen_random_uuid(), 'Sodium Na+', 'NA-01', 'Biochemistry', 'Serum', 150, 4, 'Quantitative measurement of serum sodium for evaluation of fluid-electrolyte balance and acid-base homeostasis', NOW(), NOW()),
  (gen_random_uuid(), 'Sodium Na+ Urine', 'NA-URINE-01', 'Biochemistry', 'Urine', 200, 4, 'Quantitative measurement of urinary sodium to evaluate renal sodium handling, volume status, and adrenal function', NOW(), NOW()),
  (gen_random_uuid(), 'Stone Analysis', 'STONE-01', 'Biochemistry', 'Calculus/Stone', 800, 48, 'Chemical and/or infrared spectroscopic analysis of urinary or biliary calculi to determine composition and guide prevention strategy', NOW(), NOW()),
  (gen_random_uuid(), 'TB - Auto AFB Culture', 'TB-AFB-CULT-01', 'Microbiology', 'Sputum', 1200, 1008, 'Automated liquid culture (BACTEC/MGIT) for isolation of Mycobacterium tuberculosis complex with drug susceptibility testing', NOW(), NOW()),
  (gen_random_uuid(), 'Thyroid Function Test, Free', 'TFT-FREE-01', 'Hormone', 'Serum', 700, 6, 'Comprehensive free thyroid panel including TSH, Free T3, and Free T4 for accurate assessment of thyroid function', NOW(), NOW()),
  (gen_random_uuid(), 'TORCH 4 IgG', 'TORCH4-IGG-01', 'Serology', 'Serum', 1800, 24, 'Panel measuring IgG antibodies against Toxoplasma, Rubella, CMV, and HSV to assess past exposure or immunity status', NOW(), NOW()),
  (gen_random_uuid(), 'TORCH 4 IgM', 'TORCH4-IGM-01', 'Serology', 'Serum', 1800, 24, 'Panel measuring IgM antibodies against Toxoplasma, Rubella, CMV, and HSV to detect acute or recent infections', NOW(), NOW()),
  (gen_random_uuid(), 'Toxoplasma IgG', 'TOXO-IGG-01', 'Serology', 'Serum', 450, 4, 'Quantitative determination of IgG antibodies against Toxoplasma gondii to evaluate past exposure or chronic infection', NOW(), NOW()),
  (gen_random_uuid(), 'Toxoplasma IgM', 'TOXO-IGM-01', 'Serology', 'Serum', 450, 4, 'Qualitative detection of IgM antibodies against Toxoplasma gondii for diagnosis of acute or recent primary infection', NOW(), NOW()),
  (gen_random_uuid(), 'Transferrin Saturation', 'TSAT-01', 'Biochemistry', 'Serum', 350, 4, 'Calculates percentage of transferrin saturated with iron to evaluate iron status and diagnose iron overload or deficiency', NOW(), NOW()),
  (gen_random_uuid(), 'Troponin I High Sensitive CLIA', 'HS-TROPI-01', 'Biochemistry', 'Serum', 700, 2, 'High-sensitivity chemiluminescence immunoassay for cardiac Troponin I to detect minor myocardial injury and early acute coronary syndrome', NOW(), NOW()),
  (gen_random_uuid(), 'Troponin T High Sensitive CLIA', 'HS-TROPT-01', 'Biochemistry', 'Serum', 700, 2, 'High-sensitivity chemiluminescence immunoassay for cardiac Troponin T to detect minor myocardial injury and risk-stratify chest pain', NOW(), NOW()),
  (gen_random_uuid(), 'TTG IgA - Tissue Transglutaminase IgA Screening', 'TTG-IGA-01', 'Immunology', 'Serum', 600, 6, 'Quantitative measurement of IgA antibodies against tissue transglutaminase for screening and monitoring of celiac disease', NOW(), NOW()),
  (gen_random_uuid(), 'UIBC - Unsaturated Iron Binding Capacity', 'UIBC-01', 'Biochemistry', 'Serum', 250, 4, 'Measures the reserve capacity of transferrin not bound to iron to evaluate iron metabolism and diagnose iron deficiency or overload', NOW(), NOW()),
  (gen_random_uuid(), 'Uric Acid Spot Urine', 'URIC-URINE-01', 'Biochemistry', 'Urine', 200, 4, 'Quantitative measurement of uric acid in spot urine to evaluate purine metabolism, renal uric acid handling, and stone risk', NOW(), NOW()),
  (gen_random_uuid(), 'Voriconazole Level', 'VORICO-01', 'Toxicology', 'Serum', 1500, 24, 'Therapeutic drug monitoring of voriconazole trough level to ensure efficacy and prevent hepatotoxicity in invasive fungal infections', NOW(), NOW()),
  (gen_random_uuid(), 'Widal Tube', 'WIDAL-TUBE-01', 'Serology', 'Serum', 200, 6, 'Tube agglutination method for quantitative titration of agglutinins against Salmonella typhi and paratyphi O and H antigens', NOW(), NOW()),
  (gen_random_uuid(), 'Zinc', 'ZINC-01', 'Biochemistry', 'Serum', 500, 12, 'Quantitative measurement of serum zinc to evaluate nutritional status, immune function, and wound healing capacity', NOW(), NOW()),
  (gen_random_uuid(), 'ZN Stain for AFB', 'ZN-AFB-01', 'Microbiology', 'Sputum', 250, 4, 'Ziehl-Neelsen acid-fast staining for microscopic detection of Mycobacterium tuberculosis and other acid-fast bacilli', NOW(), NOW()),

  (gen_random_uuid(), 'Thalassemia ( Hb electrophoresis)', 'THAL-01', 'Hematology', 'Whole Blood (EDTA)', 1500.00, 24, 'Hemoglobin electrophoresis to detect abnormal hemoglobins and screen for thalassemia.', NOW(), NOW()),
  (gen_random_uuid(), 'ABG (Arterial Blood Gas)', 'ABG-01', 'Biochemistry', 'Heparinized Whole Blood', 800.00, 2, 'Measures acidity (pH) and levels of oxygen and carbon dioxide in arterial blood.', NOW(), NOW()),
  (gen_random_uuid(), 'ACA IgG (Anti-Cardiolipin Antibody IgG)', 'ACA-IGG-01', 'Immunology', 'Serum', 750.00, 12, 'Measures IgG antibodies to cardiolipin, associated with Antiphospholipid Syndrome.', NOW(), NOW()),
  (gen_random_uuid(), 'ACA IgM (Anti-Cardiolipin Antibody IgM)', 'ACA-IGM-01', 'Immunology', 'Serum', 750.00, 12, 'Measures IgM antibodies to cardiolipin, associated with Antiphospholipid Syndrome.', NOW(), NOW()),
  (gen_random_uuid(), 'Aldosterone', 'ALDO-01', 'Hormone', 'Serum', 1200.00, 24, 'Measures aldosterone levels in serum to evaluate renin-aldosterone-angiotensin system.', NOW(), NOW()),
  (gen_random_uuid(), 'Allergy food & inhalant', 'ALLERGY-FI-01', 'Immunology', 'Serum', 3500.00, 24, 'Screening panel for common food and inhalant allergens.', NOW(), NOW()),
  (gen_random_uuid(), 'Allergy drugs', 'ALLERGY-DRUG-01', 'Immunology', 'Serum', 3000.00, 24, 'Screening panel for drug-specific IgE antibodies.', NOW(), NOW()),
  (gen_random_uuid(), 'Allergy food drug & inhalant', 'ALLERGY-FDI-01', 'Immunology', 'Serum', 5000.00, 24, 'Comprehensive screening panel for food, drug, and inhalant allergens.', NOW(), NOW()),
  (gen_random_uuid(), 'AMA (Anti-Mitochondrial Antibody)', 'AMA-01', 'Immunology', 'Serum', 800.00, 12, 'Measures anti-mitochondrial antibody levels, primarily used for PBC screening.', NOW(), NOW()),
  (gen_random_uuid(), 'ANA profile', 'ANA-PROF-01', 'Immunology', 'Serum', 2200.00, 24, 'Comprehensive profile checking for specific antinuclear antibodies (ENAs).', NOW(), NOW()),
  (gen_random_uuid(), 'ANCA by if', 'ANCA-IF-01', 'Immunology', 'Serum', 1500.00, 24, 'Anti-Neutrophil Cytoplasmic Antibody screening by Indirect Immunofluorescence.', NOW(), NOW()),
  (gen_random_uuid(), 'Anti HCV', 'HCV-ANTI-01', 'Serology', 'Serum', 500.00, 6, 'Detects antibodies against Hepatitis C Virus (HCV).', NOW(), NOW()),
  (gen_random_uuid(), 'APA IgG (Anti-Phosphatidylserine Antibody IgG)', 'APA-IGG-01', 'Immunology', 'Serum', 800.00, 24, 'Measures IgG antibodies to antiphospholipid/phosphatidylserine.', NOW(), NOW()),
  (gen_random_uuid(), 'APA IgM (Anti-Phosphatidylserine Antibody IgM)', 'APA-IGM-01', 'Immunology', 'Serum', 800.00, 24, 'Measures IgM antibodies to antiphospholipid/phosphatidylserine.', NOW(), NOW()),
  (gen_random_uuid(), 'Bicarbonate', 'BICARB-01', 'Biochemistry', 'Serum', 200.00, 4, 'Measures bicarbonate level in blood.', NOW(), NOW()),
  (gen_random_uuid(), 'BTCT (Bleeding Time & Clotting Time)', 'BTCT-01', 'Hematology', 'Whole Blood', 150.00, 2, 'Combined screen for Bleeding Time and Clotting Time.', NOW(), NOW()),
  (gen_random_uuid(), 'Calcium urine Random', 'CALC-UR-01', 'Biochemistry', 'Urine (Random)', 250.00, 6, 'Measures calcium levels in a random urine sample.', NOW(), NOW()),
  (gen_random_uuid(), 'Calcium urine 24 hours', 'CALC-U24-01', 'Biochemistry', 'Urine (24 Hours)', 350.00, 24, 'Measures total calcium excreted in a 24-hour urine sample.', NOW(), NOW()),
  (gen_random_uuid(), 'Chloride', 'CHLOR-01', 'Biochemistry', 'Serum', 150.00, 4, 'Measures chloride level in blood.', NOW(), NOW()),
  (gen_random_uuid(), 'Urine Chloride', 'CHLOR-UR-01', 'Biochemistry', 'Urine (Random)', 200.00, 6, 'Measures chloride level in urine.', NOW(), NOW()),
  (gen_random_uuid(), 'Chikungunya IgM ELISA', 'CHIK-ELISA-01', 'Serology', 'Serum', 800.00, 24, 'Semi-quantitative detection of Chikungunya IgM antibodies by ELISA.', NOW(), NOW()),
  (gen_random_uuid(), 'Creatinine Urine 24 Hrs', 'CREAT-U24-01', 'Biochemistry', 'Urine (24 Hours)', 350.00, 24, 'Measures total creatinine excreted in a 24-hour urine sample.', NOW(), NOW()),
  (gen_random_uuid(), 'CSF Routine examination', 'CSF-ROUT-01', 'Clinical Pathology', 'Cerebrospinal Fluid', 1200.00, 6, 'Routine physical, chemical, and microscopic examination of cerebrospinal fluid.', NOW(), NOW()),
  (gen_random_uuid(), 'Culture - Auto C/S Aerobic Blood 1 Bottle', 'CULT-BLOOD-01', 'Microbiology', 'Blood', 800.00, 72, 'Automated aerobic blood culture and sensitivity testing.', NOW(), NOW()),
  (gen_random_uuid(), 'DCT - Direct Coombs Test', 'DCT-01', 'Hematology', 'Whole Blood (EDTA)', 400.00, 4, 'Detects antibodies or complement proteins bound to the surface of red blood cells.', NOW(), NOW()),
  (gen_random_uuid(), 'Dengue PCR Viral Load', 'DENG-PCR-01', 'Serology', 'Serum', 2500.00, 24, 'Quantitative real-time PCR for Dengue virus RNA.', NOW(), NOW()),
  (gen_random_uuid(), 'DHEA - Dehydro Epiandrosterone', 'DHEA-01', 'Hormone', 'Serum', 900.00, 24, 'Measures unconjugated DHEA in serum to assess adrenal androgen levels.', NOW(), NOW()),
  (gen_random_uuid(), 'Dopamine Level', 'DOP-01', 'Hormone', 'Plasma', 1500.00, 24, 'Measures plasma dopamine (catecholamine) levels.', NOW(), NOW()),
  (gen_random_uuid(), 'Electrolytes Urine/Fluid', 'ELEC-UR-01', 'Biochemistry', 'Urine/Fluid', 500.00, 6, 'Measures sodium, potassium, and chloride in urine or body fluids.', NOW(), NOW()),
  (gen_random_uuid(), 'Erythropoetin', 'EPO-01', 'Hormone', 'Serum', 1200.00, 24, 'Measures erythropoietin (EPO) levels in serum.', NOW(), NOW()),
  (gen_random_uuid(), 'ABG - Blood Gas Analysis Arterial', 'BCH 11', 'Biochemistry', 'Arterial Blood', 1000.00, 4, 'Measures the acidity (pH) and the levels of oxygen and carbon dioxide in the blood from an artery.', NOW(), NOW()),
  (gen_random_uuid(), 'ACA - Anti Cardiolipin Antibody IgG', 'ECL 50.2', 'Immunology', 'Serum', 400.00, 24, 'Measures IgG antibodies to cardiolipin to evaluate autoimmune clotting disorders.', NOW(), NOW()),
  (gen_random_uuid(), 'ACA - Anti Cardiolipin Antibody IgM', 'ECL 50.1', 'Immunology', 'Serum', 400.00, 24, 'Measures IgM antibodies to cardiolipin to evaluate autoimmune clotting disorders.', NOW(), NOW()),
  (gen_random_uuid(), 'ACE - Angiotensin Converting Enzyme*', 'BIO 08', 'Biochemistry', 'Serum', 1500.00, 24, 'Measures angiotensin converting enzyme levels, often used in sarcoidosis evaluation.', NOW(), NOW()),
  (gen_random_uuid(), 'Acetone Serum', 'BM 12', 'Biochemistry', 'Serum', 200.00, 6, 'Measures acetone levels in serum.', NOW(), NOW()),
  (gen_random_uuid(), 'Acetone Urine', 'CPL 01', 'Clinical Pathology', 'Urine', 120.00, 4, 'Measures acetone levels in urine.', NOW(), NOW()),
  (gen_random_uuid(), 'ACTH - Adrenocorticotropic hormone*', 'BIO 02', 'Hormone', 'Plasma', 1000.00, 24, 'Measures adrenocorticotropic hormone (ACTH) levels to evaluate adrenal gland function.', NOW(), NOW()),
  (gen_random_uuid(), 'ADA - Adenosine Deaminase CSF', 'BCH 01.2', 'Biochemistry', 'Cerebrospinal Fluid (CSF)', 500.00, 12, 'Measures adenosine deaminase levels in cerebrospinal fluid (CSF).', NOW(), NOW()),
  (gen_random_uuid(), 'ADA - Adenosine Deaminase Fluid', 'BCH 01.3', 'Biochemistry', 'Body Fluid', 500.00, 12, 'Measures adenosine deaminase levels in pleural, peritoneal, or other body fluids.', NOW(), NOW()),
  (gen_random_uuid(), 'ADA - Adenosine Deaminase Serum', 'BCH 01.1', 'Biochemistry', 'Serum', 500.00, 12, 'Measures adenosine deaminase levels in serum.', NOW(), NOW()),
  (gen_random_uuid(), 'AEC - Absolute Eosinophil Count', 'AA 01', 'Hematology', 'Whole Blood (EDTA)', 180.00, 4, 'Measures absolute eosinophil count (AEC) in blood.', NOW(), NOW())
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
'{"min":0.0,"max":60.0}'::jsonb,NULL,
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
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='WIDAL-01'), 'Salmonella typhi ''O'' (TO)', NULL, 'select', 'Negative,1:40,1:80,1:160,1:320', 'input', NULL, NULL, 'Widal Titers', 1, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='WIDAL-01'), 'Salmonella typhi ''H'' (TH)', NULL, 'select', 'Negative,1:40,1:80,1:160,1:320', 'input', NULL, NULL, 'Widal Titers', 2, NULL, NULL, true, NOW(), NOW()),
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
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PGBS-01'), 'Post Glucose Blood Sugar', 'mg/dL', 'number', NULL, 'input', NULL, NULL, 'Blood Glucose', 1, '{"min":0,"max":140}'::jsonb, '{"low":50,"high":400}'::jsonb, true, NOW(), NOW()),

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
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CHOL-01'), 'Serum Cholesterol', 'mg/dL', 'number', NULL, 'input', NULL, NULL, 'Lipids', 1, '{"min":0.0,"max":200.0}'::jsonb, NULL, true, NOW(), NOW()),

-- SERUM TRIGLYCERIDES (TRIG-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TRIG-01'), 'Serum Triglycerides', 'mg/dL', 'number', NULL, 'input', NULL, NULL, 'Lipids', 1, '{"min":0.0,"max":150.0}'::jsonb, NULL, true, NOW(), NOW()),

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
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='URINE-01'), 'Budding Yeast', NULL, 'select', 'Absent,Present', 'input', NULL, NULL, 'MICROSCOPIC: ( After centrifugation at 2000 r.p.m. for 10 minutes )', 20, NULL, NULL, true, NOW(), NOW()),

-- ==========================================
-- NEW TEST FIELDS FOR BATCH (Protein CSF through ZN Stain)
-- ==========================================

-- PROTEIN CSF (PROT-CSF-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PROT-CSF-01'), 'CSF Protein', 'mg/dL', 'number', NULL, 'input', NULL, NULL, 'CSF Protein', 1, '{"min":15.0,"max":45.0}'::jsonb, '{"high":500.0}'::jsonb, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PROT-CSF-01'), 'Appearance', NULL, 'select', 'Clear,Turbid,Xanthochromic,Bloody', 'input', NULL, NULL, 'CSF Protein', 2, NULL, NULL, false, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PROT-CSF-01'), 'Remarks', NULL, 'textarea', NULL, 'input', NULL, NULL, 'CSF Protein', 3, NULL, NULL, false, NOW(), NOW()),

-- PROTEIN ELECTROPHORESIS (PROT-ELEC-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PROT-ELEC-01'), 'Total Protein', 'g/dL', 'number', NULL, 'input', NULL, NULL, 'Serum Proteins', 1, '{"min":6.0,"max":8.3}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PROT-ELEC-01'), 'Albumin', 'g/dL', 'number', NULL, 'input', NULL, NULL, 'Protein Fractions', 2, '{"min":3.5,"max":5.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PROT-ELEC-01'), 'Albumin %', '%', 'number', NULL, 'input', NULL, NULL, 'Protein Fractions', 3, '{"min":55.8,"max":66.1}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PROT-ELEC-01'), 'Alpha-1 Globulin', 'g/dL', 'number', NULL, 'input', NULL, NULL, 'Protein Fractions', 4, '{"min":0.1,"max":0.3}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PROT-ELEC-01'), 'Alpha-1 Globulin %', '%', 'number', NULL, 'input', NULL, NULL, 'Protein Fractions', 5, '{"min":2.9,"max":4.9}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PROT-ELEC-01'), 'Alpha-2 Globulin', 'g/dL', 'number', NULL, 'input', NULL, NULL, 'Protein Fractions', 6, '{"min":0.6,"max":1.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PROT-ELEC-01'), 'Alpha-2 Globulin %', '%', 'number', NULL, 'input', NULL, NULL, 'Protein Fractions', 7, '{"min":7.1,"max":11.8}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PROT-ELEC-01'), 'Beta Globulin', 'g/dL', 'number', NULL, 'input', NULL, NULL, 'Protein Fractions', 8, '{"min":0.7,"max":1.2}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PROT-ELEC-01'), 'Beta Globulin %', '%', 'number', NULL, 'input', NULL, NULL, 'Protein Fractions', 9, '{"min":8.4,"max":13.1}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PROT-ELEC-01'), 'Gamma Globulin', 'g/dL', 'number', NULL, 'input', NULL, NULL, 'Protein Fractions', 10, '{"min":0.7,"max":1.6}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PROT-ELEC-01'), 'Gamma Globulin %', '%', 'number', NULL, 'input', NULL, NULL, 'Protein Fractions', 11, '{"min":11.1,"max":18.8}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PROT-ELEC-01'), 'A/G Ratio', NULL, 'number', NULL, 'calculated', 'Albumin / (Alpha-1 Globulin + Alpha-2 Globulin + Beta Globulin + Gamma Globulin)', 'Albumin,Alpha-1 Globulin,Alpha-2 Globulin,Beta Globulin,Gamma Globulin', 'Protein Fractions', 12, '{"min":1.2,"max":2.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PROT-ELEC-01'), 'Interpretation', NULL, 'textarea', NULL, 'input', NULL, NULL, 'Interpretation', 13, NULL, NULL, false, NOW(), NOW()),

-- PROTEIN URINE (PROT-URINE-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PROT-URINE-01'), 'Urine Protein', 'mg/dL', 'number', NULL, 'input', NULL, NULL, 'Urine Protein', 1, '{"min":0.0,"max":15.0}'::jsonb, '{"high":300.0}'::jsonb, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PROT-URINE-01'), 'Urine Protein (Qualitative)', NULL, 'select', 'Absent,Trace,Present +,Present ++,Present +++,Present ++++', 'input', NULL, NULL, 'Urine Protein', 2, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='PROT-URINE-01'), 'Remarks', NULL, 'textarea', NULL, 'input', NULL, NULL, 'Urine Protein', 3, NULL, NULL, false, NOW(), NOW()),

-- QUADRUPLE MARKER (QUADM-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='QUADM-01'), 'Maternal AFP', 'ng/mL', 'number', NULL, 'input', NULL, NULL, 'Biochemical Markers', 1, '{"min":10.0,"max":50.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='QUADM-01'), 'Maternal AFP MoM', 'MoM', 'number', NULL, 'input', NULL, NULL, 'Biochemical Markers', 2, '{"min":0.5,"max":2.5}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='QUADM-01'), 'Total HCG', 'mIU/mL', 'number', NULL, 'input', NULL, NULL, 'Biochemical Markers', 3, '{"min":5000.0,"max":50000.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='QUADM-01'), 'Total HCG MoM', 'MoM', 'number', NULL, 'input', NULL, NULL, 'Biochemical Markers', 4, '{"min":0.5,"max":2.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='QUADM-01'), 'Unconjugated Estriol (uE3)', 'ng/mL', 'number', NULL, 'input', NULL, NULL, 'Biochemical Markers', 5, '{"min":0.5,"max":4.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='QUADM-01'), 'Unconjugated Estriol MoM', 'MoM', 'number', NULL, 'input', NULL, NULL, 'Biochemical Markers', 6, '{"min":0.5,"max":2.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='QUADM-01'), 'Inhibin A', 'pg/mL', 'number', NULL, 'input', NULL, NULL, 'Biochemical Markers', 7, '{"min":100.0,"max":600.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='QUADM-01'), 'Inhibin A MoM', 'MoM', 'number', NULL, 'input', NULL, NULL, 'Biochemical Markers', 8, '{"min":0.5,"max":2.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='QUADM-01'), 'Down Syndrome (Trisomy 21) Risk', 'ratio', 'text', NULL, 'input', NULL, NULL, 'Risk Calculation', 9, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='QUADM-01'), 'Edwards/Patau Syndrome (Trisomy 18/13) Risk', 'ratio', 'text', NULL, 'input', NULL, NULL, 'Risk Calculation', 10, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='QUADM-01'), 'Neural Tube Defects (NTD) Risk', 'ratio', 'text', NULL, 'input', NULL, NULL, 'Risk Calculation', 11, NULL, NULL, true, NOW(), NOW()),

-- RATIO BUN / CREATININE (BUN-CREAT-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='BUN-CREAT-01'), 'Blood Urea Nitrogen (BUN)', 'mg/dL', 'number', NULL, 'input', NULL, NULL, 'Renal Function', 1, '{"min":7.0,"max":20.0}'::jsonb, '{"high":100.0}'::jsonb, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='BUN-CREAT-01'), 'Serum Creatinine', 'mg/dL', 'number', NULL, 'input', NULL, NULL, 'Renal Function', 2, '{"min":0.6,"max":1.2}'::jsonb, '{"high":10.0}'::jsonb, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='BUN-CREAT-01'), 'BUN/Creatinine Ratio', NULL, 'number', NULL, 'calculated', 'Blood Urea Nitrogen (BUN) / Serum Creatinine', 'Blood Urea Nitrogen (BUN),Serum Creatinine', 'Renal Function', 3, '{"min":10.0,"max":20.0}'::jsonb, NULL, true, NOW(), NOW()),

-- RETICULOCYTE PANEL (RETIC-PNL-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='RETIC-PNL-01'), 'Reticulocyte Count', '%', 'number', NULL, 'input', NULL, NULL, 'Reticulocyte Panel', 1, '{"min":0.5,"max":2.5}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='RETIC-PNL-01'), 'Absolute Reticulocyte Count', '/uL', 'number', NULL, 'input', NULL, NULL, 'Reticulocyte Panel', 2, '{"min":25000,"max":75000}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='RETIC-PNL-01'), 'Hematocrit (PCV)', '%', 'number', NULL, 'input', NULL, NULL, 'Reticulocyte Panel', 3, '[{"age_min": 17, "age_min_unit": "years", "age_max": 110, "age_max_unit": "years", "sex": "female", "low": 37.0, "high": 47.0, "note": "ADULT"}, {"age_min": 17, "age_min_unit": "years", "age_max": 110, "age_max_unit": "years", "sex": "male", "low": 42.0, "high": 52.0, "note": "ADULT"}]'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='RETIC-PNL-01'), 'Corrected Reticulocyte Count', '%', 'number', NULL, 'calculated', '(Reticulocyte Count * Hematocrit (PCV)) / 45', 'Reticulocyte Count,Hematocrit (PCV)', 'Reticulocyte Panel', 4, '{"min":0.5,"max":2.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='RETIC-PNL-01'), 'Reticulocyte Production Index (RPI)', NULL, 'number', NULL, 'input', NULL, NULL, 'Reticulocyte Panel', 5, '{"min":1.0,"max":3.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='RETIC-PNL-01'), 'Interpretation', NULL, 'textarea', NULL, 'input', NULL, NULL, 'Interpretation', 6, NULL, NULL, false, NOW(), NOW()),

-- SODIUM Na+ (NA-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='NA-01'), 'Serum Sodium (Na+)', 'mmol/L', 'number', NULL, 'input', NULL, NULL, 'Electrolytes', 1, '{"min":136,"max":145}'::jsonb, '{"low":120,"high":160}'::jsonb, true, NOW(), NOW()),

-- SODIUM Na+ URINE (NA-URINE-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='NA-URINE-01'), 'Urine Sodium (Na+)', 'mmol/L', 'number', NULL, 'input', NULL, NULL, 'Urine Electrolytes', 1, '{"min":40,"max":220}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='NA-URINE-01'), 'Specimen Type', NULL, 'select', 'Spot Urine,24-Hour Urine', 'input', NULL, NULL, 'Urine Electrolytes', 2, NULL, NULL, false, NOW(), NOW()),

-- STONE ANALYSIS (STONE-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STONE-01'), 'Stone Type', NULL, 'select', 'Calcium Oxalate Monohydrate,Calcium Oxalate Dihydrate,Calcium Phosphate (Apatite),Uric Acid,Struvite (Magnesium Ammonium Phosphate),Cystine,Mixed', 'input', NULL, NULL, 'Stone Composition', 1, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STONE-01'), 'Physical Appearance', NULL, 'textarea', NULL, 'input', NULL, NULL, 'Stone Composition', 2, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STONE-01'), 'Size', 'mm', 'text', NULL, 'input', NULL, NULL, 'Stone Composition', 3, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STONE-01'), 'Weight', 'mg', 'number', NULL, 'input', NULL, NULL, 'Stone Composition', 4, NULL, NULL, false, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STONE-01'), 'Calcium', NULL, 'select', 'Absent,Present', 'input', NULL, NULL, 'Chemical Analysis', 5, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STONE-01'), 'Oxalate', NULL, 'select', 'Absent,Present', 'input', NULL, NULL, 'Chemical Analysis', 6, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STONE-01'), 'Phosphate', NULL, 'select', 'Absent,Present', 'input', NULL, NULL, 'Chemical Analysis', 7, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STONE-01'), 'Uric Acid', NULL, 'select', 'Absent,Present', 'input', NULL, NULL, 'Chemical Analysis', 8, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STONE-01'), 'Magnesium Ammonium Phosphate', NULL, 'select', 'Absent,Present', 'input', NULL, NULL, 'Chemical Analysis', 9, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STONE-01'), 'Cystine', NULL, 'select', 'Absent,Present', 'input', NULL, NULL, 'Chemical Analysis', 10, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STONE-01'), 'Carbonate', NULL, 'select', 'Absent,Present', 'input', NULL, NULL, 'Chemical Analysis', 11, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STONE-01'), 'Method', NULL, 'select', 'Chemical Analysis,FTIR Spectroscopy,X-Ray Diffraction', 'input', NULL, NULL, 'Method', 12, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='STONE-01'), 'Interpretation', NULL, 'textarea', NULL, 'input', NULL, NULL, 'Interpretation', 13, NULL, NULL, false, NOW(), NOW()),

-- TB - AUTO AFB CULTURE (TB-AFB-CULT-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TB-AFB-CULT-01'), 'Culture Result', NULL, 'select', 'No Growth,Growth Detected,Contaminated', 'input', NULL, NULL, 'AFB Culture', 1, NULL, '{"positive":"Growth Detected"}'::jsonb, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TB-AFB-CULT-01'), 'Organism Identified', NULL, 'select', 'Not Applicable,Mycobacterium tuberculosis complex,Mycobacterium avium complex,Mycobacterium kansasii,Mycobacterium fortuitum,Non-tuberculous Mycobacteria (NTM),Other', 'input', NULL, NULL, 'AFB Culture', 2, NULL, NULL, false, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TB-AFB-CULT-01'), 'Days to Positivity', 'days', 'number', NULL, 'input', NULL, NULL, 'AFB Culture', 3, NULL, NULL, false, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TB-AFB-CULT-01'), 'Method', NULL, 'select', 'BACTEC MGIT 960,BACTEC 460TB,Lowenstein-Jensen (LJ) Culture', 'input', NULL, NULL, 'Method', 4, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TB-AFB-CULT-01'), 'Drug Sensitivity - Isoniazid', NULL, 'select', 'Sensitive,Resistant,Not Tested', 'input', NULL, NULL, 'Drug Susceptibility', 5, NULL, NULL, false, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TB-AFB-CULT-01'), 'Drug Sensitivity - Rifampicin', NULL, 'select', 'Sensitive,Resistant,Not Tested', 'input', NULL, NULL, 'Drug Susceptibility', 6, NULL, NULL, false, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TB-AFB-CULT-01'), 'Drug Sensitivity - Ethambutol', NULL, 'select', 'Sensitive,Resistant,Not Tested', 'input', NULL, NULL, 'Drug Susceptibility', 7, NULL, NULL, false, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TB-AFB-CULT-01'), 'Drug Sensitivity - Pyrazinamide', NULL, 'select', 'Sensitive,Resistant,Not Tested', 'input', NULL, NULL, 'Drug Susceptibility', 8, NULL, NULL, false, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TB-AFB-CULT-01'), 'Drug Sensitivity - Streptomycin', NULL, 'select', 'Sensitive,Resistant,Not Tested', 'input', NULL, NULL, 'Drug Susceptibility', 9, NULL, NULL, false, NOW(), NOW()),

-- THYROID FUNCTION TEST FREE (TFT-FREE-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TFT-FREE-01'), 'TSH', 'uIU/mL', 'number', NULL, 'input', NULL, NULL, 'Thyroid Hormones', 1, '{"min":0.40,"max":4.50}'::jsonb, '{"low":0.01,"high":100.0}'::jsonb, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TFT-FREE-01'), 'Free T3', 'pg/mL', 'number', NULL, 'input', NULL, NULL, 'Thyroid Hormones', 2, '{"min":2.00,"max":4.40}'::jsonb, '{"low":0.5,"high":20.0}'::jsonb, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TFT-FREE-01'), 'Free T4', 'ng/dL', 'number', NULL, 'input', NULL, NULL, 'Thyroid Hormones', 3, '{"min":0.80,"max":1.80}'::jsonb, '{"low":0.2,"high":7.0}'::jsonb, true, NOW(), NOW()),

-- TORCH 4 IgG (TORCH4-IGG-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TORCH4-IGG-01'), 'Toxoplasma gondii IgG', 'IU/mL', 'number', NULL, 'input', NULL, NULL, 'Toxoplasma', 1, '[{"age_group":"all","sex":"any","note":"Negative <1.6 | Equivocal 1.6–3.0 | Positive >3.0"}]'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TORCH4-IGG-01'), 'Rubella IgG', 'IU/mL', 'number', NULL, 'input', NULL, NULL, 'Rubella', 2, '[{"age_group":"all","sex":"any","note":"Negative <5.0 | Equivocal 5.0–10.0 | Positive >10.0 (Immune)"}]'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TORCH4-IGG-01'), 'CMV IgG', 'AU/mL', 'number', NULL, 'input', NULL, NULL, 'CMV', 3, '[{"age_group":"all","sex":"any","note":"Negative <6.0 | Equivocal 6.0–12.0 | Positive >12.0"}]'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TORCH4-IGG-01'), 'HSV 1/2 IgG', 'Index', 'number', NULL, 'input', NULL, NULL, 'Herpes', 4, '[{"age_group":"all","sex":"any","note":"Negative <0.9 | Equivocal 0.9–1.1 | Positive >1.1"}]'::jsonb, NULL, true, NOW(), NOW()),

-- TORCH 4 IgM (TORCH4-IGM-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TORCH4-IGM-01'), 'Toxoplasma gondii IgM', 'Index', 'number', NULL, 'input', NULL, NULL, 'Toxoplasma', 1, '[{"age_group":"all","sex":"any","note":"Negative <0.55 | Equivocal 0.55–0.65 | Positive >0.65"}]'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TORCH4-IGM-01'), 'Rubella IgM', 'Index', 'number', NULL, 'input', NULL, NULL, 'Rubella', 2, '[{"age_group":"all","sex":"any","note":"Negative <0.8 | Equivocal 0.8–1.2 | Positive >1.2"}]'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TORCH4-IGM-01'), 'CMV IgM', 'Index', 'number', NULL, 'input', NULL, NULL, 'CMV', 3, '[{"age_group":"all","sex":"any","note":"Negative <0.7 | Equivocal 0.7–1.0 | Positive >1.0"}]'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TORCH4-IGM-01'), 'HSV 1/2 IgM', 'Index', 'number', NULL, 'input', NULL, NULL, 'Herpes', 4, '[{"age_group":"all","sex":"any","note":"Negative <0.9 | Equivocal 0.9–1.1 | Positive >1.1"}]'::jsonb, NULL, true, NOW(), NOW()),

-- TOXOPLASMA IgG (TOXO-IGG-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TOXO-IGG-01'), 'Toxoplasma IgG', 'IU/mL', 'number', NULL, 'input', NULL, NULL, 'Toxoplasma Serology', 1, '[{"age_group":"all","sex":"any","note":"Negative <1.6 | Equivocal 1.6–3.0 | Positive >3.0"}]'::jsonb, NULL, true, NOW(), NOW()),

-- TOXOPLASMA IgM (TOXO-IGM-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TOXO-IGM-01'), 'Toxoplasma IgM', 'Index', 'number', NULL, 'input', NULL, NULL, 'Toxoplasma Serology', 1, '[{"age_group":"all","sex":"any","note":"Negative <0.55 | Equivocal 0.55–0.65 | Positive >0.65"}]'::jsonb, NULL, true, NOW(), NOW()),

-- TRANSFERRIN SATURATION (TSAT-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TSAT-01'), 'Serum Iron', 'ug/dL', 'number', NULL, 'input', NULL, NULL, 'Iron Studies', 1, '{"male":{"min":65,"max":176},"female":{"min":50,"max":170}}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TSAT-01'), 'TIBC', 'ug/dL', 'number', NULL, 'input', NULL, NULL, 'Iron Studies', 2, '{"min":250,"max":450}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TSAT-01'), 'Transferrin Saturation', '%', 'number', NULL, 'calculated', '(Serum Iron / TIBC) * 100', 'Serum Iron,TIBC', 'Iron Studies', 3, '{"min":20,"max":50}'::jsonb, '{"low":10,"high":70}'::jsonb, true, NOW(), NOW()),

-- TROPONIN I HIGH SENSITIVE CLIA (HS-TROPI-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='HS-TROPI-01'), 'hs-Troponin I', 'ng/L', 'number', NULL, 'input', NULL, NULL, 'Cardiac Markers', 1, '[{"age_min": 17, "age_min_unit": "years", "age_max": 110, "age_max_unit": "years", "sex": "female", "low": 0.0, "high": 15.6, "note": "ADULT FEMALE"}, {"age_min": 17, "age_min_unit": "years", "age_max": 110, "age_max_unit": "years", "sex": "male", "low": 0.0, "high": 34.2, "note": "ADULT MALE"}]'::jsonb, '{"high":100.0}'::jsonb, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='HS-TROPI-01'), 'Method', NULL, 'text', 'Chemiluminescence Immunoassay (CLIA)', 'input', NULL, NULL, 'Method', 2, NULL, NULL, true, NOW(), NOW()),

-- TROPONIN T HIGH SENSITIVE CLIA (HS-TROPT-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='HS-TROPT-01'), 'hs-Troponin T', 'ng/L', 'number', NULL, 'input', NULL, NULL, 'Cardiac Markers', 1, '{"min":0.0,"max":14.0}'::jsonb, '{"high":52.0}'::jsonb, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='HS-TROPT-01'), 'Method', NULL, 'text', 'Chemiluminescence Immunoassay (CLIA)', 'input', NULL, NULL, 'Method', 2, NULL, NULL, true, NOW(), NOW()),

-- TTG IgA (TTG-IGA-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TTG-IGA-01'), 'tTG IgA', 'U/mL', 'number', NULL, 'input', NULL, NULL, 'Celiac Screening', 1, '[{"age_group":"all","sex":"any","note":"Negative <4.0 | Weak Positive 4.0–10.0 | Positive >10.0"}]'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TTG-IGA-01'), 'Total IgA', 'mg/dL', 'number', NULL, 'input', NULL, NULL, 'Celiac Screening', 2, '{"min":70,"max":400}'::jsonb, NULL, false, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='TTG-IGA-01'), 'Interpretation', NULL, 'textarea', NULL, 'input', NULL, NULL, 'Interpretation', 3, NULL, NULL, false, NOW(), NOW()),

-- UIBC (UIBC-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='UIBC-01'), 'UIBC', 'ug/dL', 'number', NULL, 'input', NULL, NULL, 'Iron Studies', 1, '{"min":110,"max":370}'::jsonb, NULL, true, NOW(), NOW()),

-- URIC ACID SPOT URINE (URIC-URINE-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='URIC-URINE-01'), 'Urine Uric Acid', 'mg/dL', 'number', NULL, 'input', NULL, NULL, 'Urine Chemistry', 1, '{"min":15.0,"max":68.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='URIC-URINE-01'), 'Urine Creatinine', 'mg/dL', 'number', NULL, 'input', NULL, NULL, 'Urine Chemistry', 2, '{"min":20,"max":320}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='URIC-URINE-01'), 'Uric Acid/Creatinine Ratio', NULL, 'number', NULL, 'calculated', 'Urine Uric Acid / Urine Creatinine', 'Urine Uric Acid,Urine Creatinine', 'Urine Chemistry', 3, '{"min":0.2,"max":0.6}'::jsonb, NULL, true, NOW(), NOW()),

-- VORICONAZOLE LEVEL (VORICO-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='VORICO-01'), 'Voriconazole Trough Level', 'ug/mL', 'number', NULL, 'input', NULL, NULL, 'Drug Level', 1, '{"min":1.0,"max":5.5}'::jsonb, '{"low":0.5,"high":6.0}'::jsonb, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='VORICO-01'), 'Time of Last Dose', NULL, 'text', NULL, 'input', NULL, NULL, 'Drug Level', 2, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='VORICO-01'), 'Time of Sample', NULL, 'text', NULL, 'input', NULL, NULL, 'Drug Level', 3, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='VORICO-01'), 'Interpretation', NULL, 'textarea', NULL, 'input', NULL, NULL, 'Interpretation', 4, NULL, NULL, false, NOW(), NOW()),

-- WIDAL TUBE (WIDAL-TUBE-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='WIDAL-TUBE-01'), 'Salmonella typhi ''O'' (TO)', NULL, 'select', 'Negative,1:20,1:40,1:80,1:160,1:320,1:640,1:1280', 'input', NULL, NULL, 'Widal Titers', 1, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='WIDAL-TUBE-01'), 'Salmonella typhi ''H'' (TH)', NULL, 'select', 'Negative,1:20,1:40,1:80,1:160,1:320,1:640,1:1280', 'input', NULL, NULL, 'Widal Titers', 2, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='WIDAL-TUBE-01'), 'Salmonella paratyphi ''AH'' (AH)', NULL, 'select', 'Negative,1:20,1:40,1:80,1:160,1:320,1:640,1:1280', 'input', NULL, NULL, 'Widal Titers', 3, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='WIDAL-TUBE-01'), 'Salmonella paratyphi ''BH'' (BH)', NULL, 'select', 'Negative,1:20,1:40,1:80,1:160,1:320,1:640,1:1280', 'input', NULL, NULL, 'Widal Titers', 4, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='WIDAL-TUBE-01'), 'Method', NULL, 'text', 'Tube Agglutination', 'input', NULL, NULL, 'Method', 5, NULL, NULL, true, NOW(), NOW()),

-- ZINC (ZINC-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ZINC-01'), 'Serum Zinc', 'ug/dL', 'number', NULL, 'input', NULL, NULL, 'Trace Elements', 1, '{"min":60,"max":120}'::jsonb, '{"low":30,"high":200}'::jsonb, true, NOW(), NOW()),

-- ZN STAIN FOR AFB (ZN-AFB-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ZN-AFB-01'), 'ZN Stain Result', NULL, 'select', 'Negative (No AFB Seen),Scanty (1-9 AFB/100 Fields),1+ (10-99 AFB/100 Fields),2+ (1-10 AFB/Field),3+ (>10 AFB/Field)', 'input', NULL, NULL, 'AFB Smear', 1, NULL, '{"positive":"Scanty (1-9 AFB/100 Fields)"}'::jsonb, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ZN-AFB-01'), 'Specimen Type', NULL, 'select', 'Sputum,BAL Fluid,Pleural Fluid,CSF,Urine,Tissue,Other', 'input', NULL, NULL, 'AFB Smear', 2, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ZN-AFB-01'), 'Remarks', NULL, 'textarea', NULL, 'input', NULL, NULL, 'AFB Smear', 3, NULL, NULL, false, NOW(), NOW()),
-- Thalassemia (Hb Electrophoresis) Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='THAL-01'), 'Hb A', '%', 'number', NULL, 'input', NULL, NULL, 'Hemoglobin Electrophoresis', 1, '{"min":95.0,"max":98.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='THAL-01'), 'Hb A2', '%', 'number', NULL, 'input', NULL, NULL, 'Hemoglobin Electrophoresis', 2, '{"min":1.5,"max":3.5}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='THAL-01'), 'Hb F', '%', 'number', NULL, 'input', NULL, NULL, 'Hemoglobin Electrophoresis', 3, '{"min":0.0,"max":2.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='THAL-01'), 'Hb S', '%', 'number', NULL, 'input', NULL, NULL, 'Hemoglobin Electrophoresis', 4, '{"min":0.0,"max":0.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='THAL-01'), 'Hb C', '%', 'number', NULL, 'input', NULL, NULL, 'Hemoglobin Electrophoresis', 5, '{"min":0.0,"max":0.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='THAL-01'), 'Hb D', '%', 'number', NULL, 'input', NULL, NULL, 'Hemoglobin Electrophoresis', 6, '{"min":0.0,"max":0.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='THAL-01'), 'Hb E', '%', 'number', NULL, 'input', NULL, NULL, 'Hemoglobin Electrophoresis', 7, '{"min":0.0,"max":0.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='THAL-01'), 'Electrophoresis Impression', NULL, 'textarea', 'Normal hemoglobin pattern,Beta thalassemia minor,Beta thalassemia major,Sickle cell trait,Sickle cell disease,Hb D trait,Hb E trait', 'input', NULL, NULL, 'Hemoglobin Electrophoresis', 8, NULL, NULL, false, NOW(), NOW()),

-- ABG Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ABG-01'), 'pH', NULL, 'number', NULL, 'input', NULL, NULL, 'Blood Gas Parameters', 1, '{"min":7.35,"max":7.45}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ABG-01'), 'pCO2', 'mmHg', 'number', NULL, 'input', NULL, NULL, 'Blood Gas Parameters', 2, '{"min":35.0,"max":45.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ABG-01'), 'pO2', 'mmHg', 'number', NULL, 'input', NULL, NULL, 'Blood Gas Parameters', 3, '{"min":75.0,"max":100.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ABG-01'), 'HCO3', 'mmol/L', 'number', NULL, 'input', NULL, NULL, 'Blood Gas Parameters', 4, '{"min":22.0,"max":26.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ABG-01'), 'sO2 (Oxygen Saturation)', '%', 'number', NULL, 'input', NULL, NULL, 'Blood Gas Parameters', 5, '{"min":95.0,"max":100.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ABG-01'), 'Base Excess', 'mmol/L', 'number', NULL, 'input', NULL, NULL, 'Blood Gas Parameters', 6, '{"min":-2.0,"max":2.0}'::jsonb, NULL, true, NOW(), NOW()),

-- ACA IgG Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ACA-IGG-01'), 'ACA IgG Level', 'GPL', 'number', NULL, 'input', NULL, NULL, 'Antiphospholipid Antibodies', 1, '[{"age_group":"all","sex":"any","low":0.0,"high":10.0,"note":"Negative <10 GPL, Equivocal 10-40 GPL, Positive >40 GPL"}]'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ACA-IGG-01'), 'ACA IgG Result', NULL, 'select', 'Negative,Equivocal,Positive', 'input', NULL, NULL, 'Antiphospholipid Antibodies', 2, NULL, NULL, true, NOW(), NOW()),

-- ACA IgM Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ACA-IGM-01'), 'ACA IgM Level', 'MPL', 'number', NULL, 'input', NULL, NULL, 'Antiphospholipid Antibodies', 1, '[{"age_group":"all","sex":"any","low":0.0,"high":10.0,"note":"Negative <10 MPL, Equivocal 10-40 MPL, Positive >40 MPL"}]'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ACA-IGM-01'), 'ACA IgM Result', NULL, 'select', 'Negative,Equivocal,Positive', 'input', NULL, NULL, 'Antiphospholipid Antibodies', 2, NULL, NULL, true, NOW(), NOW()),

-- Aldosterone Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ALDO-01'), 'Aldosterone (Serum)', 'ng/dL', 'number', NULL, 'input', NULL, NULL, 'Adrenal Hormones', 1, '[{"age_group":"all","sex":"any","low":3.0,"high":30.0,"note":"Upright: 4.0-31.0 ng/dL, Supine: 1.0-16.0 ng/dL"}]'::jsonb, NULL, true, NOW(), NOW()),

-- Allergy food & inhalant Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ALLERGY-FI-01'), 'Total IgE', 'IU/mL', 'number', NULL, 'input', NULL, NULL, 'Allergy Profile', 1, '{"min":0.0,"max":100.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ALLERGY-FI-01'), 'Specific IgE - Food Panel', 'kUA/L', 'number', NULL, 'input', NULL, NULL, 'Allergy Profile', 2, '{"min":0.00,"max":0.35}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ALLERGY-FI-01'), 'Specific IgE - Inhalant Panel', 'kUA/L', 'number', NULL, 'input', NULL, NULL, 'Allergy Profile', 3, '{"min":0.00,"max":0.35}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ALLERGY-FI-01'), 'Allergy Screen Result', NULL, 'select', 'Negative,Positive', 'input', NULL, NULL, 'Allergy Profile', 4, NULL, NULL, true, NOW(), NOW()),

-- Allergy drugs Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ALLERGY-DRUG-01'), 'Total IgE', 'IU/mL', 'number', NULL, 'input', NULL, NULL, 'Allergy Profile', 1, '{"min":0.0,"max":100.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ALLERGY-DRUG-01'), 'Specific IgE - Drug Panel', 'kUA/L', 'number', NULL, 'input', NULL, NULL, 'Allergy Profile', 2, '{"min":0.00,"max":0.35}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ALLERGY-DRUG-01'), 'Allergy Screen Result', NULL, 'select', 'Negative,Positive', 'input', NULL, NULL, 'Allergy Profile', 3, NULL, NULL, true, NOW(), NOW()),

-- Allergy food drug & inhalant Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ALLERGY-FDI-01'), 'Total IgE', 'IU/mL', 'number', NULL, 'input', NULL, NULL, 'Allergy Profile', 1, '{"min":0.0,"max":100.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ALLERGY-FDI-01'), 'Specific IgE - Food Panel', 'kUA/L', 'number', NULL, 'input', NULL, NULL, 'Allergy Profile', 2, '{"min":0.00,"max":0.35}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ALLERGY-FDI-01'), 'Specific IgE - Inhalant Panel', 'kUA/L', 'number', NULL, 'input', NULL, NULL, 'Allergy Profile', 3, '{"min":0.00,"max":0.35}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ALLERGY-FDI-01'), 'Specific IgE - Drug Panel', 'kUA/L', 'number', NULL, 'input', NULL, NULL, 'Allergy Profile', 4, '{"min":0.00,"max":0.35}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ALLERGY-FDI-01'), 'Allergy Screen Result', NULL, 'select', 'Negative,Positive', 'input', NULL, NULL, 'Allergy Profile', 5, NULL, NULL, true, NOW(), NOW()),

-- AMA Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='AMA-01'), 'AMA Titer', NULL, 'select', '<1:20,1:20,1:40,1:80,1:160,1:320,>1:320', 'input', NULL, NULL, 'Autoimmune Antibodies', 1, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='AMA-01'), 'AMA (ELISA)', 'Units/mL', 'number', NULL, 'input', NULL, NULL, 'Autoimmune Antibodies', 2, '[{"age_group":"all","sex":"any","low":0.0,"high":20.0,"note":"Negative <20 Units/mL, Equivocal 20-25 Units/mL, Positive >25 Units/mL"}]'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='AMA-01'), 'AMA Result', NULL, 'select', 'Negative,Equivocal,Positive', 'input', NULL, NULL, 'Autoimmune Antibodies', 3, NULL, NULL, true, NOW(), NOW()),

-- ANA Profile Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ANA-PROF-01'), 'ANA Primary Screening', NULL, 'select', 'Negative,Positive', 'input', NULL, NULL, 'ANA Profile Summary', 1, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ANA-PROF-01'), 'ANA Titer', NULL, 'text', NULL, 'input', NULL, NULL, 'ANA Profile Summary', 2, NULL, NULL, false, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ANA-PROF-01'), 'ANA Pattern', NULL, 'select', 'Homogeneous,Speckled,Nucleolar,Centromere,Peripheral,Cytoplasmic,Mixed,Negative', 'input', NULL, NULL, 'ANA Profile Summary', 3, NULL, NULL, false, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ANA-PROF-01'), 'Anti-dsDNA', 'IU/mL', 'number', NULL, 'input', NULL, NULL, 'Specific Antibodies', 4, '{"max":30.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ANA-PROF-01'), 'Anti-Sm', 'Ratio', 'number', NULL, 'input', NULL, NULL, 'Specific Antibodies', 5, '{"max":1.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ANA-PROF-01'), 'Anti-SSA', 'Ratio', 'number', NULL, 'input', NULL, NULL, 'Specific Antibodies', 6, '{"max":1.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ANA-PROF-01'), 'Anti-SSB', 'Ratio', 'number', NULL, 'input', NULL, NULL, 'Specific Antibodies', 7, '{"max":1.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ANA-PROF-01'), 'Anti-RNP', 'Ratio', 'number', NULL, 'input', NULL, NULL, 'Specific Antibodies', 8, '{"max":1.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ANA-PROF-01'), 'Anti-Scl-70', 'Ratio', 'number', NULL, 'input', NULL, NULL, 'Specific Antibodies', 9, '{"max":1.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ANA-PROF-01'), 'Anti-Jo-1', 'Ratio', 'number', NULL, 'input', NULL, NULL, 'Specific Antibodies', 10, '{"max":1.0}'::jsonb, NULL, true, NOW(), NOW()),

-- ANCA by if Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ANCA-IF-01'), 'c-ANCA (PR3) Titer', NULL, 'select', '<1:20,1:20,1:40,1:80,1:160,1:320,>1:320', 'input', NULL, NULL, 'ANCA Serology', 1, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ANCA-IF-01'), 'p-ANCA (MPO) Titer', NULL, 'select', '<1:20,1:20,1:40,1:80,1:160,1:320,>1:320', 'input', NULL, NULL, 'ANCA Serology', 2, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ANCA-IF-01'), 'Atypical ANCA', NULL, 'select', 'Negative,Positive', 'input', NULL, NULL, 'ANCA Serology', 3, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ANCA-IF-01'), 'ANCA Impression', NULL, 'text', NULL, 'input', NULL, NULL, 'ANCA Serology', 4, NULL, NULL, false, NOW(), NOW()),

-- Anti HCV Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='HCV-ANTI-01'), 'Anti HCV (ELISA)', 'S/CO', 'number', NULL, 'input', NULL, NULL, 'Viral Serology', 1, '{"max":1.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='HCV-ANTI-01'), 'Anti HCV Result', NULL, 'select', 'Negative,Equivocal,Positive', 'input', NULL, NULL, 'Viral Serology', 2, NULL, NULL, true, NOW(), NOW()),

-- Anti TG Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ATG-01'), 'Anti-Thyroglobulin Antibody', 'IU/mL', 'number', NULL, 'input', NULL, NULL, 'Thyroid Autoantibodies', 1, '{"max":115.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ATG-01'), 'Anti-TG Result', NULL, 'select', 'Negative,Positive', 'input', NULL, NULL, 'Thyroid Autoantibodies', 2, NULL, NULL, true, NOW(), NOW()),

-- APA IgG Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='APA-IGG-01'), 'APA IgG Level', 'GPL Units/mL', 'number', NULL, 'input', NULL, NULL, 'Antiphospholipid Antibodies', 1, '[{"age_group":"all","sex":"any","low":0.0,"high":15.0,"note":"Negative <15, Weak Positive 15-39, Positive >=40"}]'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='APA-IGG-01'), 'APA IgG Result', NULL, 'select', 'Negative,Weak Positive,Positive', 'input', NULL, NULL, 'Antiphospholipid Antibodies', 2, NULL, NULL, true, NOW(), NOW()),

-- APA IgM Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='APA-IGM-01'), 'APA IgM Level', 'MPL Units/mL', 'number', NULL, 'input', NULL, NULL, 'Antiphospholipid Antibodies', 1, '[{"age_group":"all","sex":"any","low":0.0,"high":15.0,"note":"Negative <15, Weak Positive 15-39, Positive >=40"}]'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='APA-IGM-01'), 'APA IgM Result', NULL, 'select', 'Negative,Weak Positive,Positive', 'input', NULL, NULL, 'Antiphospholipid Antibodies', 2, NULL, NULL, true, NOW(), NOW()),

-- Bicarbonate Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='BICARB-01'), 'Bicarbonate (HCO3)', 'mmol/L', 'number', NULL, 'input', NULL, NULL, 'Acid-Base Electrolytes', 1, '{"min":22.0,"max":29.0}'::jsonb, NULL, true, NOW(), NOW()),

-- BTCT Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='BTCT-01'), 'Bleeding Time (BT)', 'minutes', 'number', NULL, 'input', NULL, NULL, 'Coagulation Parameters', 1, '{"min":2.0,"max":7.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='BTCT-01'), 'Clotting Time (CT)', 'minutes', 'number', NULL, 'input', NULL, NULL, 'Coagulation Parameters', 2, '{"min":5.0,"max":15.0}'::jsonb, NULL, true, NOW(), NOW()),

-- Calcium urine Random Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CALC-UR-01'), 'Urine Calcium (Random)', 'mg/dL', 'number', NULL, 'input', NULL, NULL, 'Urine Electrolytes', 1, '[{"age_group":"all","sex":"any","low":0.0,"high":20.0,"note":"No absolute ref range; highly dependent on diet."}]'::jsonb, NULL, true, NOW(), NOW()),

-- Calcium urine 24 hours Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CALC-U24-01'), '24 Hour Urine Volume', 'mL', 'number', NULL, 'input', NULL, NULL, 'Urine Calcium 24h', 1, '{"min":1000.0,"max":2000.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CALC-U24-01'), 'Urine Calcium Concentration', 'mg/dL', 'number', NULL, 'input', NULL, NULL, 'Urine Calcium 24h', 2, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CALC-U24-01'), '24 Hour Urine Calcium Excretion', 'mg/24 hr', 'number', NULL, 'calculated', '(24 Hour Urine Volume * Urine Calcium Concentration) / 100', '24 Hour Urine Volume,Urine Calcium Concentration', 'Urine Calcium 24h', 3, '{"min":100.0,"max":300.0}'::jsonb, NULL, true, NOW(), NOW()),

-- Chloride Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CHLOR-01'), 'Chloride (Serum)', 'mmol/L', 'number', NULL, 'input', NULL, NULL, 'Serum Electrolytes', 1, '{"min":96.0,"max":106.0}'::jsonb, NULL, true, NOW(), NOW()),

-- Urine Chloride Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CHLOR-UR-01'), 'Urine Chloride', 'mmol/L', 'number', NULL, 'input', NULL, NULL, 'Urine Electrolytes', 1, '{"min":20.0,"max":110.0}'::jsonb, NULL, true, NOW(), NOW()),

-- Chikungunya IgM ELISA Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CHIK-ELISA-01'), 'Chikungunya IgM ELISA Index', 'Index', 'number', NULL, 'input', NULL, NULL, 'Chikungunya Serology', 1, '[{"age_group":"all","sex":"any","low":0.0,"high":0.9,"note":"Negative <0.9, Equivocal 0.9-1.1, Positive >1.1"}]'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CHIK-ELISA-01'), 'Chikungunya IgM ELISA Result', NULL, 'select', 'Negative,Equivocal,Positive', 'input', NULL, NULL, 'Chikungunya Serology', 2, NULL, NULL, true, NOW(), NOW()),

-- Creatinine Urine 24 Hrs Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CREAT-U24-01'), '24 Hour Urine Volume', 'mL', 'number', NULL, 'input', NULL, NULL, 'Urine Creatinine 24h', 1, '{"min":1000.0,"max":2000.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CREAT-U24-01'), 'Urine Creatinine Concentration', 'mg/dL', 'number', NULL, 'input', NULL, NULL, 'Urine Creatinine 24h', 2, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CREAT-U24-01'), '24 Hour Urine Creatinine Excretion', 'g/24 hr', 'number', NULL, 'calculated', '(24 Hour Urine Volume * Urine Creatinine Concentration) / 100000', '24 Hour Urine Volume,Urine Creatinine Concentration', 'Urine Creatinine 24h', 3, '[{"age_group":"all","sex":"male","low":1.0,"high":2.0},{"age_group":"all","sex":"female","low":0.8,"high":1.8}]'::jsonb, NULL, true, NOW(), NOW()),

-- CSF Routine examination Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CSF-ROUT-01'), 'CSF Colour', NULL, 'select', 'Colorless,Xanthochromic,Bloody,Turbid', 'input', NULL, NULL, 'Macroscopic Examination', 1, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CSF-ROUT-01'), 'CSF Appearance', NULL, 'select', 'Clear,Hazy,Turbid', 'input', NULL, NULL, 'Macroscopic Examination', 2, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CSF-ROUT-01'), 'CSF Protein', 'mg/dL', 'number', NULL, 'input', NULL, NULL, 'Chemical Examination', 3, '{"min":15.0,"max":45.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CSF-ROUT-01'), 'CSF Glucose', 'mg/dL', 'number', NULL, 'input', NULL, NULL, 'Chemical Examination', 4, '{"min":50.0,"max":80.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CSF-ROUT-01'), 'CSF Chloride', 'mmol/L', 'number', NULL, 'input', NULL, NULL, 'Chemical Examination', 5, '{"min":118.0,"max":132.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CSF-ROUT-01'), 'CSF Total WBC Count', 'cells/cumm', 'number', NULL, 'input', NULL, NULL, 'Microscopic Examination', 6, '{"min":0.0,"max":5.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CSF-ROUT-01'), 'CSF Total RBC Count', 'cells/cumm', 'number', NULL, 'input', NULL, NULL, 'Microscopic Examination', 7, '{"min":0.0,"max":0.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CSF-ROUT-01'), 'CSF Neutrophils', '%', 'number', NULL, 'input', NULL, NULL, 'Microscopic Examination', 8, '{"min":0.0,"max":0.0}'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CSF-ROUT-01'), 'CSF Lymphocytes', '%', 'number', NULL, 'input', NULL, NULL, 'Microscopic Examination', 9, '{"min":60.0,"max":100.0}'::jsonb, NULL, true, NOW(), NOW()),

-- Culture - Auto C/S Aerobic Blood 1 Bottle Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CULT-BLOOD-01'), 'Incubation Duration', NULL, 'select', '24 hours,48 hours,72 hours,5 days', 'input', NULL, NULL, 'Aerobic Blood Culture', 1, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CULT-BLOOD-01'), 'Blood Culture Result', NULL, 'select', 'No growth detected after 5 days of incubation,Growth of organism detected', 'input', NULL, NULL, 'Aerobic Blood Culture', 2, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CULT-BLOOD-01'), 'Organism Isolated', NULL, 'text', NULL, 'input', NULL, NULL, 'Aerobic Blood Culture', 3, NULL, NULL, false, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CULT-BLOOD-01'), 'Antibiotic Sensitivity Details', NULL, 'textarea', NULL, 'input', NULL, NULL, 'Aerobic Blood Culture', 4, NULL, NULL, false, NOW(), NOW()),

-- DCT - Direct Coombs Test Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='DCT-01'), 'Direct Coombs Test', NULL, 'select', 'Negative,Positive', 'input', NULL, NULL, 'Antiglobulin Testing', 1, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='DCT-01'), 'Reaction Strength', NULL, 'select', 'Negative,1+,2+,3+,4+', 'input', NULL, NULL, 'Antiglobulin Testing', 2, NULL, NULL, true, NOW(), NOW()),

-- Dengue PCR Viral Load Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='DENG-PCR-01'), 'Dengue PCR Result', NULL, 'select', 'Not Detected,Detected', 'input', NULL, NULL, 'Molecular Diagnostics', 1, NULL, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='DENG-PCR-01'), 'Dengue Viral Load', 'copies/mL', 'number', NULL, 'input', NULL, NULL, 'Molecular Diagnostics', 2, '{"min":0.0,"max":0.0}'::jsonb, NULL, true, NOW(), NOW()),

-- DHEA - Dehydro Epiandrosterone Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='DHEA-01'), 'DHEA (Serum)', 'ng/mL', 'number', NULL, 'input', NULL, NULL, 'Adrenal Androgens', 1, '{"min":1.5,"max":10.0}'::jsonb, NULL, true, NOW(), NOW()),

-- Dopamine Level Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='DOP-01'), 'Dopamine (Plasma)', 'pg/mL', 'number', NULL, 'input', NULL, NULL, 'Plasma Catecholamines', 1, '[{"age_group":"all","sex":"any","low":0.0,"high":30.0,"note":"Supine <30 pg/mL, Upright <85 pg/mL"}]'::jsonb, NULL, true, NOW(), NOW()),

-- Estradiol (E2) Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ESTR-01'), 'Estradiol (E2)', 'pg/mL', 'number', NULL, 'input', NULL, NULL, 'Reproductive Hormones', 1, '[{"age_group":"all","sex":"male","low":10.0,"high":50.0,"note":"Male 10-50 pg/mL"},{"age_group":"all","sex":"female","low":30.0,"high":400.0,"note":"Follicular: 30-120 pg/mL, Luteal: 70-250 pg/mL, Mid-cycle: 130-370 pg/mL, Postmenopausal: <30 pg/mL"}]'::jsonb, NULL, true, NOW(), NOW()),

-- Electrolytes Urine/Fluid Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ELEC-UR-01'), 'Urine/Fluid Sodium', 'mmol/L', 'number', NULL, 'input', NULL, NULL, 'Urine/Fluid Electrolytes', 1, '[{"age_group":"all","sex":"any","low":40.0,"high":220.0,"note":"Urine 24hr: 40-220 mmol/24h. Varies by diet."}]'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ELEC-UR-01'), 'Urine/Fluid Potassium', 'mmol/L', 'number', NULL, 'input', NULL, NULL, 'Urine/Fluid Electrolytes', 2, '[{"age_group":"all","sex":"any","low":25.0,"high":125.0,"note":"Urine 24hr: 25-125 mmol/24h. Varies by diet."}]'::jsonb, NULL, true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ELEC-UR-01'), 'Urine/Fluid Chloride', 'mmol/L', 'number', NULL, 'input', NULL, NULL, 'Urine/Fluid Electrolytes', 3, '[{"age_group":"all","sex":"any","low":110.0,"high":250.0,"note":"Urine 24hr: 110-250 mmol/24h. Varies by diet."}]'::jsonb, NULL, true, NOW(), NOW()),

-- Erythropoetin Fields
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='EPO-01'), 'Erythropoetin', 'mIU/mL', 'number', NULL, 'input', NULL, NULL, 'Renal Hormones', 1, '{"min":4.3,"max":29.0}'::jsonb, NULL, true, NOW(), NOW()),

  -- ABG - Blood Gas Analysis Arterial Fields
  (gen_random_uuid(), (SELECT id FROM tests WHERE test_code='BCH 11'), 'pH', '', 'number', NULL, 'input', NULL, NULL, 'Blood Gas', 1, '[{"age_group":"all","sex":"any","low":7.35,"high":7.45}]'::jsonb, NULL, true, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM tests WHERE test_code='BCH 11'), 'pCO2', 'mmHg', 'number', NULL, 'input', NULL, NULL, 'Blood Gas', 2, '[{"age_group":"all","sex":"any","low":35.0,"high":45.0}]'::jsonb, NULL, true, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM tests WHERE test_code='BCH 11'), 'pO2', 'mmHg', 'number', NULL, 'input', NULL, NULL, 'Blood Gas', 3, '[{"age_group":"all","sex":"any","low":80.0,"high":100.0}]'::jsonb, NULL, true, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM tests WHERE test_code='BCH 11'), 'HCO3', 'mmol/L', 'number', NULL, 'input', NULL, NULL, 'Blood Gas', 4, '[{"age_group":"all","sex":"any","low":22.0,"high":26.0}]'::jsonb, NULL, true, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM tests WHERE test_code='BCH 11'), 'O2 Saturation', '%', 'number', NULL, 'input', NULL, NULL, 'Blood Gas', 5, '[{"age_group":"all","sex":"any","low":95.0,"high":100.0}]'::jsonb, NULL, true, NOW(), NOW()),

  -- ACA - Anti Cardiolipin Antibody IgG Fields
  (gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ECL 50.2'), 'ACA IgG', 'GPL', 'number', NULL, 'input', NULL, NULL, 'Antiphospholipid Antibodies', 1, '[{"age_group":"all","sex":"any","low":null,"high":10.0,"note":"< 10.0 GPL is Negative"}]'::jsonb, NULL, true, NOW(), NOW()),

  -- ACA - Anti Cardiolipin Antibody IgM Fields
  (gen_random_uuid(), (SELECT id FROM tests WHERE test_code='ECL 50.1'), 'ACA IgM', 'MPL', 'number', NULL, 'input', NULL, NULL, 'Antiphospholipid Antibodies', 1, '[{"age_group":"all","sex":"any","low":null,"high":10.0,"note":"< 10.0 MPL is Negative"}]'::jsonb, NULL, true, NOW(), NOW()),

  -- ACE - Angiotensin Converting Enzyme* Fields
  (gen_random_uuid(), (SELECT id FROM tests WHERE test_code='BIO 08'), 'Angiotensin Converting Enzyme (ACE)', 'U/L', 'number', NULL, 'input', NULL, NULL, 'Enzymes', 1, '[{"age_group":"all","sex":"any","low":8.0,"high":52.0}]'::jsonb, NULL, true, NOW(), NOW()),

  -- Acetone Serum Fields
  (gen_random_uuid(), (SELECT id FROM tests WHERE test_code='BM 12'), 'Acetone Serum', '', 'string', NULL, 'input', NULL, NULL, 'Ketones', 1, NULL, NULL, true, NOW(), NOW()),

  -- Acetone Urine Fields
  (gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CPL 01'), 'Acetone Urine', '', 'string', NULL, 'input', NULL, NULL, 'Ketones', 1, NULL, NULL, true, NOW(), NOW()),

  -- ACTH - Adrenocorticotropic hormone* Fields
  (gen_random_uuid(), (SELECT id FROM tests WHERE test_code='BIO 02'), 'ACTH', 'pg/mL', 'number', NULL, 'input', NULL, NULL, 'Pituitary Hormones', 1, '[{"age_group":"all","sex":"any","low":7.2,"high":63.3}]'::jsonb, NULL, true, NOW(), NOW()),

  -- ADA - Adenosine Deaminase CSF Fields
  (gen_random_uuid(), (SELECT id FROM tests WHERE test_code='BCH 01.2'), 'ADA CSF', 'U/L', 'number', NULL, 'input', NULL, NULL, 'Adenosine Deaminase', 1, '[{"age_group":"all","sex":"any","low":null,"high":9.0}]'::jsonb, NULL, true, NOW(), NOW()),

  -- ADA - Adenosine Deaminase Fluid Fields
  (gen_random_uuid(), (SELECT id FROM tests WHERE test_code='BCH 01.3'), 'ADA Fluid', 'U/L', 'number', NULL, 'input', NULL, NULL, 'Adenosine Deaminase', 1, '[{"age_group":"all","sex":"any","low":null,"high":40.0}]'::jsonb, NULL, true, NOW(), NOW()),

  -- ADA - Adenosine Deaminase Serum Fields
  (gen_random_uuid(), (SELECT id FROM tests WHERE test_code='BCH 01.1'), 'ADA Serum', 'U/L', 'number', NULL, 'input', NULL, NULL, 'Adenosine Deaminase', 1, '[{"age_group":"all","sex":"any","low":null,"high":15.0}]'::jsonb, NULL, true, NOW(), NOW()),

  -- AEC - Absolute Eosinophil Count Fields
  (gen_random_uuid(), (SELECT id FROM tests WHERE test_code='AA 01'), 'Absolute Eosinophil Count (AEC)', 'cells/cumm', 'number', NULL, 'input', NULL, NULL, 'Differential Count', 1, '[{"age_group":"all","sex":"any","low":40.0,"high":440.0}]'::jsonb, NULL, true, NOW(), NOW())

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

  ('THYROID_COMPREHENSIVE', 'Total T3', 'ng/dL', 80.00, 200.00, 'number', NULL, 1, 'input', NULL, NULL, 'Thyroid | Hormones', NULL, NULL, NULL, true),
  ('THYROID_COMPREHENSIVE', 'Total T4', 'ug/dL', 4.60, 12.00, 'number', NULL, 2, 'input', NULL, NULL, 'Thyroid | Hormones', NULL, NULL, NULL, true),
  ('THYROID_COMPREHENSIVE', 'TSH', 'uIU/mL', 0.40, 4.50, 'number', NULL, 3, 'input', NULL, NULL, 'Thyroid | Hormones', NULL, '{"high":100,"low":0.01}'::jsonb, NULL, true),

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
  WHERE t.test_code NOT IN ('CBC-01', 'LFT-01', 'KFT-01', 'LIPID-01', 'PT', 'APTT', 'HBA1C-01', 'MAL-AG-01', 'TP-01', 'HIV-01', 'HBSAG-01', 'HCV-01', 'CHIK-IGM-01', 'UACR-01', 'TORCH-01', 'HIV-RAPID-01', 'RPR-01', 'TB-XPERT-01', 'DENGUE-01', 'DENGUE-RAPID', 'DENGNS1-RAPID', 'DENGNS1-01', 'DENGIGG-01', 'HBSAG-RAPID-01', 'HCV-RAPID-01', 'HB-01', 'AEC-01', 'RETIC-01', 'MP-01', 'PLT-01', 'PGBS-01', 'UREA-01', 'CREAT-01', 'BIL-01', 'SGPT-01', 'SGOT-01', 'ALP-01', 'CHOL-01', 'TRIG-01', 'HDL-01', 'SPUTUM-RM', 'MANTOUX-01', 'TYPHIDOT-01', 'WIDAL-01', 'PBS-01', 'ELEC-01', 'STOOL-01', 'BRUC-IGM', 'BRUC-IGG', 'APLA-PRO', 'DBLM-01', 'TRPM-01', 'RUB-IGG', 'RUB-IGM', 'GTT-01', 'CRP-01', 'FBS-01', 'PPBS-01', 'RBS-01', 'URINE-01', 'PROT-CSF-01', 'PROT-ELEC-01', 'PROT-URINE-01', 'QUADM-01', 'BUN-CREAT-01', 'RETIC-PNL-01', 'NA-01', 'NA-URINE-01', 'STONE-01', 'TB-AFB-CULT-01', 'TFT-FREE-01', 'TORCH4-IGG-01', 'TORCH4-IGM-01', 'TOXO-IGG-01', 'TOXO-IGM-01', 'TSAT-01', 'HS-TROPI-01', 'HS-TROPT-01', 'TTG-IGA-01', 'UIBC-01', 'URIC-URINE-01', 'VORICO-01', 'WIDAL-TUBE-01', 'ZINC-01', 'ZN-AFB-01', 'THAL-01', 'ABG-01', 'ACA-IGG-01', 'ACA-IGM-01', 'ALDO-01', 'ALLERGY-FI-01', 'ALLERGY-DRUG-01', 'ALLERGY-FDI-01', 'AMA-01', 'ANA-PROF-01', 'ANCA-IF-01', 'HCV-ANTI-01', 'APA-IGG-01', 'APA-IGM-01', 'BICARB-01', 'BTCT-01', 'CALC-UR-01', 'CALC-U24-01', 'CHLOR-01', 'CHLOR-UR-01', 'CHIK-ELISA-01', 'CREAT-U24-01', 'CSF-ROUT-01', 'CULT-BLOOD-01', 'DCT-01', 'DENG-PCR-01', 'DHEA-01', 'DOP-01', 'ELEC-UR-01', 'EPO-01', 'BCH 11', 'ECL 50.2', 'ECL 50.1', 'BIO 08', 'BM 12', 'CPL 01', 'BIO 02', 'BCH 01.2', 'BCH 01.3', 'BCH 01.1', 'AA 01')
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
        ELSE NULL
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
• TSH levels are subject to circadian variation, reaching peak levels between 2-4 am and at a minimum between 6-10 pm. The variation is of the order of 50%, hence time of the day has influence on the measured serum TSH concentrations.
• Rheumatoid factor, human antimouse antibodies, heterophile antibodies may produce spurious results, especially in patients with autoimmune disorders (=10%). - Amiodarone may interfere with TSH.
• Non thyroidal illness like severe infections, liver disease, renal and heart failure, severe burns, trauma and surgery, pregnancy, Acute psychiatric illness, Severe dehydration may show transient variation in TSH value.

| Thyroid Condition | T3 | T4 | TSH |
| --- | --- | --- | --- |
| 1. Normal Thyroid Function (Eurothyroid) | N | N | N |
| 2. Primary Hyperthyroidism | H | H | L |
| 3. Secondary Hyperthyroidism Grave''s Thyroiditis | H | H | H |
| 4. T3 Thyrotoxicosis | H | N | N/L |
| 5. Primary Hypothyroidism | L | L | H/N |
| 6. Secondary Hypothyroidism | L | L | L |
| 7. Subclinical Hypothyroidism | N | N | H |
| 8. Patient on Treatment | N | N/H | L |
| 9. Non thyroidal illness (NTI) / Subclinical Hyperthyroid | N | N | L |' WHERE test_code = 'THYPRO-01';

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

-- ==========================================
-- CLINICAL SIGNIFICANCE FOR NEW TESTS BATCH
-- ==========================================

UPDATE tests SET clinical_significance = 'CSF Protein measurement evaluates the integrity of the blood-brain barrier and detects intrathecal protein synthesis. Elevated CSF protein (>45 mg/dL) is observed in bacterial, viral, tuberculous, or fungal meningitis, Guillain-Barré syndrome (GBS), multiple sclerosis (MS), brain tumors, subarachnoid hemorrhage, and spinal cord compression. Very high levels (>500 mg/dL) strongly suggest bacterial meningitis or Froin''s syndrome. Decreased CSF protein may indicate CSF leak, pseudotumor cerebri, or recent lumbar puncture. Results must be interpreted alongside CSF cell count, glucose, and culture findings.' WHERE test_code = 'PROT-CSF-01';

UPDATE tests SET clinical_significance = 'Serum Protein Electrophoresis (SPEP) separates serum proteins into distinct fractions: albumin, alpha-1, alpha-2, beta, and gamma globulins. It is essential for detecting monoclonal gammopathies (M-spike) in conditions like Multiple Myeloma, Waldenström''s macroglobulinemia, and MGUS (Monoclonal Gammopathy of Undetermined Significance). Polyclonal increases in gamma globulins suggest chronic infections, autoimmune diseases, or chronic liver disease. Decreased albumin may indicate liver disease, nephrotic syndrome, or malnutrition. A/G ratio alterations reflect hepatic synthetic function and immune status.' WHERE test_code = 'PROT-ELEC-01';

UPDATE tests SET clinical_significance = 'Urine Protein quantitation detects proteinuria, a hallmark of renal parenchymal disease. Persistent proteinuria is classified as glomerular (nephrotic syndrome, diabetic nephropathy, glomerulonephritis), tubular (interstitial nephritis, heavy metal toxicity), or overflow (myeloma, rhabdomyolysis). Transient proteinuria may be caused by fever, exercise, or orthostatic stress. Results exceeding 150 mg/day in 24-hour urine or detectable levels in spot urine warrant further investigation including ACR, protein electrophoresis, and renal biopsy.' WHERE test_code = 'PROT-URINE-01';

UPDATE tests SET clinical_significance = 'The Quadruple Marker Test is a second-trimester (15–20 weeks) maternal serum screening that measures AFP, Total hCG, Unconjugated Estriol (uE3), and Inhibin A. It estimates the risk of Down Syndrome (Trisomy 21), Edwards Syndrome (Trisomy 18), and neural tube defects (NTDs). Elevated AFP suggests NTDs (spina bifida, anencephaly) or abdominal wall defects. Elevated hCG and Inhibin A with low AFP and uE3 suggest Trisomy 21. This is a screening test; abnormal results require confirmatory diagnostic testing (amniocentesis or chorionic villus sampling). Results are reported as MoM (Multiples of the Median) adjusted for gestational age, maternal weight, and ethnicity.' WHERE test_code = 'QUADM-01';

UPDATE tests SET clinical_significance = 'The BUN/Creatinine Ratio is a calculated index used to differentiate pre-renal, intrinsic renal, and post-renal causes of azotemia. A ratio >20:1 with elevated BUN suggests pre-renal azotemia (dehydration, heart failure, GI bleeding, high protein intake, catabolic states). A ratio of 10–20:1 with elevated creatinine suggests intrinsic renal disease (acute tubular necrosis, glomerulonephritis). A ratio <10:1 may indicate liver disease, low protein diet, rhabdomyolysis, or SIADH. Results must be interpreted alongside clinical assessment of volume status and GFR.' WHERE test_code = 'BUN-CREAT-01';

UPDATE tests SET clinical_significance = 'The Reticulocyte Panel provides a comprehensive assessment of erythropoietic bone marrow response. Reticulocyte Count (%) and Absolute Reticulocyte Count measure the rate of red cell production. The Corrected Reticulocyte Count adjusts for the degree of anemia, while the Reticulocyte Production Index (RPI) accounts for premature release of reticulocytes in stress erythropoiesis. An RPI >3 indicates adequate bone marrow response (hemolytic anemia, acute blood loss), while an RPI <2 suggests inadequate marrow response (aplastic anemia, B12/folate deficiency, myelodysplastic syndrome, pure red cell aplasia).' WHERE test_code = 'RETIC-PNL-01';

UPDATE tests SET clinical_significance = 'Serum Sodium (Na+) is the principal extracellular cation and a critical determinant of plasma osmolality and fluid balance. Hyponatremia (<136 mmol/L) is classified as hypovolemic (diuretics, Addison''s disease), euvolemic (SIADH, hypothyroidism, psychogenic polydipsia), or hypervolemic (heart failure, cirrhosis, nephrotic syndrome). Hypernatremia (>145 mmol/L) suggests free water deficit from dehydration, diabetes insipidus, or excessive sodium intake. Severe imbalances can cause seizures, cerebral edema, or central pontine myelinolysis.' WHERE test_code = 'NA-01';

UPDATE tests SET clinical_significance = 'Urine Sodium (Na+) reflects renal sodium handling and is critical for evaluating hyponatremia, acute kidney injury, and volume status. Low urine sodium (<20 mmol/L) suggests pre-renal azotemia, volume depletion, or effective circulating volume deficit (heart failure, cirrhosis). High urine sodium (>40 mmol/L) in the setting of hyponatremia suggests SIADH, salt-wasting nephropathy, adrenal insufficiency, or diuretic use. Fractional Excretion of Sodium (FENa) further differentiates pre-renal from intrinsic renal causes of AKI.' WHERE test_code = 'NA-URINE-01';

UPDATE tests SET clinical_significance = 'Stone Analysis determines the chemical composition of urinary calculi to guide targeted metabolic evaluation and recurrence prevention strategies. Calcium Oxalate (monohydrate/dihydrate) stones are the most common (70-80%) and associated with hypercalciuria, hyperoxaluria, or hypocitraturia. Calcium Phosphate (Apatite) stones suggest renal tubular acidosis or hyperparathyroidism. Uric Acid stones occur in hyperuricosuria, gout, or acidic urine. Struvite stones are infection-related (urease-producing organisms). Cystine stones indicate cystinuria (autosomal recessive). Composition determines dietary, pharmacological, and surgical management.' WHERE test_code = 'STONE-01';

UPDATE tests SET clinical_significance = 'Automated AFB Culture (BACTEC MGIT/liquid culture) is the gold standard for definitive diagnosis of tuberculosis and non-tuberculous mycobacterial (NTM) infections. It offers significantly higher sensitivity (80-90%) compared to conventional ZN smear microscopy (50-60%) and faster time-to-detection (1-3 weeks vs 4-8 weeks on solid media). Positive cultures allow species identification and comprehensive drug susceptibility testing (DST) against first-line (Isoniazid, Rifampicin, Ethambutol, Pyrazinamide, Streptomycin) and second-line anti-TB drugs. Critical for detecting drug-resistant TB (MDR/XDR-TB).' WHERE test_code = 'TB-AFB-CULT-01';

UPDATE tests SET clinical_significance = 'Free Thyroid Function Test panel measures TSH, Free T3, and Free T4 simultaneously to provide a complete assessment of thyroid gland function. Free (unbound) hormones reflect the biologically active fraction unaffected by binding protein variations (pregnancy, oral contraceptives, liver disease). Elevated TSH with low FT3/FT4 confirms primary hypothyroidism; suppressed TSH with elevated FT3/FT4 confirms hyperthyroidism. Subclinical states show isolated TSH abnormalities with normal free hormones. Central (secondary) hypothyroidism shows low/normal TSH with low free hormones.' WHERE test_code = 'TFT-FREE-01';

UPDATE tests SET clinical_significance = 'TORCH 4 IgG panel measures IgG antibodies against Toxoplasma gondii, Rubella, Cytomegalovirus (CMV), and Herpes Simplex Virus (HSV). Positive IgG indicates past exposure, chronic/latent infection, or immunity (either natural or vaccine-induced for Rubella). In pregnancy, IgG positivity pre-conception generally indicates protection against primary infection. IgG seroconversion (negative to positive) during pregnancy suggests acute primary infection and risk of congenital transmission. IgG avidity testing may further differentiate recent from remote infection.' WHERE test_code = 'TORCH4-IGG-01';

UPDATE tests SET clinical_significance = 'TORCH 4 IgM panel measures IgM antibodies against Toxoplasma gondii, Rubella, Cytomegalovirus (CMV), and Herpes Simplex Virus (HSV). Positive IgM indicates acute or recent primary infection. In pregnancy, IgM positivity warrants urgent further evaluation (IgG avidity, PCR) due to risk of congenital infection causing fetal anomalies, intrauterine growth restriction, hydrops fetalis, or neonatal sequelae. False-positive IgM results can occur due to cross-reactivity, rheumatoid factor, or persistent IgM; confirmatory testing is essential before clinical decisions.' WHERE test_code = 'TORCH4-IGM-01';

UPDATE tests SET clinical_significance = 'Toxoplasma IgG measures antibodies indicating past exposure to or chronic infection with Toxoplasma gondii. In immunocompetent individuals, positive IgG usually signifies latent infection acquired through ingestion of undercooked meat or exposure to cat feces containing oocysts. In pregnancy, positive IgG prior to conception indicates immunity and low risk of fetal transmission. Seroconversion during pregnancy suggests acute infection requiring urgent management to prevent congenital toxoplasmosis. In immunocompromised patients (HIV/AIDS), positive IgG indicates risk of reactivation encephalitis.' WHERE test_code = 'TOXO-IGG-01';

UPDATE tests SET clinical_significance = 'Toxoplasma IgM is the primary marker for diagnosing acute or recent primary infection with Toxoplasma gondii. Positive IgM appears within 1-2 weeks of exposure and may persist for months. In pregnancy, positive IgM necessitates confirmatory testing (IgG avidity, PCR of amniotic fluid) to determine timing of infection and assess fetal risk. Congenital toxoplasmosis can cause chorioretinitis, hydrocephalus, intracranial calcifications, and developmental disabilities. False-positive results may occur; always correlate with IgG seroconversion and clinical context.' WHERE test_code = 'TOXO-IGM-01';

UPDATE tests SET clinical_significance = 'Transferrin Saturation (TSAT%) is calculated as (Serum Iron / TIBC) × 100 and represents the percentage of iron-binding sites on transferrin that are occupied by iron. Low TSAT (<20%) is the hallmark of iron deficiency anemia and functional iron deficiency in chronic kidney disease. Elevated TSAT (>45-50%) suggests iron overload conditions such as hereditary hemochromatosis, transfusional hemosiderosis, or ineffective erythropoiesis (thalassemia, sideroblastic anemia). TSAT is essential for differentiating iron deficiency from anemia of chronic disease and guiding iron supplementation therapy.' WHERE test_code = 'TSAT-01';

UPDATE tests SET clinical_significance = 'High-Sensitivity Troponin I (hs-TnI) by CLIA detects very low concentrations of cardiac Troponin I, a structural protein released exclusively from injured cardiomyocytes. The 99th percentile upper reference limit (URL) is sex-specific: ≤15.6 ng/L for females and ≤34.2 ng/L for males. Values exceeding the 99th percentile with a rising/falling pattern indicate acute myocardial infarction (Type 1 or Type 2). Chronic elevations may occur in heart failure, CKD, pulmonary embolism, myocarditis, or sepsis. Serial measurements at 0 and 3 hours are recommended for ruling in/out AMI using the high-sensitivity algorithm.' WHERE test_code = 'HS-TROPI-01';

UPDATE tests SET clinical_significance = 'High-Sensitivity Troponin T (hs-TnT) by CLIA detects minor myocardial injury with analytical sensitivity below the 99th percentile URL (14 ng/L). Values >14 ng/L with a rise/fall kinetic pattern (≥20% change) are diagnostic for acute myocardial infarction. Chronic stable elevations occur in heart failure, renal insufficiency, atrial fibrillation, pulmonary hypertension, and cardiac amyloidosis. hs-TnT has prognostic value: even mild elevations predict cardiovascular mortality and adverse outcomes. The 0/1-hour or 0/3-hour rapid rule-out/rule-in ESC algorithm is recommended for emergency assessment of chest pain.' WHERE test_code = 'HS-TROPT-01';

UPDATE tests SET clinical_significance = 'Tissue Transglutaminase IgA (tTG-IgA) is the recommended first-line serological screening test for Celiac Disease (gluten-sensitive enteropathy). Elevated tTG-IgA (>10 U/mL or >10× ULN) is highly specific for celiac disease with sensitivity >95% and specificity >95%. The patient must be on a gluten-containing diet for at least 2-4 weeks prior to testing to avoid false negatives. Total IgA should be measured concurrently, as selective IgA deficiency (found in 2-3% of celiac patients) causes false-negative tTG-IgA results. Positive screening requires confirmatory small bowel biopsy showing villous atrophy.' WHERE test_code = 'TTG-IGA-01';

UPDATE tests SET clinical_significance = 'Unsaturated Iron Binding Capacity (UIBC) measures the reserve (unoccupied) iron-binding capacity of transferrin. UIBC = TIBC − Serum Iron. Elevated UIBC indicates iron deficiency states (iron deficiency anemia, chronic blood loss, pregnancy, inadequate dietary intake). Decreased UIBC suggests iron overload (hemochromatosis, multiple transfusions, sideroblastic anemia) or conditions with reduced transferrin synthesis (chronic inflammation, liver disease, nephrotic syndrome). UIBC is used alongside serum iron, TIBC, ferritin, and transferrin saturation for comprehensive iron metabolism assessment.' WHERE test_code = 'UIBC-01';

UPDATE tests SET clinical_significance = 'Uric Acid in Spot Urine evaluates renal uric acid excretion and purine metabolism. The Uric Acid/Creatinine Ratio normalizes the result for urine concentration. Elevated urinary uric acid (hyperuricosuria) increases the risk of uric acid nephrolithiasis and is associated with gout, tumor lysis syndrome, myeloproliferative disorders, high purine diets, and Lesch-Nyhan syndrome. Low urinary uric acid may indicate renal hypouricemia, xanthine oxidase deficiency, or allopurinol therapy. Results guide dietary modification, pharmacological intervention (allopurinol, febuxostat), and stone prevention strategies.' WHERE test_code = 'URIC-URINE-01';

UPDATE tests SET clinical_significance = 'Voriconazole therapeutic drug monitoring (TDM) measures trough serum concentration to optimize efficacy and minimize toxicity. The recommended therapeutic trough range is 1.0–5.5 µg/mL. Sub-therapeutic levels (<1.0 µg/mL) are associated with treatment failure in invasive aspergillosis, candidemia, and other invasive fungal infections. Supra-therapeutic levels (>5.5 µg/mL) are associated with dose-dependent hepatotoxicity, visual disturbances, CNS toxicity, and periostitis. Voriconazole exhibits non-linear pharmacokinetics with significant inter-individual variability affected by CYP2C19 polymorphisms, drug interactions, and hepatic function. TDM is recommended within 2-5 days of initiation and after dose changes.' WHERE test_code = 'VORICO-01';

UPDATE tests SET clinical_significance = 'The Widal Tube Agglutination Test is a quantitative serological method for detecting antibodies against Salmonella enterica serovars Typhi and Paratyphi. Unlike the rapid slide method, the tube agglutination test provides accurate endpoint titers for O (somatic) and H (flagellar) antigens. A single O titer ≥1:160 or H titer ≥1:160 in endemic areas, or a four-fold rise in paired sera (acute and convalescent, 7-10 days apart), is considered diagnostically significant. Cross-reactivity with non-typhoid Salmonella species, prior vaccination, and anamnestic responses may cause false elevations. Blood culture remains the gold standard for typhoid diagnosis.' WHERE test_code = 'WIDAL-TUBE-01';

UPDATE tests SET clinical_significance = 'Serum Zinc is an essential trace element critical for immune function, wound healing, protein synthesis, DNA synthesis, cell division, growth, and development. Zinc deficiency manifests as impaired immunity, chronic diarrhea, alopecia, dermatitis (acrodermatitis enteropathica), delayed wound healing, hypogonadism, growth retardation in children, and altered taste/smell (dysgeusia/anosmia). Low serum zinc is associated with malnutrition, malabsorption (celiac disease, Crohn''s disease), chronic liver disease, sickle cell disease, chronic kidney disease, and prolonged parenteral nutrition. Elevated zinc may indicate contamination or excessive supplementation.' WHERE test_code = 'ZINC-01';

UPDATE tests SET clinical_significance = 'Ziehl-Neelsen (ZN) Stain is a rapid, widely available acid-fast staining technique for microscopic detection of Mycobacterium tuberculosis and other acid-fast bacilli (AFB) in clinical specimens. Results are graded semi-quantitatively: Negative (no AFB/100 oil-immersion fields), Scanty (1-9 AFB/100 fields), 1+ (10-99 AFB/100 fields), 2+ (1-10 AFB/field), 3+ (>10 AFB/field). A positive smear indicates high bacillary load and infectiousness. Sensitivity is approximately 50-60% (requires ≥5,000-10,000 bacilli/mL for detection). Negative smear does not exclude TB. Three early-morning sputum specimens on consecutive days are recommended. All smear results must be confirmed with culture for species identification and drug susceptibility testing.' WHERE test_code = 'ZN-AFB-01';

-- ============================================
-- CLINICAL SIGNIFICANCES FOR NEW TESTS
-- ============================================

UPDATE tests SET clinical_significance = '
Hemoglobin Electrophoresis is a laboratory test used to identify and measure the different types of hemoglobin in the bloodstream. Hemoglobin is the protein in red blood cells that carries oxygen. 

Clinical Utility & Interpretation:
• Diagnosis of Thalassemia: Thalassemia is an inherited blood disorder characterized by abnormal hemoglobin production. This test is essential for diagnosing Alpha and Beta Thalassemia. Beta Thalassemia trait (minor) is typically characterized by an elevation of Hb A2 (3.5% to 8%) and sometimes a mild elevation of Hb F (up to 5%). Beta Thalassemia Major features a severe reduction or complete absence of Hb A, with Hb F constituting up to 90% or more of total hemoglobin.
• Hemoglobinopathies: It detects abnormal hemoglobins such as Hb S (Sickle Cell disease/trait), Hb C, Hb E, and Hb D. In individuals with Sickle Cell Trait (HbAS), Hb S constitutes 35% to 45% of the total hemoglobin, while Hb A remains dominant. In Sickle Cell Disease (HbSS), Hb A is absent, and Hb S constitutes the majority of the hemoglobin.
• Family Screening and Counseling: Essential for carrier screening and genetic counseling to assess the risk of hemoglobin disorders in future offspring.' WHERE test_code = 'THAL-01';

UPDATE tests SET clinical_significance = '
Arterial Blood Gas (ABG) analysis is a critical diagnostic test that measures the levels of oxygen (pO2), carbon dioxide (pCO2), and the acidity (pH) of arterial blood. It is highly useful in emergency medicine and intensive care settings to evaluate gas exchange, lung function, and metabolic state.

Clinical Utility & Interpretation:
• Acid-Base Disorders: ABG is the primary tool to classify acid-base status. pH < 7.35 indicates acidosis, while pH > 7.45 indicates alkalosis. 
• Respiratory vs. Metabolic Causes:
  - Respiratory Acidosis: Characterized by a low pH and an elevated pCO2 (> 45 mmHg), representing alveolar hypoventilation (e.g., COPD, severe asthma, drug-induced respiratory depression).
  - Respiratory Alkalosis: Characterized by a high pH and a decreased pCO2 (< 35 mmHg), representing hyperventilation (e.g., anxiety, pulmonary embolism, early salicylate toxicity).
  - Metabolic Acidosis: Characterized by a low pH and a decreased HCO3 (< 22 mmol/L), indicating bicarbonate loss or accumulation of organic acids (e.g., Diabetic Ketoacidosis, renal failure, lactic acidosis).
  - Metabolic Alkalosis: Characterized by a high pH and an elevated HCO3 (> 26 mmol/L), representing acid loss or alkali ingestion (e.g., prolonged vomiting, severe dehydration, diuretic therapy).
• Oxygenation Status: Low pO2 (< 75 mmHg) indicates hypoxemia, which guides the administration of supplemental oxygen or adjustments in mechanical ventilation settings.' WHERE test_code = 'ABG-01';

UPDATE tests SET clinical_significance = '
Anti-Cardiolipin IgG antibody testing is a major diagnostic component for Antiphospholipid Syndrome (APS), an autoimmune disorder characterized by recurrent arterial or venous thrombosis, pregnancy loss, and thrombocytopenia. Cardiolipin is a phospholipid present in cell membranes and mitochondria.

Clinical Utility & Interpretation:
• Thrombotic Risk Assessment: Elevated levels of Anti-Cardiolipin IgG are strongly associated with a high risk of vascular thrombosis (blood clots in veins or arteries). Positive titers are often observed in patients presenting with unexplained deep vein thrombosis (DVT), pulmonary embolism, stroke, or transient ischemic attacks at a young age.
• Obstetric Complications: High levels of IgG cardiolipin antibodies are associated with recurrent pregnancy losses (usually three or more consecutive first-trimester losses or one or more late-pregnancy losses), preeclampsia, and placental insufficiency.
• Clinical Interpretation Cutoffs:
  - Negative: < 10 GPL units. Indicates no detectable IgG autoantibodies to cardiolipin.
  - Low Positive / Equivocal: 10 to 40 GPL units. May represent a transient rise due to recent viral infections or medications.
  - Moderate to High Positive: > 40 GPL units. Strongly suggestive of APS, especially when persistently positive.
• Diagnostic Confirmation: Since transient anti-cardiolipin antibodies can occur during infections, a positive test MUST be repeated after 12 weeks to confirm persistence for a definitive diagnosis of Antiphospholipid Syndrome.' WHERE test_code = 'ACA-IGG-01';

UPDATE tests SET clinical_significance = '
Anti-Cardiolipin IgM antibody testing is performed to detect the presence of IgM autoantibodies directed against cardiolipin, a mitochondrial phospholipid. It is one of the laboratory criteria used to diagnose Antiphospholipid Syndrome (APS) and evaluate patients with hypercoagulable states.

Clinical Utility & Interpretation:
• Evaluation of Autoimmune Activity: IgM autoantibodies are typically the first class of antibodies produced by the immune system in response to an antigen. While IgG antibodies have a stronger correlation with thrombosis and pregnancy complications, elevated IgM levels are also diagnostic of APS.
• Transient vs. Persistent Positivity: IgM antibodies can frequently rise temporarily due to infectious diseases (such as syphilis, malaria, hepatitis C, or bacterial infections) and certain medications. Persistent positivity (measured again after 12 weeks) is required to establish a diagnosis of APS.
• Interpretation Guidelines:
  - Negative: < 10 MPL units. Normal finding.
  - Equivocal / Borderline: 10 to 40 MPL units. Often transient and associated with non-APS conditions.
  - Positive: > 40 MPL units. Consistent with APS if persistent.' WHERE test_code = 'ACA-IGM-01';

UPDATE tests SET clinical_significance = '
Aldosterone is a vital mineralocorticoid steroid hormone produced by the outer section (zona glomerulosa) of the adrenal cortex. It plays a critical role in the homeostatic regulation of blood pressure, blood volume, and the balance of sodium and potassium in the body.

Clinical Utility & Interpretation:
• Evaluation of Hypertension: Aldosterone testing is primarily indicated in patients with high blood pressure, especially those with resistant hypertension or hypokalemia (low potassium).
• Primary Aldosteronism (Conn''s Syndrome): Characterized by autonomous, excessive production of aldosterone by the adrenal glands (due to an aldosterone-producing adrenal adenoma or bilateral adrenal hyperplasia). This leads to sodium retention, potassium depletion, and hypertension. In primary aldosteronism, aldosterone is high, while plasma renin activity is suppressed.
• Secondary Aldosteronism: Occurs when aldosterone excess is driven by overactivation of the renin-angiotensin system. Causes include renal artery stenosis, congestive heart failure, liver cirrhosis, and nephrotic syndrome. Here, both aldosterone and renin levels are elevated.
• Adrenal Insufficiency (Addison''s Disease): Characterized by primary failure of the adrenal gland, leading to low aldosterone levels. Symptoms include hypotension, hyponatremia, hyperkalemia, and fatigue.
• Postural Variations: Aldosterone secretion is highly sensitive to posture. Upright posture increases venous return pressure, stimulating renin and aldosterone release. Hence, supine and upright reference ranges differ significantly, and posture must be documented during sample collection.' WHERE test_code = 'ALDO-01';

UPDATE tests SET clinical_significance = '
Allergy Food & Inhalant panel testing measures specific Immunoglobulin E (IgE) antibodies against common food proteins (such as milk, egg, wheat, nuts, and seafood) and environmental inhalants (such as pollen, house dust mites, animal dander, and mold spores) in serum.

Clinical Utility & Interpretation:
• Diagnosis of Type I Hypersensitivity: IgE-mediated allergic reactions are responsible for conditions such as allergic rhinitis, asthma, atopic dermatitis (eczema), and food allergies. The presence of specific IgE antibodies indicates sensitization to the corresponding allergen.
• Total IgE Concentration: Total IgE represents the overall level of IgE antibodies in the circulation. While elevated levels are common in allergic individuals, they can also occur due to parasitic infections, bronchopulmonary aspergillosis, and immunodeficiencies. Normal total IgE levels do not rule out specific allergies.
• Specific IgE Interpretation:
  - Level < 0.35 kUA/L (Class 0): Negative / Undetectable. Sensitization is unlikely.
  - Level >= 0.35 kUA/L (Class 1 to 6): Represents increasing levels of specific IgE antibodies and higher likelihood of clinical allergic symptoms upon exposure to the allergen.
• Clinical Correlation: A positive specific IgE test indicates sensitization but must always be interpreted in conjunction with the patient''s clinical symptoms and history, as sensitization does not always translate to a clinical allergic reaction.' WHERE test_code = 'ALLERGY-FI-01';

UPDATE tests SET clinical_significance = '
Allergy Drugs panel testing evaluates specific IgE antibody levels against commonly implicated medications, such as Penicillin, Cephalosporins, and other beta-lactam antibiotics. 

Clinical Utility & Interpretation:
• Detection of Drug Hypersensitivity: IgE-mediated drug allergies can cause immediate, potentially life-threatening systemic reactions (anaphylaxis), urticaria, angioedema, or bronchospasm. This test helps identify specific drug triggers.
• Interpretation of Specific IgE Levels:
  - Specific IgE < 0.35 kUA/L (Class 0): Negative. No IgE antibodies detected. However, a negative result does not completely rule out drug allergy, as some reactions are non-IgE mediated or target drug metabolites not present in the assay.
  - Specific IgE >= 0.35 kUA/L (Class 1-6): Positive. Indicates immunological sensitization to the drug.
• Safety Precautions: A positive result indicates a high risk of immediate hypersensitivity. The implicated drug should be avoided, and alternatives should be prescribed. All drug allergy test results must be reviewed by an allergist or immunologist alongside the patient''s drug exposure history.' WHERE test_code = 'ALLERGY-DRUG-01';

UPDATE tests SET clinical_significance = '
The Comprehensive Food, Drug, and Inhalant Allergy Panel is designed to screen for IgE-mediated hypersensitivities across a broad spectrum of potential allergens including dietary foods, environmental inhalants, and pharmaceutical drugs.

Clinical Utility & Interpretation:
• Broad Spectrum Screening: Useful for patients with complex or multi-systemic allergic symptoms (such as concurrent chronic urticaria, asthma, and gastrointestinal symptoms) where the triggering allergen is unknown.
• Key Parameters Evaluated:
  - Total IgE: Reflects overall immune system allergic activation.
  - Food Panel specific IgE: Identifies sensitization to major food antigens.
  - Inhalant Panel specific IgE: Identifies sensitization to airborne particles.
  - Drug Panel specific IgE: Identifies sensitization to common drugs.
• Clinical Management: Results guide allergen avoidance strategies, immunotherapy planning, and dietary modifications. A reactive result indicates sensitization, but definitive diagnosis of clinical allergy requires confirmation by clinical history or double-blind food challenges under medical supervision.' WHERE test_code = 'ALLERGY-FDI-01';

UPDATE tests SET clinical_significance = '
Anti-Mitochondrial Antibodies (AMA) are autoantibodies directed against antigens in the inner mitochondrial membrane, specifically the M2 pyruvate dehydrogenase complex. The AMA test is highly sensitive and specific for Primary Biliary Cholangitis (PBC).

Clinical Utility & Interpretation:
• Diagnosis of Primary Biliary Cholangitis (PBC): PBC is a chronic, progressive autoimmune liver disease characterized by the destruction of intrahepatic bile ducts, leading to cholestasis, portal inflammation, and liver cirrhosis. AMA is present in approximately 95% of patients with PBC, making it the hallmark diagnostic marker.
• ELISA Interpretation:
  - Negative (< 20.0 Units/mL): Normal finding; PBC is unlikely but not ruled out if clinical suspicion remains high.
  - Equivocal (20.0 - 25.0 Units/mL): Borderline result; retesting in 3-6 months or evaluating other liver enzymes (such as Alkaline Phosphatase) is recommended.
  - Positive (>= 25.0 Units/mL): Highly suggestive of PBC, particularly in patients with elevated Alkaline Phosphatase (ALP) and symptoms like fatigue or pruritus (itching).
• Other Conditions: Low titers of AMA may occasionally be detected in other autoimmune diseases, such as Systemic Lupus Erythematosus (SLE), Sjögren''s syndrome, rheumatoid arthritis, and autoimmune hepatitis, but high titers are highly specific for PBC.' WHERE test_code = 'AMA-01';

UPDATE tests SET clinical_significance = '
Antinuclear Antibody (ANA) Profile is a comprehensive follow-up test performed after a positive ANA primary screen. It uses multiplex assays or ELISA to detect specific autoantibodies directed against Extractable Nuclear Antigens (ENAs) and double-stranded DNA.

Clinical Utility & Interpretation of Key Parameters:
• Anti-dsDNA: Highly specific for Systemic Lupus Erythematosus (SLE). Levels correlate with disease activity, particularly lupus nephritis.
• Anti-Sm (Smith): Extremely specific for SLE; considered diagnostic for the disease, though present in only 20-30% of patients.
• Anti-SSA (Ro) / Anti-SSB (La): Strongly associated with Sjögren''s Syndrome (dry eyes/mouth) and subacute cutaneous lupus. Anti-SSA is also linked to congenital heart block in infants of positive mothers.
• Anti-RNP (Ribonucleoprotein): High titers are characteristic of Mixed Connective Tissue Disease (MCTD), which shares features of lupus, scleroderma, and polymyositis.
• Anti-Scl-70 (Topoisomerase I): Highly specific for systemic sclerosis (diffuse scleroderma) and indicates a higher risk of pulmonary fibrosis.
• Anti-Jo-1 (Histidyl-tRNA synthetase): Associated with inflammatory myopathies (polymyositis, dermatomyositis) and antisynthetase syndrome (myositis, interstitial lung disease, arthritis, Raynaud''s).' WHERE test_code = 'ANA-PROF-01';

UPDATE tests SET clinical_significance = '
Anti-Neutrophil Cytoplasmic Antibodies (ANCA) are a group of autoantibodies directed against proteins in the cytoplasmic granules of neutrophils and monocytes. ANCA testing is a vital diagnostic tool for systemic necrotizing vasculitis.

Clinical Utility & Interpretation:
• Indirect Immunofluorescence (IIF) Patterns:
  - c-ANCA (Cytoplasmic): Characterized by diffuse granular cytoplasmic staining. This pattern is primarily caused by antibodies against Proteinase 3 (PR3). High titers are strongly associated with Granulomatosis with Polyangiitis (GPA, formerly Wegener''s Vasculitis), with a sensitivity of >90% in active generalized disease.
  - p-ANCA (Perinuclear): Characterized by staining around the nucleus. This pattern is primarily caused by antibodies against Myeloperoxidase (MPO). High titers are associated with Microscopic Polyangiitis (MPA), Eosinophilic Granulomatosis with Polyangiitis (EGPA, Churg-Strauss Syndrome), and anti-GBM disease.
  - Atypical ANCA: Show varied staining patterns and are commonly found in inflammatory bowel diseases (ulcerative colitis), primary sclerosing cholangitis, and drug-induced vasculitis.
• Clinical Monitoring: ANCA titers often correlate with disease activity, and a rise in titers may precede clinical relapse, guiding therapeutic decisions in vasculitis management.' WHERE test_code = 'ANCA-IF-01';

UPDATE tests SET clinical_significance = '
The Anti-HCV test detects the presence of specific antibodies produced by the immune system in response to infection with the Hepatitis C Virus (HCV). It is the primary screening test for Hepatitis C.

Clinical Utility & Interpretation:
• Screening for Hepatitis C: Used to screen high-risk individuals, blood donors, and patients with unexplained elevations in liver enzymes (AST/ALT).
• Interpretation:
  - S/CO < 1.0 (Negative): No detectable antibodies to HCV. Indicates either no exposure to the virus or a very early incubation stage (window period) before antibody development.
  - S/CO >= 1.0 (Positive / Reactive): Indicates exposure to Hepatitis C Virus. The patient has produced antibodies.
• Confirmation Requirement: A positive anti-HCV result does not distinguish between an active (chronic/acute) infection and a past infection that has resolved spontaneously or been successfully treated. Therefore, all reactive results MUST be confirmed using a quantitative HCV RNA PCR test to detect viral replication.' WHERE test_code = 'HCV-ANTI-01';

UPDATE tests SET clinical_significance = '
Anti-Thyroglobulin (Anti-TG) antibodies are autoantibodies directed against thyroglobulin, a large protein precursor synthesized by thyroid follicular cells that is crucial for thyroid hormone synthesis.

Clinical Utility & Interpretation:
• Autoimmune Thyroiditis (Hashimoto''s Disease): Anti-TG antibodies are present in 60-80% of patients with Hashimoto''s thyroiditis, where immune cells attack the thyroid, eventually causing hypothyroidism. They are also detected in 30% of patients with Graves'' disease (hyperthyroidism).
• Thyroid Cancer Monitoring: In patients treated for differentiated thyroid cancer (papillary or follicular) via thyroidectomy and radioactive iodine, thyroglobulin (TG) is monitored as a tumor marker. The presence of Anti-TG antibodies can interfere with TG assays, causing false-low results. Monitoring Anti-TG antibody titers over time is crucial: stable or rising titers suggest persistent or recurrent thyroid tissue/tumor, while disappearing titers indicate complete remission.' WHERE test_code = 'ATG-01';

UPDATE tests SET clinical_significance = '
Anti-Phosphatidylserine / Antiphospholipid IgG antibody testing measures IgG antibodies directed against negatively charged phospholipids, primarily phosphatidylserine. This is an important supplemental test for Antiphospholipid Syndrome (APS).

Clinical Utility & Interpretation:
• Diagnosis of Antiphospholipid Syndrome (APS): APS is an autoimmune thrombophilic state. While lupus anticoagulant and anti-cardiolipin are the primary classification criteria, some patients with clinical features of APS test negative for these markers. Anti-phosphatidylserine antibodies serve as valuable markers in "seronegative" APS.
• Thrombosis and Pregnancy Risks: Elevated IgG levels are strongly associated with venous thrombosis, arterial occlusion (leading to stroke or myocardial infarction), and recurrent obstetric losses or late-term pregnancy complications.
• Range Interpretation:
  - Negative (< 15 GPL Units/mL): Normal. No significant IgG autoantibodies detected.
  - Weak Positive (15 - 39 GPL Units/mL): Low levels, may represent transient elevations due to infections.
  - Positive (>= 40 GPL Units/mL): Suggests persistent autoimmune activation and risk of thrombotic events. Repeating the test after 12 weeks is mandatory for diagnosis.' WHERE test_code = 'APA-IGG-01';

UPDATE tests SET clinical_significance = '
Anti-Phosphatidylserine / Antiphospholipid IgM antibody testing measures IgM autoantibodies directed against phosphatidylserine. It is utilized to investigate unexplained thromboembolic events and recurrent miscarriages.

Clinical Utility & Interpretation:
• Early Autoimmune Response: IgM class antibodies indicate an active or early phase autoimmune response. Elevated IgM levels, even in the absence of IgG, support the diagnosis of Antiphospholipid Syndrome (APS) when persistent.
• Diagnostic Interpretation:
  - Negative (< 15 MPL Units/mL): Normal finding.
  - Weak Positive (15 - 39 MPL Units/mL): Low level, common transiently after acute viral or bacterial infections.
  - Positive (>= 40 MPL Units/mL): Strongly indicates APS if persistent over a 12-week period. It must be interpreted in clinical correlation with the patient''s history of thrombotic episodes or pregnancy losses.' WHERE test_code = 'APA-IGM-01';

UPDATE tests SET clinical_significance = '
Bicarbonate (HCO3-) is an essential electrolyte that acts as a chemical buffer, playing a fundamental role in maintaining the acid-base balance (pH) of blood and other bodily fluids. It is regulated primarily by the kidneys and lungs.

Clinical Utility & Interpretation:
• Metabolic Acidosis (Low Bicarbonate < 22 mmol/L): Represents a state where bicarbonate is consumed by excess acids or directly lost. Common causes include:
  - Kidney Failure (inability to excrete acid and reabsorb bicarbonate).
  - Diabetic Ketoacidosis (accumulation of acetoacetate and beta-hydroxybutyrate).
  - Lactic Acidosis (under-perfusion of tissues during shock or sepsis).
  - Severe Diarrhea (direct gastrointestinal loss of bicarbonate).
• Metabolic Alkalosis (High Bicarbonate > 29 mmol/L): Represents an accumulation of bicarbonate or loss of hydrogen ions. Common causes include:
  - Prolonged Vomiting or Nasogastric Suctioning (loss of hydrochloric acid).
  - Diuretic Therapy (loss of hydrogen and potassium ions in urine).
  - Hyperaldosteronism (increased renal acid excretion).
• Respiratory Compensation: Bicarbonate levels are also altered as renal compensation for chronic respiratory disorders (e.g., elevated bicarbonate in chronic COPD to compensate for CO2 retention).' WHERE test_code = 'BICARB-01';

UPDATE tests SET clinical_significance = '
Bleeding Time (BT) and Clotting Time (CT) are classic in vivo screening tests used to evaluate the primary and secondary pathways of hemostasis (blood clotting). 

Clinical Utility & Interpretation:
• Bleeding Time (BT): Measures the time taken for bleeding to stop from a standardized superficial skin cut. It primarily evaluates platelet function, platelet-vessel wall interaction (adhesion), and vascular integrity.
  - Prolonged BT (> 7 minutes): Occurs in thrombocytopenia (low platelet count), qualitative platelet defects (e.g., Glanzmann thrombasthenia, Bernard-Soulier syndrome), von Willebrand disease, and after aspirin ingestion.
• Clotting Time (CT): Measures the time required for whole blood to clot in a glass tube. It evaluates the intrinsic and common pathways of the coagulation cascade (factors XII, XI, IX, VIII, X, V, II, I).
  - Prolonged CT (> 15 minutes): Indicates severe deficiencies of clotting factors (e.g., Hemophilia A/B, severe vitamin K deficiency, liver disease) or the presence of circulating anticoagulants/heparin.
• Pre-operative Screening: Traditionally used as a baseline pre-surgical screen to identify patients with an increased risk of clinical hemorrhage, though now often accompanied by specific tests like PT/INR and APTT.' WHERE test_code = 'BTCT-01';

UPDATE tests SET clinical_significance = '
Random Urine Calcium testing measures the concentration of calcium excreted in a spot urine sample. Because calcium excretion varies significantly throughout the day and is highly dependent on dietary intake, results are often compared to urine creatinine levels.

Clinical Utility & Interpretation:
• Evaluation of Calcium Homeostasis: Used alongside serum calcium and parathyroid hormone (PTH) tests to investigate disorders of calcium metabolism.
• Hypercalciuria (Elevated Urine Calcium): High levels can indicate:
  - Primary Hyperparathyroidism (excess PTH causing bone resorption and increased calcium filtration).
  - Vitamin D Toxicity (increased intestinal calcium absorption).
  - Distal Renal Tubular Acidosis.
  - Osteolytic bone tumors or prolonged immobilization.
  - High risk of calcium-containing nephrolithiasis (kidney stones).
• Hypocalciuria (Decreased Urine Calcium): Low levels are seen in:
  - Hypoparathyroidism (deficient PTH).
  - Vitamin D Deficiency (rickets/osteomalacia).
  - Familial Hypocalciuric Hypercalcemia (FHH).
  - Thiazide Diuretic therapy (which increases renal calcium reabsorption).' WHERE test_code = 'CALC-UR-01';

UPDATE tests SET clinical_significance = '
24-Hour Urine Calcium testing provides a quantitative measurement of the total amount of calcium excreted in urine over a full 24-hour period. This eliminates the fluctuations associated with spot urine samples and is the gold standard for assessing hypercalciuria.

Clinical Utility & Interpretation:
• Evaluation of Nephrolithiasis: Hypercalciuria is the most common metabolic abnormality in patients with calcium oxalate or calcium phosphate kidney stones. A 24-hour excretion of > 300 mg (in men) or > 250 mg (in women) is considered hypercalciuria and guides dietary and pharmacological therapy (e.g., thiazides, low sodium diet).
• Diagnosis of Endocrine Disorders:
  - Primary Hyperparathyroidism: Often presents with elevated serum calcium, elevated PTH, and high 24-hour urine calcium due to the increased filtered load of calcium.
  - Familial Hypocalciuric Hypercalcemia (FHH): A genetic disorder presenting with hypercalcemia but characteristically low 24-hour urine calcium (typically < 100 mg/24h), helping differentiate it from hyperparathyroidism and avoiding unnecessary parathyroid surgery.
• Monitoring Treatment: Used to monitor the efficacy and safety of calcium and vitamin D supplementation in patients with hypoparathyroidism, osteoporosis, or rickets to avoid hypercalciuria and renal damage.' WHERE test_code = 'CALC-U24-01';

UPDATE tests SET clinical_significance = '
Chloride is the major extracellular anion (negatively charged electrolyte) in the human body. It works in close association with sodium to maintain osmotic pressure, proper hydration, blood volume, and acid-base balance.

Clinical Utility & Interpretation:
• Hyperchloremia (Elevated Serum Chloride > 106 mmol/L): Commonly occurs in:
  - Dehydration (hemoconcentration).
  - Renal Tubular Acidosis (loss of bicarbonate leading to compensatory chloride retention).
  - Acute Kidney Injury or Chronic Kidney Disease (impaired renal excretion).
  - Hyperventilation (respiratory alkalosis).
  - Saline infusion excess (administration of high amounts of 0.9% NaCl).
• Hypochloremia (Decreased Serum Chloride < 96 mmol/L): Commonly occurs in:
  - Prolonged Vomiting or Gastric Suctioning (loss of HCl-rich gastric secretions).
  - Respiratory Acidosis (chronic lung diseases like COPD with renal compensation retaining bicarbonate and excreting chloride).
  - Adrenal Insufficiency (Addison''s disease, with sodium and chloride loss).
  - Overhydration / Syndrome of Inappropriate ADH (dilutional hypochloremia).
  - Congestive Heart Failure or SIADH.' WHERE test_code = 'CHLOR-01';

UPDATE tests SET clinical_significance = '
Urine Chloride testing measures the concentration of chloride excreted in urine. It is primarily used to evaluate fluid and electrolyte status, assess acid-base disorders, and differentiate causes of metabolic alkalosis.

Clinical Utility & Interpretation:
• Differentiating Metabolic Alkalosis:
  - Chloride-Responsive Metabolic Alkalosis (Urine Chloride < 20 mmol/L): Suggests volume depletion, often due to vomiting, nasogastric suctioning, or remote diuretic use. The kidneys reabsorb sodium and chloride aggressively to restore volume. This condition responds well to intravenous saline infusion.
  - Chloride-Resistant Metabolic Alkalosis (Urine Chloride > 20 mmol/L): Suggests volume expansion or active mineralocorticoid excess. Causes include primary aldosteronism, Cushing''s syndrome, severe hypokalemia, or active/recent diuretic use. In these cases, saline infusion does not correct the alkalosis.
• Salt Wasting & Diuretics: Used to monitor compliance and response to loop or thiazide diuretics (which increase urine chloride) and to help diagnose renal salt-wasting syndromes.' WHERE test_code = 'CHLOR-UR-01';

UPDATE tests SET clinical_significance = '
Chikungunya IgM antibody detection by Enzyme-Linked Immunosorbent Assay (ELISA) is a highly reliable method for diagnosing acute or recent Chikungunya virus infection. Chikungunya is a mosquito-borne viral disease characterized by acute onset of high fever and severe, often debilitating joint pain.

Clinical Utility & Interpretation:
• Diagnosis of Recent Infection: Chikungunya IgM antibodies become detectable 3 to 5 days after the onset of symptoms and typically peak at 3 to 5 weeks. They can persist in the circulation for 3 to 4 months. A positive IgM ELISA index indicates a recent infection.
• ELISA Index Interpretation:
  - Negative (< 0.9 Index): No detectable IgM antibodies. If tested within the first 3 days of illness, a negative result does not rule out infection; retesting or PCR is recommended.
  - Equivocal (0.9 - 1.1 Index): Borderline result. Suggests checking a convalescent serum sample collected 7-14 days later.
  - Positive (> 1.1 Index): Confirms acute or recent Chikungunya infection.
• Differential Diagnosis: Differentiating Chikungunya from Dengue and Zika is critical due to identical vectors (Aedes mosquitoes), overlapping clinical symptoms (fever, rash, joint pain), and geographic distributions. ELISA provides clear serological distinction.' WHERE test_code = 'CHIK-ELISA-01';

UPDATE tests SET clinical_significance = '
24-Hour Urine Creatinine testing measures the total amount of creatinine excreted in urine over a 24-hour period. Creatinine is a waste product produced at a constant rate by the spontaneous breakdown of creatine phosphate in skeletal muscle.

Clinical Utility & Interpretation:
• Assessment of Glomerular Filtration: Primarily used in conjunction with serum creatinine to calculate the Creatinine Clearance rate, which provides an estimate of the Glomerular Filtration Rate (GFR) and kidney function.
• Verifying Collection Completeness: Because daily creatinine excretion is relatively constant and directly proportional to muscle mass, the total 24-hour excretion is used to verify if a 24-hour urine collection was complete. A typical adult male excretes 20-25 mg/kg of creatinine per day, while a female excretes 15-20 mg/kg. Values significantly below this suggest an incomplete collection.
• Clinical Variations:
  - Increased Excretion: Observed in conditions with severe muscle breakdown (rhabdomyolysis), gigantism, hyperthyroidism, or high dietary intake of meat.
  - Decreased Excretion: Observed in advanced kidney failure (decreased filtration), severe muscle wasting (muscular dystrophy, severe cachexia), and malnutrition.' WHERE test_code = 'CREAT-U24-01';

UPDATE tests SET clinical_significance = '
Cerebrospinal Fluid (CSF) Routine Examination involves physical, chemical, and microscopic analysis of fluid collected via lumbar puncture. It is crucial for diagnosing acute or chronic neurological conditions.

Clinical Utility & Interpretation of Key Parameters:
• Appearance and Color: Normal CSF is clear and colorless. Xanthochromia (yellow color) suggests subarachnoid hemorrhage or extremely high protein. Turbidity indicates high white blood cells (meningitis).
• CSF Protein: Elevated protein (> 45 mg/dL) is a sensitive indicator of blood-brain barrier disruption, observed in meningitis, brain abscesses, polyneuropathy (Guillain-Barré syndrome), and CNS tumors.
• CSF Glucose: Normal glucose is about 60% of plasma glucose. Low glucose (< 50 mg/dL) is characteristic of bacterial, fungal, or tubercular meningitis, while viral meningitis typically presents with normal glucose.
• Cell Counts and Differential:
  - Neutrophilic Pleocytosis: High WBCs with a predominance of neutrophils suggests acute bacterial meningitis.
  - Lymphocytic Pleocytosis: High WBCs with dominant lymphocytes suggests viral, tubercular, or fungal meningitis, or neurosyphilis.' WHERE test_code = 'CSF-ROUT-01';

UPDATE tests SET clinical_significance = '
Automated Aerobic Blood Culture is the gold standard diagnostic test to detect viable microorganisms (bacteria or yeast) circulating in the bloodstream. It is critical for the diagnosis of bacteremia, septicemia, infective endocarditis, and severe sepsis.

Clinical Utility & Interpretation:
• Detection of Bloodstream Pathogens: The system automatically monitors culture bottles for CO2 production (a proxy for microbial growth). If growth is detected, a gram stain and subcultures are performed immediately.
• Interpretation of Results:
  - No Growth Detected: Indicates no aerobic bacterial growth. A final negative report is generated after 5 days of incubation, which effectively rules out most common pathogens.
  - Growth of Organism: Confirms bacteremia. The isolated organism is identified, and Antibiotic Susceptibility Testing (AST) is performed to determine the minimum inhibitory concentrations (MICs) of various antibiotics.
• Distinguishing Contaminants: Isolation of common skin flora (e.g., Coagulase-negative Staphylococci) in only one of multiple culture bottles often suggests skin contamination during venipuncture rather than true bacteremia, requiring clinical correlation.' WHERE test_code = 'CULT-BLOOD-01';

UPDATE tests SET clinical_significance = '
The Direct Coombs Test (also known as the Direct Antiglobulin Test or DAT) is used to detect the presence of antibodies (IgG) or complement proteins (C3d) that are already bound to the surface of the patient''s red blood cells (RBCs) in vivo.

Clinical Utility & Interpretation:
• Diagnosis of Autoimmune Hemolytic Anemia (AIHA): DAT is the key test to confirm AIHA.
  - Warm AIHA: Characterized by IgG (and sometimes complement) coating the RBCs, typically reacting at body temperature.
  - Cold Agglutinin Disease: Characterized by complement (C3d) coating the RBCs, caused by IgM antibodies reacting at lower temperatures.
• Hemolytic Disease of the Newborn (HDN): Detects maternal IgG antibodies that have crossed the placenta and bound to the baby''s RBCs (e.g., Rh or ABO incompatibility).
• Drug-Induced Hemolysis: Some drugs (e.g., penicillin, methyldopa) can induce antibody production against RBCs, leading to a positive DAT and hemolytic anemia.
• Hemolytic Transfusion Reactions: Detects recipient antibodies bound to transfused donor RBCs.' WHERE test_code = 'DCT-01';

UPDATE tests SET clinical_significance = '
Dengue virus real-time PCR is a molecular diagnostic test designed to detect and quantify Dengue virus RNA in patient serum or plasma. It is the most sensitive and specific method for confirming dengue infection during the early acute phase.

Clinical Utility & Interpretation:
• Early Acute Diagnosis (Days 1 to 5): During the first few days of fever, viremia (viral level in blood) is high. PCR can detect the virus before antibodies (IgM/IgG) develop, bridging the diagnostic window.
• Quantitative Viral Load: Helps evaluate the level of viral replication. High viral load in the early phase has been linked to a higher risk of developing severe dengue manifestations, such as Dengue Hemorrhagic Fever (DHF) or Dengue Shock Syndrome (DSS).
• Clinical Interpretation:
  - Not Detected: No viral RNA found. If symptoms persist, serological tests (Dengue NS1 antigen and IgM antibodies) should be performed, as the viremic phase may have passed.
  - Detected: Confirms active Dengue virus infection. It is highly specific and rules out cross-reactivity with other flaviviruses.' WHERE test_code = 'DENG-PCR-01';

UPDATE tests SET clinical_significance = '
Dehydroepiandrosterone (DHEA) is a weak male hormone (androgen) produced by the adrenal glands, ovaries, and testes. It is a precursor that is converted into stronger androgens (like testosterone) and estrogens. DHEA levels are measured to evaluate adrenal androgen production.

Clinical Utility & Interpretation:
• Evaluation of Hyperandrogenism: Measured in women presenting with signs of excess androgen, such as hirsutism (excessive hair growth), acne, male-pattern baldness, and irregular periods.
• Adrenal Hyperplasia & Tumors: Markedly elevated DHEA levels can indicate congenital adrenal hyperplasia (CAH), adrenal cortical adenomas, or adrenal carcinomas. DHEA helps differentiate adrenal sources of androgens from ovarian sources (where DHEA is typically normal, but testosterone may be elevated).
• Polycystic Ovary Syndrome (PCOS): Moderate elevations of DHEA may be observed in patients with PCOS.
• Adrenal Insufficiency: Low DHEA levels are observed in primary adrenal insufficiency (Addison''s disease) and secondary adrenal insufficiency (pituitary dysfunction).' WHERE test_code = 'DHEA-01';

UPDATE tests SET clinical_significance = '
Dopamine is a catecholamine neurotransmitter synthesized in the brain and adrenal medulla. It is a precursor of norepinephrine and epinephrine. Measurement of plasma dopamine is primarily indicated for evaluating catecholamine-producing neuroendocrine tumors.

Clinical Utility & Interpretation:
• Diagnosis of Pheochromocytoma and Paraganglioma: These are rare catecholamine-secreting tumors of the adrenal medulla or extra-adrenal chromaffin tissue. While metanephrines are the primary screening tests, measuring dopamine is valuable for identifying tumors that selectively secrete dopamine, which are often malignant.
• Neuroblastoma: A common pediatric tumor arising from the sympathetic nervous system, frequently presenting with highly elevated dopamine and homovanillic acid (HVA) levels.
• Clinical Interpretation:
  - Normal Level (< 30 pg/mL supine): Rules out significant catecholamine excess under baseline conditions.
  - Elevated Levels: Suggest tumor presence, severe physiological stress, or drug interference (e.g., levodopa, tricyclic antidepressants, labetalol).' WHERE test_code = 'DOP-01';

UPDATE tests SET clinical_significance = '
Estradiol (E2) is the most potent physiological estrogen and the dominant ovarian hormone in non-pregnant, premenopausal females. In males, it is produced in small amounts by the testes and through peripheral aromatization of testosterones.

Clinical Utility & Interpretation:
• Ovarian Function & Fertility: Used to evaluate ovarian reserve, menstrual cycle irregularities, amenorrhea (absence of periods), and to monitor follicular development during ovarian stimulation for assisted reproductive technologies (IVF).
• Female Ranges:
  - Follicular Phase (30 - 120 pg/mL): Baseline levels at the beginning of the menstrual cycle.
  - Mid-Cycle Peak (130 - 370 pg/mL): Surge triggering ovulation.
  - Luteal Phase (70 - 250 pg/mL): Maintained by the corpus luteum.
  - Postmenopausal (< 30 pg/mL): Reflects cessation of ovarian estrogen synthesis.
• Gynecomastia and Pubertal Assessment: In males, elevated E2 levels can evaluate the cause of gynecomastia (breast development). In children, E2 helps assess precocious (early) or delayed puberty.' WHERE test_code = 'ESTR-01';

UPDATE tests SET clinical_significance = '
Urine/Fluid Electrolyte testing measures the concentration of sodium, potassium, and chloride in urine or sterile body fluids (e.g., peritoneal or pleural fluid). It is a valuable diagnostic tool in nephrology and internal medicine.

Clinical Utility & Interpretation:
• Evaluation of Acute Kidney Injury (AKI):
  - Urine Sodium < 20 mmol/L: Suggests pre-renal etiology (hypovolemia, dehydration). The kidneys function normally and retain sodium to maintain blood pressure.
  - Urine Sodium > 40 mmol/L: Suggests intrinsic renal injury (Acute Tubular Necrosis). The damaged renal tubules are unable to reabsorb sodium, causing salt wasting.
• Hyponatremia Investigation: Helps differentiate SIADH (characterized by high urine sodium > 40 mmol/L despite low serum sodium) from volume depletion or polydipsia.
• Urine Potassium Excretion: Evaluates hypokalemia. Urine potassium < 20 mmol/L suggests extra-renal potassium loss (e.g., diarrhea); urine potassium > 20 mmol/L suggests renal potassium wasting (e.g., hyperaldosteronism, tubular defects, diuretic use).' WHERE test_code = 'ELEC-UR-01';

UPDATE tests SET clinical_significance = '
Erythropoietin (EPO) is a glycoprotein hormone produced primarily by interstitial cells in the peritubular capillary bed of the kidneys in response to tissue hypoxia. It binds to receptors on bone marrow erythroid progenitor cells, stimulating red blood cell (RBC) production.

Clinical Utility & Interpretation:
• Differentiating Polycythemia:
  - Primary Polycythemia (Polycythemia Vera): An autonomous clonal myeloproliferative disorder presenting with high RBC mass and suppressed, low EPO levels (< 4.3 mIU/mL).
  - Secondary Polycythemia: Caused by chronic tissue hypoxia (e.g., chronic lung disease, high altitude, sleep apnea, smoking) or EPO-secreting tumors (renal cell carcinoma, cerebellar hemangioblastoma). Here, EPO levels are elevated.
• Investigation of Anemia: In patients with chronic kidney disease (CKD), damaged kidneys fail to produce sufficient EPO, leading to normocytic normochromic anemia. Low or normal EPO levels in the setting of anemia suggest renal dysfunction or anemia of chronic disease, while high EPO suggests appropriate bone marrow responsiveness (e.g., iron deficiency or hemolytic anemia).' WHERE test_code = 'EPO-01';


-- Generic fallback to ensure no test has empty clinical significance
-- Deleted generic fallback update statement to preserve clean empty values

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