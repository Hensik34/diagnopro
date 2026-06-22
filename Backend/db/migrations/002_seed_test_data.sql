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
  'Admin', 'User', 'admin@visionlab.com',
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
  (gen_random_uuid(), 'Complete Blood Count (CBC)', 'CBC-01', 'Hematology', 'Blood', 250, 4, 'Comprehensive blood cell count including RBC, WBC, platelets', NOW(), NOW()),
  (gen_random_uuid(), 'ESR (Erythrocyte Sedimentation Rate)', 'ESR-01', 'Hematology', 'Blood', 100, 2, 'Measures inflammatory response', NOW(), NOW()),
  (gen_random_uuid(), 'Blood Group & Rh Typing', 'BG-01', 'Hematology', 'Blood', 150, 1, 'ABO blood group and Rh factor determination', NOW(), NOW()),
  (gen_random_uuid(), 'Peripheral Blood Smear', 'PBS-01', 'Hematology', 'Blood', 200, 6, 'Microscopic examination of blood cells', NOW(), NOW()),
  (gen_random_uuid(), 'Prothrombin Time (PT/INR)', 'PT', 'Coagulation', 'Citrated Plasma (Blue Top)', 300.00, 4, 'Measures the time taken for blood to clot via the extrinsic pathway; includes INR for monitoring anticoagulant (warfarin) therapy.', NOW(), NOW()),
  (gen_random_uuid(), 'Activated Partial Thromboplastin Time (APTT)', 'APTT', 'Coagulation', 'Citrated Plasma (Blue Top)', 300.00, 4, 'Measures the time taken for blood to clot via the intrinsic pathway; used to monitor heparin therapy and screen for clotting factor deficiencies.', NOW(), NOW()),
  (gen_random_uuid(), 'Bleeding Time', 'BT-01', 'Hematology', 'Blood', 150, 2, 'Platelet function screening test', NOW(), NOW()),
  (gen_random_uuid(), 'Clotting Time', 'CT-01', 'Hematology', 'Blood', 150, 2, 'Extrinsic coagulation pathway test', NOW(), NOW()),
  (gen_random_uuid(), 'Fibrinogen', 'FIBR-01', 'Hematology', 'Blood', 300, 4, 'Blood clotting factor measurement', NOW(), NOW()),
  (gen_random_uuid(), 'D-Dimer', 'DD-01', 'Hematology', 'Blood', 400, 4, 'Thrombosis and fibrinolysis marker', NOW(), NOW()),
  (gen_random_uuid(), 'Lipid Profile', 'LIPID-01', 'Biochemistry', 'Blood', 350, 6, 'Cholesterol, HDL, LDL, VLDL, Triglycerides', NOW(), NOW()),
  (gen_random_uuid(), 'Liver Function Test (LFT)', 'LFT-01', 'Biochemistry', 'Blood', 400, 6, 'Bilirubin, SGOT, SGPT, ALP, Proteins', NOW(), NOW()),
  (gen_random_uuid(), 'Kidney Function Test (KFT)', 'KFT-01', 'Biochemistry', 'Blood', 450, 6, 'Urea, Creatinine, Electrolytes, eGFR', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Electrolytes (Na/K/Cl)', 'ELEC-01', 'Biochemistry', 'Blood', 300, 4, 'Sodium, Potassium, Chloride, CO2', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Calcium', 'CALC-01', 'Biochemistry', 'Blood', 150, 4, 'Total and ionized calcium measurement', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Phosphorus', 'PHOS-01', 'Biochemistry', 'Blood', 150, 4, 'Inorganic phosphorus level', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Magnesium', 'MAG-01', 'Biochemistry', 'Blood', 150, 4, 'Magnesium level measurement', NOW(), NOW()),
  (gen_random_uuid(), 'CRP (C-Reactive Protein)', 'CRP-01', 'Biochemistry', 'Blood', 250, 4, 'Inflammation marker', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Amylase', 'AMYL-01', 'Biochemistry', 'Blood', 250, 4, 'Pancreatic enzyme measurement', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Lipase', 'LIPAS-01', 'Biochemistry', 'Blood', 300, 4, 'Pancreatic lipase measurement', NOW(), NOW()),
  (gen_random_uuid(), 'Blood Sugar Fasting (FBS)', 'FBS-01', 'Biochemistry', 'Blood', 80, 2, 'Fasting glucose level', NOW(), NOW()),
  (gen_random_uuid(), 'Blood Sugar PP (Post Prandial)', 'PPBS-01', 'Biochemistry', 'Blood', 80, 2, 'Post-meal glucose measurement', NOW(), NOW()),
  (gen_random_uuid(), 'Random Blood Sugar (RBS)', 'RBS-01', 'Biochemistry', 'Blood', 80, 1, 'Random glucose level', NOW(), NOW()),
  (gen_random_uuid(), 'HbA1c (Glycated Hemoglobin)', 'HBA1C-01', 'Biochemistry', 'Blood', 350, 4, 'Average blood sugar over 3 months', NOW(), NOW()),
  (gen_random_uuid(), 'GTT (2-hour)', 'GTT-01', 'Biochemistry', 'Blood', 350, 4, '2-hour glucose tolerance test', NOW(), NOW()),
  (gen_random_uuid(), 'Fasting Insulin', 'INS-F-01', 'Biochemistry', 'Blood', 300, 4, 'Fasting insulin level', NOW(), NOW()),
  (gen_random_uuid(), 'C-Peptide', 'CPEP-01', 'Biochemistry', 'Blood', 350, 4, 'Beta cell function assessment', NOW(), NOW()),
  (gen_random_uuid(), 'Microalbumin (Urine)', 'MALB-01', 'Biochemistry', 'Urine', 200, 4, 'Urine microalbumin for diabetes screening', NOW(), NOW()),
  (gen_random_uuid(), 'TSH (Thyroid Stimulating Hormone)', 'TSH-01', 'Hormone', 'Blood', 200, 4, 'Thyroid function screening', NOW(), NOW()),
  (gen_random_uuid(), 'Free T3', 'FT3-01', 'Hormone', 'Blood', 300, 4, 'Free triiodothyronine level', NOW(), NOW()),
  (gen_random_uuid(), 'Free T4', 'FT4-01', 'Hormone', 'Blood', 300, 4, 'Free thyroxine level', NOW(), NOW()),
  (gen_random_uuid(), 'Thyroid Profile (Comprehensive)', 'THYPRO-01', 'Hormone', 'Blood', 900, 6, 'TSH, T3, T4, FT3, FT4, anti-TPO, anti-thyroglobulin and interpretation', NOW(), NOW()),
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
  (gen_random_uuid(), 'Apolipoprotein A1 (Apo A1)', 'APOA1-01', 'Biochemistry', 'Blood', 350, 4, 'HDL component', NOW(), NOW()),
  (gen_random_uuid(), 'Apolipoprotein B (Apo B)', 'APOB-01', 'Biochemistry', 'Blood', 350, 4, 'LDL component', NOW(), NOW()),
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
  (gen_random_uuid(), 'Widal Test', 'WIDAL-01', 'Serology', 'Blood', 200, 4, 'Typhoid fever antibodies', NOW(), NOW()),
  (gen_random_uuid(), 'VDRL (Syphilis Screening)', 'VDRL-01', 'Serology', 'Blood', 200, 4, 'Syphilis screening test', NOW(), NOW()),
  (gen_random_uuid(), 'RPR (Rapid Plasma Reagin)', 'RPR-01', 'Serology', 'Serum', 200, 4, 'Syphilis detection test', NOW(), NOW()),
  (gen_random_uuid(), 'FTA-ABS (Syphilis Confirmation)', 'FTAABS-01', 'Serology', 'Blood', 300, 4, 'Syphilis confirmation test', NOW(), NOW()),
  (gen_random_uuid(), 'HIV I & II (ELISA)', 'HIV-01', 'Serology', 'Serum', 300, 6, 'HIV antibody screening', NOW(), NOW()),
  (gen_random_uuid(), 'HIV Rapid Test', 'HIV-RAPID-01', 'Serology', 'Serum', 150, 1, 'Rapid HIV screening', NOW(), NOW()),
  (gen_random_uuid(), 'HBsAg (Hepatitis B Surface Antigen)', 'HBSAG-01', 'Serology', 'Serum', 250, 4, 'Hepatitis B screening', NOW(), NOW()),
  (gen_random_uuid(), 'Anti-HBc (Hepatitis B Core Antibodies)', 'AHBC-01', 'Serology', 'Blood', 250, 4, 'Hepatitis B exposure', NOW(), NOW()),
  (gen_random_uuid(), 'Anti-HBs (Hepatitis B Surface Antibodies)', 'AHBS-01', 'Serology', 'Blood', 250, 4, 'Hepatitis B immunity', NOW(), NOW()),
  (gen_random_uuid(), 'HBeAg (Hepatitis B E Antigen)', 'HBEAG-01', 'Serology', 'Blood', 300, 4, 'Hepatitis B viral load', NOW(), NOW()),
  (gen_random_uuid(), 'Anti-HCV (Hepatitis C)', 'HCV-01', 'Serology', 'Serum', 300, 6, 'Hepatitis C screening', NOW(), NOW()),
  (gen_random_uuid(), 'HCV RNA (Hepatitis C Viral Load)', 'HCV-RNA-01', 'Serology', 'Blood', 600, 4, 'Hepatitis C PCR quantification', NOW(), NOW()),
  (gen_random_uuid(), 'Anti-HAV IgM (Hepatitis A)', 'AHAV-IGM-01', 'Serology', 'Blood', 250, 4, 'Acute Hepatitis A infection', NOW(), NOW()),
  (gen_random_uuid(), 'Anti-HAV IgG (Hepatitis A)', 'AHAV-IGG-01', 'Serology', 'Blood', 250, 4, 'Hepatitis A immunity', NOW(), NOW()),
  (gen_random_uuid(), 'Dengue NS1 rapid', 'DENGNS1-RAPID', 'Serology', 'Serum', 300, 4, 'Qualitative detection of Dengue NS1 Antigen', NOW(), NOW()),
  (gen_random_uuid(), 'Dengue rapid', 'DENGUE-RAPID', 'Serology', 'Serum', 500, 4, 'Qualitative detection of Dengue IgM and IgG antibodies', NOW(), NOW()),
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
  (gen_random_uuid(), 'Immunoglobulin A (IgA)', 'IGA-01', 'Immunology', 'Blood', 350, 4, 'Immune response antibody', NOW(), NOW()),
  (gen_random_uuid(), 'Urine Routine & Microscopy', 'URINE-01', 'Clinical Pathology', 'Urine', 150, 3, 'Complete urine analysis', NOW(), NOW()),
  (gen_random_uuid(), 'Urine Culture & Sensitivity', 'UCULT-01', 'Microbiology', 'Urine', 500, 48, 'UTI pathogen identification', NOW(), NOW()),
  (gen_random_uuid(), 'Blood Culture & Sensitivity', 'BCULT-01', 'Microbiology', 'Blood', 700, 72, 'Bloodstream infection detection', NOW(), NOW()),
  (gen_random_uuid(), 'Stool Routine & Microscopy', 'STOOL-01', 'Clinical Pathology', 'Stool', 150, 3, 'Parasites and microbes', NOW(), NOW()),
  (gen_random_uuid(), 'Stool Culture & Sensitivity', 'SCULT-01', 'Microbiology', 'Stool', 600, 48, 'Bacterial pathogens', NOW(), NOW()),
  (gen_random_uuid(), 'Sputum Culture & Sensitivity', 'SPCULT-01', 'Microbiology', 'Sputum', 600, 48, 'Respiratory infection pathogens', NOW(), NOW()),
  (gen_random_uuid(), 'Pus Culture & Sensitivity', 'PCULT-01', 'Microbiology', 'Pus', 600, 48, 'Wound/abscess pathogens', NOW(), NOW()),
  (gen_random_uuid(), 'Throat Swab Culture', 'TCULT-01', 'Microbiology', 'Throat Swab', 500, 48, 'Streptococcus and pathogens', NOW(), NOW()),
  (gen_random_uuid(), 'Fungal Culture', 'FCULT-01', 'Microbiology', 'Various', 700, 72, 'Fungal pathogen identification', NOW(), NOW()),
  (gen_random_uuid(), 'KOH Preparation (Fungal)', 'KOH-01', 'Microbiology', 'Various', 200, 2, 'Fungal elements detection', NOW(), NOW()),
  (gen_random_uuid(), 'TB Culture (Sputum)', 'TBCULT-01', 'Microbiology', 'Sputum', 1000, 72, 'Tuberculosis detection', NOW(), NOW()),
  (gen_random_uuid(), 'TB GENE XPERT (Rapid TB)', 'TB-XPERT-01', 'Microbiology', 'Sputum', 800, 2, 'Rapid TB detection', NOW(), NOW()),
  (gen_random_uuid(), 'Malaria Antigen (Rapid Card)', 'MAL-AG-01', 'Serology', 'Whole Blood (EDTA)', 250, 1, 'Rapid antigen detection of P. falciparum and P. vivax', NOW(), NOW()),
  (gen_random_uuid(), 'CSF Analysis', 'CSF-01', 'Clinical Pathology', 'CSF', 800, 4, 'Cerebrospinal fluid analysis', NOW(), NOW()),
  (gen_random_uuid(), 'Pleural Fluid Analysis', 'PLEURAL-01', 'Clinical Pathology', 'Pleural Fluid', 700, 4, 'Pleural fluid examination', NOW(), NOW()),
  (gen_random_uuid(), 'FNAC (Fine Needle Aspiration Cytology)', 'FNAC-01', 'Histopathology', 'Tissue', 1500, 5, 'Needle aspiration cytology', NOW(), NOW()),
  (gen_random_uuid(), 'PAP Smear (Cervical Cytology)', 'PAP-01', 'Cytology', 'Cervical', 500, 3, 'Cervical cancer screening', NOW(), NOW()),
  (gen_random_uuid(), 'Biopsy Examination', 'BIOPSY-01', 'Histopathology', 'Tissue', 2000, 7, 'Tissue diagnosis', NOW(), NOW()),
  (gen_random_uuid(), 'Bone Marrow Examination', 'BM-01', 'Histopathology', 'Bone Marrow', 2500, 5, 'Hematologic malignancy investigation', NOW(), NOW()),
  (gen_random_uuid(), 'Ascitic Fluid Analysis', 'ASCITIC-01', 'Clinical Pathology', 'Ascitic Fluid', 700, 4, 'Ascites analysis', NOW(), NOW()),
  (gen_random_uuid(), 'Joint Fluid Analysis', 'JOINT-01', 'Clinical Pathology', 'Joint Fluid', 700, 4, 'Synovial fluid examination', NOW(), NOW()),
  (gen_random_uuid(), 'Semen Analysis', 'SEMEN-01', 'Andrology', 'Semen', 400, 4, 'Sperm count, motility, morphology', NOW(), NOW()),
  (gen_random_uuid(), 'Semen Culture', 'SEMEN-CULT-01', 'Microbiology', 'Semen', 600, 48, 'Bacterial contamination', NOW(), NOW()),
  (gen_random_uuid(), 'Pregnancy Test (Serum)', 'SPT-01', 'Hormone', 'Blood', 150, 2, 'Serum beta-HCG qualitative', NOW(), NOW()),
  (gen_random_uuid(), 'Pregnancy Test (Urine)', 'UPT-01', 'Hormone', 'Urine', 100, 1, 'Urine pregnancy test', NOW(), NOW()),
  (gen_random_uuid(), 'ACE (Angiotensin Converting Enzyme)', 'ACE-01', 'Biochemistry', 'Blood', 400, 4, 'Sarcoidosis marker', NOW(), NOW()),
  (gen_random_uuid(), 'Lactate Dehydrogenase (LDH)', 'LDH-01', 'Biochemistry', 'Blood', 200, 4, 'Tissue damage marker', NOW(), NOW()),
  (gen_random_uuid(), 'Total Protein', 'TP-01', 'Biochemistry', 'Blood', 100, 2, 'Albumin and globulin', NOW(), NOW()),
  (gen_random_uuid(), 'Albumin', 'ALB-01', 'Biochemistry', 'Blood', 100, 2, 'Protein synthesis marker', NOW(), NOW()),
  (gen_random_uuid(), 'Globulin', 'GLOB-01', 'Biochemistry', 'Blood', 100, 2, 'Immune protein level', NOW(), NOW()),
  (gen_random_uuid(), 'Blood Alcohol Level', 'BAL-01', 'Toxicology', 'Blood', 300, 2, 'Ethanol concentration', NOW(), NOW()),
  (gen_random_uuid(), 'Ammonia', 'AMMON-01', 'Biochemistry', 'Blood', 400, 4, 'Hepatic encephalopathy marker', NOW(), NOW()),
  (gen_random_uuid(), 'PAPP-A (Pregnancy Associated Plasma Protein)', 'PAPPA-01', 'Hormone', 'Blood', 500, 4, 'Down syndrome screening', NOW(), NOW()),
  (gen_random_uuid(), 'AFP (Maternal Serum)', 'AFP-MAT-01', 'Biochemistry', 'Blood', 450, 4, 'Neural tube defect screening', NOW(), NOW()),
  (gen_random_uuid(), 'uE3 (Unconjugated Estriol)', 'UE3-01', 'Hormone', 'Blood', 450, 4, 'Down syndrome screening', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Uric Acid', 'URIC-01', 'Biochemistry', 'Blood', 150, 4, 'Uric acid for gout screening', NOW(), NOW()),
  (gen_random_uuid(), 'Immunoglobulin G (IgG)', 'IGG-01', 'Immunology', 'Blood', 350, 4, 'Primary immune antibody', NOW(), NOW()),
  (gen_random_uuid(), 'Immunoglobulin M (IgM)', 'IGM-01', 'Immunology', 'Blood', 350, 4, 'Acute immune response', NOW(), NOW()),
  (gen_random_uuid(), 'Chikungunya IgM', 'CHIK-IGM-01', 'Serology', 'Serum', 600, 24, 'Detection of IgM antibodies to Chikungunya virus', NOW(), NOW()),
  (gen_random_uuid(), 'Urine Albumin/Creatinine Ratio (ACR)', 'UACR-01', 'Biochemistry', 'Urine', 400, 4, 'Spot urine albumin to creatinine ratio for early kidney damage / microalbuminuria', NOW(), NOW()),
  (gen_random_uuid(), 'TORCH Evaluation', 'TORCH-01', 'Serology', 'Serum', 2500, 24, 'Panel for Toxoplasma, Rubella, CMV and Herpes (IgG & IgM antibodies)', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

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
'{"male":{"min":13.0,"max":17.0},"female":{"min":12.0,"max":15.0}}'::jsonb,
'{"low":7.0,"high":20.0}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'RBC Count','million/uL','number',NULL,'input',
NULL,NULL,
'RBC Parameters',2,
'{"male":{"min":4.5,"max":5.9},"female":{"min":4.1,"max":5.1}}'::jsonb,
'{"low":2.5,"high":7.0}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'Total WBC Count','/uL','number',NULL,'input',
NULL,NULL,
'RBC Parameters',3,
'{"min":4000,"max":11000}'::jsonb,
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
'{"min":40,"max":70}'::jsonb,
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
'{"min":2,"max":8}'::jsonb,
'{"high":20}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'Eosinophils','%','number',NULL,'input',
NULL,NULL,
'Differential Count',8,
'{"min":1,"max":6}'::jsonb,
'{"high":20}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'Basophils','%','number',NULL,'input',
NULL,NULL,
'Differential Count',9,
'{"min":0,"max":2}'::jsonb,
'{"high":5}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'Absolute Neutrophil Count','/uL','number',NULL,'calculated',
'(Total WBC Count * Neutrophils) / 100',
'Total WBC Count,Neutrophils',
'Differential Count',10,
'{"min":1500,"max":8000}'::jsonb,
'{"low":500}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'Absolute Lymphocyte Count','/uL','number',NULL,'calculated',
'(Total WBC Count * Lymphocytes) / 100',
'Total WBC Count,Lymphocytes',
'Differential Count',11,
'{"min":1000,"max":4800}'::jsonb,
'{"low":500}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'Absolute Monocyte Count','/uL','number',NULL,'calculated',
'(Total WBC Count * Monocytes) / 100',
'Total WBC Count,Monocytes',
'Differential Count',12,
'{"min":200,"max":800}'::jsonb,
'{"high":3000}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'Absolute Eosinophil Count','/uL','number',NULL,'calculated',
'(Total WBC Count * Eosinophils) / 100',
'Total WBC Count,Eosinophils',
'Differential Count',13,
'{"min":0,"max":500}'::jsonb,
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
'{"male":{"min":40,"max":52},"female":{"min":36,"max":46}}'::jsonb,
'{"low":20,"high":60}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'RDW-CV','%','number',NULL,'input',
NULL,NULL,
'Blood Indices',16,
'{"min":11.5,"max":14.5}'::jsonb,
'{"high":25}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'MCHC','g/dL','number',NULL,'input',
NULL,NULL,
'Blood Indices',17,
'{"min":32,"max":36}'::jsonb,
'{"low":25,"high":40}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'MCH','pg','number',NULL,'input',
NULL,NULL,
'Blood Indices',18,
'{"min":27,"max":33}'::jsonb,
'{"low":20,"high":40}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'MCV','fL','number',NULL,'input',
NULL,NULL,
'Blood Indices',19,
'{"min":80,"max":100}'::jsonb,
'{"low":60,"high":120}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='CBC-01'),
'MPV','fL','number',NULL,'input',
NULL,NULL,
'Blood Indices',20,
'{"min":7.5,"max":11.5}'::jsonb,
'{"high":20}'::jsonb,
true,NOW(),NOW()),

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
'{"max":200.0}'::jsonb,NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='LIPID-01'),
'Serum Triglyceride','mg/dL','number',NULL,'input',
NULL,NULL,
'Lipid Values',2,
'{"max":150.0}'::jsonb,NULL,
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
'{"max":130.0}'::jsonb,NULL,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='LIPID-01'),
'S. VLDL Cholesterol','mg/dL','number',NULL,'calculated',
'Serum Triglyceride / 5',
'Serum Triglyceride',
'Lipid Values',5,
'{"max":34.0}'::jsonb,NULL,
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
'Total Lipids','mg/dL','number',NULL,'input',
NULL,NULL,
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
'{"min":11.0,"max":13.5}'::jsonb,
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
'{"min":25.0,"max":35.0}'::jsonb,
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
'Dengue IgM',NULL,'select','Negative,Positive','input',
NULL,NULL,
'Dengue Serology',1,
NULL,
'{"positive":"Positive"}'::jsonb,
true,NOW(),NOW()),

(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='DENGUE-RAPID'),
'Dengue IgG',NULL,'select','Negative,Positive','input',
NULL,NULL,
'Dengue Serology',2,
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

-- HIV (HIV-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='HIV-01'),
'HIV I & II',NULL,'select','Negative,Positive','input',
NULL,NULL,
'HIV Screening',1,
NULL,
'{"positive":"Positive"}'::jsonb,
true,NOW(),NOW()),

-- HBsAg (HBSAG-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='HBSAG-01'),
'HBsAg',NULL,'select','Negative,Positive','input',
NULL,NULL,
'Hepatitis B Screening',1,
NULL,
'{"positive":"Positive"}'::jsonb,
true,NOW(),NOW()),

-- HCV (HCV-01)
(gen_random_uuid(), (SELECT id FROM tests WHERE test_code='HCV-01'),
'Anti-HCV',NULL,'select','Negative,Positive','input',
NULL,NULL,
'Hepatitis C Screening',1,
NULL,
'{"positive":"Positive"}'::jsonb,
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
NULL,
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
false,NOW(),NOW())

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
  ('THYROID_COMPREHENSIVE', 'Free T3', 'pg/mL', 2.00, 4.40, 'number', NULL, 2, 'input', NULL, NULL, 'Thyroid | Hormones', NULL, NULL, NULL, true),
  ('THYROID_COMPREHENSIVE', 'Free T4', 'ng/dL', 0.80, 1.80, 'number', NULL, 3, 'input', NULL, NULL, 'Thyroid | Hormones', NULL, NULL, NULL, true),
  ('THYROID_COMPREHENSIVE', 'Total T3', 'ng/dL', 80.00, 200.00, 'number', NULL, 4, 'input', NULL, NULL, 'Thyroid | Hormones', NULL, NULL, NULL, true),
  ('THYROID_COMPREHENSIVE', 'Total T4', 'ug/dL', 4.60, 12.00, 'number', NULL, 5, 'input', NULL, NULL, 'Thyroid | Hormones', NULL, NULL, NULL, true),
  ('THYROID_COMPREHENSIVE', 'Anti-TPO Antibody', 'IU/mL', 0.00, 34.00, 'number', NULL, 6, 'input', NULL, NULL, 'Thyroid | Autoantibodies', NULL, NULL, NULL, true),
  ('THYROID_COMPREHENSIVE', 'Anti-Thyroglobulin Antibody', 'IU/mL', 0.00, 115.00, 'number', NULL, 7, 'input', NULL, NULL, 'Thyroid | Autoantibodies', NULL, NULL, NULL, true),
  ('THYROID_COMPREHENSIVE', 'TSI/TRAb', 'IU/L', 0.00, 1.75, 'number', NULL, 8, 'input', NULL, NULL, 'Thyroid | Autoantibodies', NULL, NULL, NULL, false),
  ('THYROID_COMPREHENSIVE', 'Method', NULL, NULL, NULL, 'text', NULL, 9, 'input', NULL, NULL, 'Thyroid | Method', NULL, NULL, NULL, true),
  ('THYROID_COMPREHENSIVE', 'Pregnancy Trimester', NULL, NULL, NULL, 'select', 'Non-pregnant,First trimester,Second trimester,Third trimester', 10, 'input', NULL, NULL, 'Thyroid | Clinical Context', NULL, NULL, NULL, false),
  ('THYROID_COMPREHENSIVE', 'Interpretation', NULL, NULL, NULL, 'textarea', NULL, 11, 'input', NULL, NULL, 'Thyroid | Interpretation', NULL, NULL, '{"rule":"Correlate TSH with FT4 and antibodies for thyroiditis, hypo/hyperthyroid states"}'::jsonb, true),
  ('THYROID_COMPREHENSIVE', 'Recommended Follow-up', NULL, NULL, NULL, 'textarea', NULL, 12, 'input', NULL, NULL, 'Thyroid | Recommendations', NULL, NULL, NULL, false),

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
  ('URINE_ROUTINE_COMPLETE', 'Pus Cells', '/HPF', 0.00, 5.00, 'number', NULL, 15, 'input', NULL, NULL, 'Urine | Microscopy', NULL, NULL, NULL, true),
  ('URINE_ROUTINE_COMPLETE', 'RBCs', '/HPF', 0.00, 2.00, 'number', NULL, 16, 'input', NULL, NULL, 'Urine | Microscopy', NULL, NULL, NULL, true),
  ('URINE_ROUTINE_COMPLETE', 'Epithelial Cells', '/HPF', 0.00, 5.00, 'number', NULL, 17, 'input', NULL, NULL, 'Urine | Microscopy', NULL, NULL, NULL, true),
  ('URINE_ROUTINE_COMPLETE', 'Casts', NULL, NULL, NULL, 'select', 'None,Hyaline,Granular,Waxy,RBC cast,WBC cast', 18, 'input', NULL, NULL, 'Urine | Microscopy', NULL, NULL, NULL, true),
  ('URINE_ROUTINE_COMPLETE', 'Crystals', NULL, NULL, NULL, 'select', 'None,Uric acid,Calcium oxalate,Triple phosphate,Cystine,Amorphous', 19, 'input', NULL, NULL, 'Urine | Microscopy', NULL, NULL, NULL, true),
  ('URINE_ROUTINE_COMPLETE', 'Bacteria', NULL, NULL, NULL, 'select', 'Absent,Few,Moderate,Many', 20, 'input', NULL, NULL, 'Urine | Microscopy', NULL, NULL, NULL, true),
  ('URINE_ROUTINE_COMPLETE', 'Yeast Cells', NULL, NULL, NULL, 'select', 'Absent,Present', 21, 'input', NULL, NULL, 'Urine | Microscopy', NULL, NULL, NULL, true),
  ('URINE_ROUTINE_COMPLETE', 'Mucus Threads', NULL, NULL, NULL, 'select', 'Absent,Few,Moderate,Many', 22, 'input', NULL, NULL, 'Urine | Microscopy', NULL, NULL, NULL, false),
  ('URINE_ROUTINE_COMPLETE', 'Parasites', NULL, NULL, NULL, 'select', 'Absent,Present', 23, 'input', NULL, NULL, 'Urine | Microscopy', NULL, NULL, NULL, false),
  ('URINE_ROUTINE_COMPLETE', 'Method', NULL, NULL, NULL, 'text', NULL, 24, 'input', NULL, NULL, 'Urine | Method', NULL, NULL, NULL, true),
  ('URINE_ROUTINE_COMPLETE', 'Interpretation', NULL, NULL, NULL, 'textarea', NULL, 25, 'input', NULL, NULL, 'Urine | Interpretation', NULL, NULL, NULL, true),

  ('SEMEN_WHO_COMPLETE', 'Abstinence Period', 'days', 2.00, 7.00, 'number', NULL, 1, 'input', NULL, NULL, 'Semen | Collection', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Collection to Analysis Time', 'minutes', 0.00, 60.00, 'number', NULL, 2, 'input', NULL, NULL, 'Semen | Collection', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Volume', 'mL', 1.40, 7.00, 'number', NULL, 3, 'input', NULL, NULL, 'Semen | Macroscopic', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Color', NULL, NULL, NULL, 'select', 'Gray-opalescent,Whitish,Yellowish,Reddish', 4, 'input', NULL, NULL, 'Semen | Macroscopic', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Viscosity', NULL, NULL, NULL, 'select', 'Normal,Increased,Highly increased', 5, 'input', NULL, NULL, 'Semen | Macroscopic', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Liquefaction Time', 'minutes', 15.00, 60.00, 'number', NULL, 6, 'input', NULL, NULL, 'Semen | Macroscopic', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'pH', NULL, 7.20, 8.00, 'number', NULL, 7, 'input', NULL, NULL, 'Semen | Macroscopic', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Sperm Concentration', 'million/mL', 15.00, 300.00, 'number', NULL, 8, 'input', NULL, NULL, 'Semen | Count', NULL, '{"low":1}'::jsonb, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Total Sperm Number', 'million/ejaculate', 39.00, 1500.00, 'number', NULL, 9, 'calculated', 'Sperm Concentration * Volume', 'Sperm Concentration,Volume', 'Semen | Count', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Total Motility (PR+NP)', '%', 42.00, 100.00, 'number', NULL, 10, 'input', NULL, NULL, 'Semen | Motility', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Progressive Motility (PR)', '%', 30.00, 100.00, 'number', NULL, 11, 'input', NULL, NULL, 'Semen | Motility', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Non-progressive Motility (NP)', '%', 0.00, 30.00, 'number', NULL, 12, 'input', NULL, NULL, 'Semen | Motility', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Immotile', '%', 0.00, 70.00, 'number', NULL, 13, 'input', NULL, NULL, 'Semen | Motility', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Vitality (Live Sperms)', '%', 54.00, 100.00, 'number', NULL, 14, 'input', NULL, NULL, 'Semen | Vitality', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Normal Morphology (Strict)', '%', 4.00, 100.00, 'number', NULL, 15, 'input', NULL, NULL, 'Semen | Morphology', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Head Defects', '%', 0.00, 100.00, 'number', NULL, 16, 'input', NULL, NULL, 'Semen | Morphology', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Midpiece Defects', '%', 0.00, 100.00, 'number', NULL, 17, 'input', NULL, NULL, 'Semen | Morphology', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Tail Defects', '%', 0.00, 100.00, 'number', NULL, 18, 'input', NULL, NULL, 'Semen | Morphology', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Round Cells', 'million/mL', 0.00, 1.00, 'number', NULL, 19, 'input', NULL, NULL, 'Semen | Cells', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Leukocytes (Peroxidase)', 'million/mL', 0.00, 1.00, 'number', NULL, 20, 'input', NULL, NULL, 'Semen | Cells', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Agglutination', NULL, NULL, NULL, 'select', 'Absent,Present (+),Present (++),Present (+++)', 21, 'input', NULL, NULL, 'Semen | Cells', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Debris', NULL, NULL, NULL, 'select', 'Absent,Minimal,Moderate,Heavy', 22, 'input', NULL, NULL, 'Semen | Cells', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Fructose', NULL, NULL, NULL, 'select', 'Present,Absent', 23, 'input', NULL, NULL, 'Semen | Biochemistry', NULL, NULL, NULL, false),
  ('SEMEN_WHO_COMPLETE', 'Zinc', 'umol/ejaculate', 2.40, 20.00, 'number', NULL, 24, 'input', NULL, NULL, 'Semen | Biochemistry', NULL, NULL, NULL, false),
  ('SEMEN_WHO_COMPLETE', 'MAR Test', '%', 0.00, 50.00, 'number', NULL, 25, 'input', NULL, NULL, 'Semen | Immunology', NULL, NULL, NULL, false),
  ('SEMEN_WHO_COMPLETE', 'Total Motile Sperm Count', 'million', 20.00, 1000.00, 'number', NULL, 26, 'calculated', '(Total Motility (PR+NP) / 100) * Total Sperm Number', 'Total Motility (PR+NP),Total Sperm Number', 'Semen | Calculated', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Progressively Motile Sperm Count', 'million', 10.00, 1000.00, 'number', NULL, 27, 'calculated', '(Progressive Motility (PR) / 100) * Total Sperm Number', 'Progressive Motility (PR),Total Sperm Number', 'Semen | Calculated', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Method', NULL, NULL, NULL, 'text', NULL, 28, 'input', NULL, NULL, 'Semen | Method', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'WHO Reference Version', NULL, NULL, NULL, 'text', NULL, 29, 'input', NULL, NULL, 'Semen | Method', NULL, NULL, NULL, true),
  ('SEMEN_WHO_COMPLETE', 'Interpretation', NULL, NULL, NULL, 'textarea', NULL, 30, 'input', NULL, NULL, 'Semen | Interpretation', NULL, NULL, '{"rule":"Classify oligo/astheno/terato/azoospermia per WHO criteria"}'::jsonb, true),

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
    CASE
      WHEN t.test_code = 'THYPRO-01' THEN 'THYROID_COMPREHENSIVE'
      WHEN t.test_code = 'URINE-01' THEN 'URINE_ROUTINE_COMPLETE'
      WHEN t.test_code = 'SEMEN-01' THEN 'SEMEN_WHO_COMPLETE'
      WHEN t.test_code IN ('UCULT-01', 'BCULT-01', 'SCULT-01', 'SPCULT-01', 'PCULT-01', 'TCULT-01', 'FCULT-01', 'SEMEN-CULT-01', 'TBCULT-01') THEN 'CULTURE_COMPLETE'
      WHEN t.test_code IN ('BIOPSY-01', 'BM-01') THEN 'HISTOPATH_STANDARD'
      WHEN t.test_code IN ('FNAC-01', 'PAP-01') THEN 'CYTOLOGY_BETHESDA'
      WHEN t.test_code = 'GTT-01' THEN 'GLUCOSE_TOLERANCE_PANEL'
      WHEN t.test_code IN ('CSF-01', 'PLEURAL-01', 'ASCITIC-01', 'JOINT-01') THEN 'FLUID_ANALYSIS_PANEL'
      WHEN t.test_code = 'BG-01' THEN 'BLOOD_GROUP_PANEL'
      WHEN t.category = 'Serology' THEN 'SINGLE_ANALYTE_QUALITATIVE'
      ELSE 'SINGLE_ANALYTE_NUMERIC'
    END AS template_code
  FROM tests t
  WHERE t.test_code NOT IN ('CBC-01', 'LFT-01', 'KFT-01', 'LIPID-01', 'PT', 'APTT', 'HBA1C-01', 'MAL-AG-01', 'TP-01', 'HIV-01', 'HBSAG-01', 'HCV-01', 'CHIK-IGM-01', 'UACR-01', 'TORCH-01', 'HIV-RAPID-01', 'RPR-01', 'TB-XPERT-01', 'DENGUE-01', 'DENGUE-RAPID', 'DENGNS1-RAPID', 'DENGNS1-01', 'DENGIGG-01')
),
seed_rows AS (
  SELECT
    gen_random_uuid() AS id,
    tpm.test_id,
    tf.field_name,
    tf.unit,
    tf.min_value,
    tf.max_value,
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
        WHEN tf.min_value IS NOT NULL OR tf.max_value IS NOT NULL THEN jsonb_build_array(
          jsonb_build_object('age_group', 'adult', 'sex', 'male', 'low', tf.min_value, 'high', tf.max_value),
          jsonb_build_object('age_group', 'adult', 'sex', 'female', 'low', tf.min_value, 'high', tf.max_value),
          jsonb_build_object('age_group', 'pediatric', 'sex', 'any', 'low', tf.min_value, 'high', tf.max_value)
        )
        ELSE jsonb_build_array(
          jsonb_build_object('age_group', 'all', 'sex', 'any', 'note', 'Qualitative cutoff based interpretation')
        )
      END::jsonb
    ) AS reference_rules,
    COALESCE(
      tf.critical_rules::jsonb,
      CASE
        WHEN tf.min_value IS NOT NULL OR tf.max_value IS NOT NULL THEN jsonb_build_object(
          'low', CASE WHEN tf.min_value IS NOT NULL THEN round((tf.min_value * 0.60)::numeric, 2) ELSE NULL END,
          'high', CASE WHEN tf.max_value IS NOT NULL THEN round((tf.max_value * 1.80)::numeric, 2) ELSE NULL END,
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
ON CONFLICT (package_code) DO NOTHING;

 

-- Update default clinical significance for key panel tests
UPDATE tests SET clinical_significance = 'Complete Blood Count (CBC) is a routine screening test used to evaluate overall health and detect a wide range of disorders, including anemia, infection, and leukemia. Hemoglobin levels evaluate oxygen-carrying capacity. White Blood Cell (WBC) count and differentials assess immune status and inflammatory response. Platelet counts are crucial for blood clotting assessment. Clinical correlation is recommended.' WHERE test_code = 'CBC-01';

UPDATE tests SET clinical_significance = 'Liver Function Tests (LFTs) assess hepatic synthetic, metabolic, and excretory function. Elevations in transaminases (SGOT/SGPT) suggest hepatocellular injury, while increases in alkaline phosphatase (ALP) and bilirubin indicate cholestasis or biliary tract pathology. Total protein and albumin levels reflect synthetic function.' WHERE test_code = 'LFT-01';

UPDATE tests SET clinical_significance = 'Kidney Function Tests (KFTs) are used to evaluate renal function. Serum creatinine and urea are excretory waste products; elevations suggest reduced glomerular filtration rate (GFR). Electrolyte levels (sodium, potassium, chloride) are critical for maintaining fluid and acid-base balance.' WHERE test_code = 'KFT-01';

UPDATE tests SET clinical_significance = 'Lipid Profile is used to assess cardiovascular risk. Elevated levels of Total Cholesterol, LDL ("bad") Cholesterol, and Triglycerides, combined with low levels of HDL ("good") Cholesterol, are associated with an increased risk of atherosclerosis and coronary heart disease.' WHERE test_code = 'LIPID-01';

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
-- SUMMARY COUNTS
-- ============================================
SELECT COUNT(*) AS total_tests FROM tests;
SELECT COUNT(*) AS total_test_fields FROM test_fields;
SELECT COUNT(*) AS total_packages FROM test_packages;
SELECT 'Seed migration 002 complete' AS status;