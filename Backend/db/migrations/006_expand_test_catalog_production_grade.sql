-- ============================================
-- PRODUCTION-GRADE PATHOLOGY LABORATORY EXPANSION
-- Migration 006: Comprehensive Test Catalog (100+ Tests)
-- ============================================
-- Purpose: Expand from 40 to 100+ tests with comprehensive test fields,
--          reference ranges by age/gender, test packages, and calculated fields
-- Idempotent: Safe to run multiple times
-- ============================================

-- ============================================
-- 1. CREATE NEW TABLES FOR REFERENCE RANGES
-- ============================================

CREATE TABLE IF NOT EXISTS test_reference_ranges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_field_id UUID NOT NULL REFERENCES test_fields(id) ON DELETE CASCADE,
    gender VARCHAR(20) DEFAULT 'Any', -- Male, Female, Any
    age_min INTEGER DEFAULT 0,
    age_max INTEGER DEFAULT 120,
    min_value DECIMAL(15,4),
    max_value DECIMAL(15,4),
    critical_low DECIMAL(15,4),
    critical_high DECIMAL(15,4),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(test_field_id, gender, age_min, age_max)
);

CREATE INDEX IF NOT EXISTS idx_test_reference_ranges_test_field ON test_reference_ranges(test_field_id);
CREATE INDEX IF NOT EXISTS idx_test_reference_ranges_gender_age ON test_reference_ranges(gender, age_min, age_max);

-- ============================================
-- 2. CREATE TEST PACKAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS test_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_name VARCHAR(255) NOT NULL,
    package_code VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100),
    description TEXT,
    price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_test_packages_code ON test_packages(package_code);
CREATE INDEX IF NOT EXISTS idx_test_packages_active ON test_packages(is_active);

-- ============================================
-- 3. CREATE PACKAGE-TEST MAPPING TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS package_test_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES test_packages(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(package_id, test_id)
);

CREATE INDEX IF NOT EXISTS idx_package_test_mapping_package ON package_test_mapping(package_id);
CREATE INDEX IF NOT EXISTS idx_package_test_mapping_test ON package_test_mapping(test_id);

-- ============================================
-- 4. ADD FORMULA SUPPORT TO TEST_FIELDS
-- ============================================

ALTER TABLE test_fields ADD COLUMN IF NOT EXISTS formula TEXT;
ALTER TABLE test_fields ADD COLUMN IF NOT EXISTS depends_on JSONB DEFAULT '[]';
ALTER TABLE test_fields ADD COLUMN IF NOT EXISTS field_type VARCHAR(50) DEFAULT 'input'; -- input, calculated, reference

-- ============================================
-- SECTION 5: INSERT 100+ PATHOLOGY TESTS
-- ============================================

-- HEMATOLOGY TESTS --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Complete Blood Count (CBC)', 'CBC-01', 'Hematology', 'Blood', 250, 4, 'Comprehensive blood cell count including RBC, WBC, platelets', NOW(), NOW()),
  (gen_random_uuid(), 'ESR (Erythrocyte Sedimentation Rate)', 'ESR-01', 'Hematology', 'Blood', 100, 2, 'Measures inflammatory response', NOW(), NOW()),
  (gen_random_uuid(), 'Blood Group & Rh Typing', 'BG-01', 'Hematology', 'Blood', 150, 1, 'ABO blood group and Rh factor determination', NOW(), NOW()),
  (gen_random_uuid(), 'Peripheral Blood Smear', 'PBS-01', 'Hematology', 'Blood', 200, 6, 'Microscopic examination of blood cells', NOW(), NOW()),
  (gen_random_uuid(), 'PT/INR (Prothrombin Time)', 'PTINR-01', 'Hematology', 'Blood', 250, 4, 'Coagulation profile - PT/INR', NOW(), NOW()),
  (gen_random_uuid(), 'aPTT (Activated Partial Thromboplastin Time)', 'APTT-01', 'Hematology', 'Blood', 250, 4, 'Intrinsic coagulation pathway test', NOW(), NOW()),
  (gen_random_uuid(), 'Bleeding Time', 'BT-01', 'Hematology', 'Blood', 150, 2, 'Platelet function screening test', NOW(), NOW()),
  (gen_random_uuid(), 'Clotting Time', 'CT-01', 'Hematology', 'Blood', 150, 2, 'Extrinsic coagulation pathway test', NOW(), NOW()),
  (gen_random_uuid(), 'Fibrinogen', 'FIBR-01', 'Hematology', 'Blood', 300, 4, 'Blood clotting factor measurement', NOW(), NOW()),
  (gen_random_uuid(), 'D-Dimer', 'DD-01', 'Hematology', 'Blood', 400, 4, 'Thrombosis and fibrinolysis marker', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- BIOCHEMISTRY - ROUTINE TESTS --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Lipid Profile', 'LIPID-01', 'Biochemistry', 'Blood', 350, 6, 'Cholesterol, HDL, LDL, VLDL, Triglycerides', NOW(), NOW()),
  (gen_random_uuid(), 'Liver Function Test (LFT)', 'LFT-01', 'Biochemistry', 'Blood', 400, 6, 'Bilirubin, SGOT, SGPT, ALP, Proteins', NOW(), NOW()),
  (gen_random_uuid(), 'Kidney Function Test (KFT)', 'KFT-01', 'Biochemistry', 'Blood', 450, 6, 'Urea, Creatinine, Electrolytes, eGFR', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Electrolytes (Na/K/Cl)', 'ELEC-01', 'Biochemistry', 'Blood', 300, 4, 'Sodium, Potassium, Chloride, CO2', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Calcium', 'CALC-01', 'Biochemistry', 'Blood', 150, 4, 'Total and ionized calcium measurement', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Phosphorus', 'PHOS-01', 'Biochemistry', 'Blood', 150, 4, 'Inorganic phosphorus level', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Magnesium', 'MAG-01', 'Biochemistry', 'Blood', 150, 4, 'Magnesium level measurement', NOW(), NOW()),
  (gen_random_uuid(), 'CRP (C-Reactive Protein)', 'CRP-01', 'Biochemistry', 'Blood', 250, 4, 'Inflammation marker', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Amylase', 'AMYL-01', 'Biochemistry', 'Blood', 250, 4, 'Pancreatic enzyme measurement', NOW(), NOW()),
  (gen_random_uuid(), 'Serum Lipase', 'LIPAS-01', 'Biochemistry', 'Blood', 300, 4, 'Pancreatic lipase measurement', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- BLOOD SUGAR TESTS --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Blood Sugar Fasting (FBS)', 'FBS-01', 'Biochemistry', 'Blood', 80, 2, 'Fasting glucose level', NOW(), NOW()),
  (gen_random_uuid(), 'Blood Sugar PP (Post Prandial)', 'PPBS-01', 'Biochemistry', 'Blood', 80, 2, 'Post-meal glucose measurement', NOW(), NOW()),
  (gen_random_uuid(), 'Random Blood Sugar (RBS)', 'RBS-01', 'Biochemistry', 'Blood', 80, 1, 'Random glucose level', NOW(), NOW()),
  (gen_random_uuid(), 'HbA1c (Glycated Hemoglobin)', 'HBA1C-01', 'Biochemistry', 'Blood', 350, 4, 'Average blood sugar over 3 months', NOW(), NOW()),
  (gen_random_uuid(), 'Oral Glucose Tolerance Test (OGTT)', 'OGTT-01', 'Biochemistry', 'Blood', 400, 4, 'Glucose tolerance assessment', NOW(), NOW()),
  (gen_random_uuid(), 'GTT (2-hour)', 'GTT-01', 'Biochemistry', 'Blood', 350, 4, '2-hour glucose tolerance test', NOW(), NOW()),
  (gen_random_uuid(), 'Fasting Insulin', 'INS-F-01', 'Biochemistry', 'Blood', 300, 4, 'Fasting insulin level', NOW(), NOW()),
  (gen_random_uuid(), 'C-Peptide', 'CPEP-01', 'Biochemistry', 'Blood', 350, 4, 'Beta cell function assessment', NOW(), NOW()),
  (gen_random_uuid(), 'Microalbumin (Urine)', 'MALB-01', 'Biochemistry', 'Urine', 200, 4, 'Urine microalbumin for diabetes screening', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- THYROID TESTS --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'TSH (Thyroid Stimulating Hormone)', 'TSH-01', 'Hormone', 'Blood', 200, 4, 'Thyroid function screening', NOW(), NOW()),
  (gen_random_uuid(), 'Free T3', 'FT3-01', 'Hormone', 'Blood', 300, 4, 'Free triiodothyronine level', NOW(), NOW()),
  (gen_random_uuid(), 'Free T4', 'FT4-01', 'Hormone', 'Blood', 300, 4, 'Free thyroxine level', NOW(), NOW()),
  (gen_random_uuid(), 'Total T3', 'T3-01', 'Hormone', 'Blood', 250, 4, 'Total triiodothyronine level', NOW(), NOW()),
  (gen_random_uuid(), 'Total T4', 'T4-01', 'Hormone', 'Blood', 250, 4, 'Total thyroxine level', NOW(), NOW()),
  (gen_random_uuid(), 'Anti-TPO (Thyroid Peroxidase Antibodies)', 'ATPO-01', 'Immunology', 'Blood', 400, 4, 'Autoimmune thyroid marker', NOW(), NOW()),
  (gen_random_uuid(), 'Anti-Thyroglobulin', 'ATG-01', 'Immunology', 'Blood', 400, 4, 'Thyroid antibodies', NOW(), NOW()),
  (gen_random_uuid(), 'Thyroglobulin', 'TG-01', 'Hormone', 'Blood', 350, 4, 'Thyroid hormone precursor', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- REPRODUCTIVE HORMONES --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'FSH (Follicle Stimulating Hormone)', 'FSH-01', 'Hormone', 'Blood', 350, 4, 'Reproductive hormone - pituitary', NOW(), NOW()),
  (gen_random_uuid(), 'LH (Luteinizing Hormone)', 'LH-01', 'Hormone', 'Blood', 350, 4, 'Reproductive hormone - pituitary', NOW(), NOW()),
  (gen_random_uuid(), 'Prolactin', 'PROL-01', 'Hormone', 'Blood', 350, 4, 'Milk production hormone', NOW(), NOW()),
  (gen_random_uuid(), 'Testosterone', 'TEST-01', 'Hormone', 'Blood', 400, 4, 'Male reproductive hormone', NOW(), NOW()),
  (gen_random_uuid(), 'Free Testosterone', 'FTEST-01', 'Hormone', 'Blood', 450, 4, 'Bioavailable testosterone', NOW(), NOW()),
  (gen_random_uuid(), 'Estradiol', 'ESTR-01', 'Hormone', 'Blood', 400, 4, 'Female reproductive hormone', NOW(), NOW()),
  (gen_random_uuid(), 'Progesterone', 'PROG-01', 'Hormone', 'Blood', 400, 4, 'Luteal phase hormone', NOW(), NOW()),
  (gen_random_uuid(), 'AMH (Anti-Müllerian Hormone)', 'AMH-01', 'Hormone', 'Blood', 500, 4, 'Ovarian reserve marker', NOW(), NOW()),
  (gen_random_uuid(), 'Beta-HCG (Quantitative)', 'BHCG-Q-01', 'Hormone', 'Blood', 250, 2, 'Pregnancy hormone (quantitative)', NOW(), NOW()),
  (gen_random_uuid(), 'Beta-HCG (Qualitative)', 'BHCG-QL-01', 'Hormone', 'Blood', 100, 1, 'Pregnancy hormone (yes/no)', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- ADRENAL & PITUITARY HORMONES --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Cortisol (8 AM)', 'CORT-AM-01', 'Hormone', 'Blood', 400, 4, 'Morning cortisol level', NOW(), NOW()),
  (gen_random_uuid(), 'Cortisol (4 PM)', 'CORT-PM-01', 'Hormone', 'Blood', 400, 4, 'Afternoon cortisol level', NOW(), NOW()),
  (gen_random_uuid(), 'ACTH (Adrenocorticotropic Hormone)', 'ACTH-01', 'Hormone', 'Blood', 450, 4, 'Pituitary hormone', NOW(), NOW()),
  (gen_random_uuid(), 'PTH (Parathyroid Hormone)', 'PTH-01', 'Hormone', 'Blood', 400, 4, 'Calcium-regulating hormone', NOW(), NOW()),
  (gen_random_uuid(), 'Growth Hormone', 'GH-01', 'Hormone', 'Blood', 450, 4, 'Somatotropin hormone', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- SERUM IRON STUDIES --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Serum Iron', 'IRON-01', 'Biochemistry', 'Blood', 200, 4, 'Iron level measurement', NOW(), NOW()),
  (gen_random_uuid(), 'TIBC (Total Iron Binding Capacity)', 'TIBC-01', 'Biochemistry', 'Blood', 200, 4, 'Iron binding protein capacity', NOW(), NOW()),
  (gen_random_uuid(), 'Ferritin', 'FERR-01', 'Biochemistry', 'Blood', 300, 4, 'Iron storage protein', NOW(), NOW()),
  (gen_random_uuid(), 'Iron Saturation', 'IROS-01', 'Biochemistry', 'Blood', 200, 4, 'Percentage saturation', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- VITAMINS & NUTRITION --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Vitamin D (25-Hydroxy)', 'VITD-01', 'Biochemistry', 'Blood', 600, 12, 'Vitamin D status assessment', NOW(), NOW()),
  (gen_random_uuid(), 'Vitamin B12', 'VITB12-01', 'Biochemistry', 'Blood', 500, 12, 'Cobalamin level', NOW(), NOW()),
  (gen_random_uuid(), 'Folic Acid', 'FOLIC-01', 'Biochemistry', 'Blood', 450, 12, 'Folate level assessment', NOW(), NOW()),
  (gen_random_uuid(), 'Vitamin B1 (Thiamine)', 'VITB1-01', 'Biochemistry', 'Blood', 400, 12, 'Thiamine level', NOW(), NOW()),
  (gen_random_uuid(), 'Vitamin B6 (Pyridoxine)', 'VITB6-01', 'Biochemistry', 'Blood', 400, 12, 'Pyridoxine level', NOW(), NOW()),
  (gen_random_uuid(), 'Vitamin C', 'VITC-01', 'Biochemistry', 'Blood', 450, 12, 'Ascorbic acid level', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- CARDIAC MARKERS --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Troponin I (Cardiac Marker)', 'TROP-01', 'Biochemistry', 'Blood', 500, 2, 'Cardiac muscle damage marker', NOW(), NOW()),
  (gen_random_uuid(), 'CK-MB (Creatine Kinase MB)', 'CKMB-01', 'Biochemistry', 'Blood', 350, 4, 'Cardiac enzyme', NOW(), NOW()),
  (gen_random_uuid(), 'MyoGlobin', 'MYO-01', 'Biochemistry', 'Blood', 300, 4, 'Myocardial injury marker', NOW(), NOW()),
  (gen_random_uuid(), 'NT-ProBNP', 'NTPNB-01', 'Biochemistry', 'Blood', 600, 4, 'Heart failure marker', NOW(), NOW()),
  (gen_random_uuid(), 'BNP (B-type Natriuretic Peptide)', 'BNP-01', 'Biochemistry', 'Blood', 500, 4, 'Cardiac stress marker', NOW(), NOW()),
  (gen_random_uuid(), 'Homocysteine', 'HCYS-01', 'Biochemistry', 'Blood', 400, 4, 'Cardiovascular risk marker', NOW(), NOW()),
  (gen_random_uuid(), 'Apolipoprotein A1 (Apo A1)', 'APOA1-01', 'Biochemistry', 'Blood', 350, 4, 'HDL component', NOW(), NOW()),
  (gen_random_uuid(), 'Apolipoprotein B (Apo B)', 'APOB-01', 'Biochemistry', 'Blood', 350, 4, 'LDL component', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- URIC ACID & GOUT --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Serum Uric Acid', 'URIC-01', 'Biochemistry', 'Blood', 150, 4, 'Uric acid for gout screening', NOW(), NOW()),
  (gen_random_uuid(), 'Urine Uric Acid (24-hour)', 'U-URIC-24-01', 'Biochemistry', 'Urine', 200, 4, 'Urine uric acid excretion', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- TUMOR MARKERS --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'PSA (Prostate Specific Antigen)', 'PSA-01', 'Biochemistry', 'Blood', 400, 4, 'Prostate cancer marker', NOW(), NOW()),
  (gen_random_uuid(), 'Free PSA', 'FREE-PSA-01', 'Biochemistry', 'Blood', 450, 4, 'Free PSA percentage', NOW(), NOW()),
  (gen_random_uuid(), 'CA-125', 'CA125-01', 'Biochemistry', 'Blood', 500, 4, 'Ovarian cancer marker', NOW(), NOW()),
  (gen_random_uuid(), 'CA 19-9', 'CA199-01', 'Biochemistry', 'Blood', 500, 4, 'Pancreatic cancer marker', NOW(), NOW()),
  (gen_random_uuid(), 'CEA (Carcinoembryonic Antigen)', 'CEA-01', 'Biochemistry', 'Blood', 450, 4, 'Colorectal cancer marker', NOW(), NOW()),
  (gen_random_uuid(), 'AFP (Alpha-Fetoprotein)', 'AFP-01', 'Biochemistry', 'Blood', 450, 4, 'Liver cancer marker', NOW(), NOW()),
  (gen_random_uuid(), 'Beta-HCG (Tumor Marker)', 'BHCG-TM-01', 'Biochemistry', 'Blood', 300, 4, 'Germ cell tumor marker', NOW(), NOW()),
  (gen_random_uuid(), 'HER2/neu', 'HER2-01', 'Biochemistry', 'Blood', 600, 4, 'Breast cancer marker', NOW(), NOW()),
  (gen_random_uuid(), 'S100 Protein', 'S100-01', 'Biochemistry', 'Blood', 400, 4, 'Melanoma marker', NOW(), NOW()),
  (gen_random_uuid(), 'Calcitonin', 'CALC-TM-01', 'Hormone', 'Blood', 500, 4, 'Thyroid medullary cancer marker', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- SEROLOGY - INFECTIOUS DISEASES --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Widal Test', 'WIDAL-01', 'Serology', 'Blood', 200, 4, 'Typhoid fever antibodies', NOW(), NOW()),
  (gen_random_uuid(), 'VDRL (Syphilis Screening)', 'VDRL-01', 'Serology', 'Blood', 200, 4, 'Syphilis screening test', NOW(), NOW()),
  (gen_random_uuid(), 'RPR (Rapid Plasma Reagin)', 'RPR-01', 'Serology', 'Blood', 200, 4, 'Syphilis detection test', NOW(), NOW()),
  (gen_random_uuid(), 'FTA-ABS (Syphilis Confirmation)', 'FTAABS-01', 'Serology', 'Blood', 300, 4, 'Syphilis confirmation test', NOW(), NOW()),
  (gen_random_uuid(), 'HIV I & II (ELISA)', 'HIV-01', 'Serology', 'Blood', 300, 6, 'HIV antibody screening', NOW(), NOW()),
  (gen_random_uuid(), 'HIV Rapid Test', 'HIV-RAPID-01', 'Serology', 'Blood', 150, 1, 'Rapid HIV screening', NOW(), NOW()),
  (gen_random_uuid(), 'HBsAg (Hepatitis B Surface Antigen)', 'HBSAG-01', 'Serology', 'Blood', 250, 4, 'Hepatitis B screening', NOW(), NOW()),
  (gen_random_uuid(), 'Anti-HBc (Hepatitis B Core Antibodies)', 'AHBC-01', 'Serology', 'Blood', 250, 4, 'Hepatitis B exposure', NOW(), NOW()),
  (gen_random_uuid(), 'Anti-HBs (Hepatitis B Surface Antibodies)', 'AHBS-01', 'Serology', 'Blood', 250, 4, 'Hepatitis B immunity', NOW(), NOW()),
  (gen_random_uuid(), 'HBeAg (Hepatitis B E Antigen)', 'HBEAG-01', 'Serology', 'Blood', 300, 4, 'Hepatitis B viral load', NOW(), NOW()),
  (gen_random_uuid(), 'Anti-HCV (Hepatitis C)', 'HCV-01', 'Serology', 'Blood', 300, 6, 'Hepatitis C screening', NOW(), NOW()),
  (gen_random_uuid(), 'HCV RNA (Hepatitis C Viral Load)', 'HCV-RNA-01', 'Serology', 'Blood', 600, 4, 'Hepatitis C PCR quantification', NOW(), NOW()),
  (gen_random_uuid(), 'Anti-HAV IgM (Hepatitis A)', 'AHAV-IGM-01', 'Serology', 'Blood', 250, 4, 'Acute Hepatitis A infection', NOW(), NOW()),
  (gen_random_uuid(), 'Anti-HAV IgG (Hepatitis A)', 'AHAV-IGG-01', 'Serology', 'Blood', 250, 4, 'Hepatitis A immunity', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- SEROLOGY - VIRAL DISEASES --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Dengue NS1 Antigen', 'DENGNS1-01', 'Serology', 'Blood', 500, 4, 'Early dengue detection', NOW(), NOW()),
  (gen_random_uuid(), 'Dengue IgM / IgG', 'DENGIGG-01', 'Serology', 'Blood', 500, 4, 'Dengue antibodies', NOW(), NOW()),
  (gen_random_uuid(), 'Chikungunya IgM', 'CHIK-IGM-01', 'Serology', 'Blood', 400, 4, 'Acute chikungunya infection', NOW(), NOW()),
  (gen_random_uuid(), 'Zika IgM', 'ZIKA-IGM-01', 'Serology', 'Blood', 400, 4, 'Zika virus antibodies', NOW(), NOW()),
  (gen_random_uuid(), 'CMV IgM', 'CMV-IGM-01', 'Serology', 'Blood', 350, 4, 'Acute CMV infection', NOW(), NOW()),
  (gen_random_uuid(), 'CMV IgG', 'CMV-IGG-01', 'Serology', 'Blood', 350, 4, 'CMV immunity status', NOW(), NOW()),
  (gen_random_uuid(), 'EBV VCA IgM', 'EBV-VCA-IGM-01', 'Serology', 'Blood', 350, 4, 'Acute EBV infection', NOW(), NOW()),
  (gen_random_uuid(), 'EBV VCA IgG', 'EBV-VCA-IGG-01', 'Serology', 'Blood', 350, 4, 'Past EBV infection', NOW(), NOW()),
  (gen_random_uuid(), 'Measles IgM', 'MEASLES-IGM-01', 'Serology', 'Blood', 350, 4, 'Acute measles', NOW(), NOW()),
  (gen_random_uuid(), 'Mumps IgM', 'MUMPS-IGM-01', 'Serology', 'Blood', 350, 4, 'Acute mumps', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- IMMUNOLOGY --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'RA Factor (Rheumatoid Factor)', 'RAF-01', 'Immunology', 'Blood', 300, 4, 'Rheumatoid arthritis marker', NOW(), NOW()),
  (gen_random_uuid(), 'Anti-CCP (Cyclic Citrullinated Peptide)', 'ANTICCP-01', 'Immunology', 'Blood', 450, 4, 'RA-specific antibody', NOW(), NOW()),
  (gen_random_uuid(), 'ASO Titre (Anti-Streptolysin O)', 'ASO-01', 'Immunology', 'Blood', 250, 4, 'Streptococcal infection', NOW(), NOW()),
  (gen_random_uuid(), 'ANA (Antinuclear Antibodies)', 'ANA-01', 'Immunology', 'Blood', 400, 4, 'Autoimmune disease screening', NOW(), NOW()),
  (gen_random_uuid(), 'Anti-dsDNA', 'ANTIDSDNA-01', 'Immunology', 'Blood', 450, 4, 'SLE-specific antibody', NOW(), NOW()),
  (gen_random_uuid(), 'Complement C3', 'C3-01', 'Immunology', 'Blood', 400, 4, 'Complement system component', NOW(), NOW()),
  (gen_random_uuid(), 'Complement C4', 'C4-01', 'Immunology', 'Blood', 400, 4, 'Complement system component', NOW(), NOW()),
  (gen_random_uuid(), 'Immunoglobulin A (IgA)', 'IGA-01', 'Immunology', 'Blood', 350, 4, 'Immune response antibody', NOW(), NOW()),
  (gen_random_uuid(), 'Immunoglobulin G (IgG)', 'IGG-01', 'Immunology', 'Blood', 350, 4, 'Primary immune antibody', NOW(), NOW()),
  (gen_random_uuid(), 'Immunoglobulin M (IgM)', 'IGM-01', 'Immunology', 'Blood', 350, 4, 'Acute immune response', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- MICROBIOLOGY - CULTURE TESTS --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Malaria Antigen (Rapid Card)', 'MALAR-01', 'Microbiology', 'Blood', 250, 1, 'Rapid malaria screening', NOW(), NOW()),
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
  (gen_random_uuid(), 'TB GENE XPERT (Rapid TB)', 'TB-XPERT-01', 'Microbiology', 'Sputum', 800, 2, 'Rapid TB detection', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- HISTOPATHOLOGY & CYTOLOGY --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'FNAC (Fine Needle Aspiration Cytology)', 'FNAC-01', 'Histopathology', 'Tissue', 1500, 5, 'Needle aspiration cytology', NOW(), NOW()),
  (gen_random_uuid(), 'PAP Smear (Cervical Cytology)', 'PAP-01', 'Cytology', 'Cervical', 500, 3, 'Cervical cancer screening', NOW(), NOW()),
  (gen_random_uuid(), 'Biopsy Examination', 'BIOPSY-01', 'Histopathology', 'Tissue', 2000, 7, 'Tissue diagnosis', NOW(), NOW()),
  (gen_random_uuid(), 'Bone Marrow Examination', 'BM-01', 'Histopathology', 'Bone Marrow', 2500, 5, 'Hematologic malignancy investigation', NOW(), NOW()),
  (gen_random_uuid(), 'CSF Analysis', 'CSF-01', 'Clinical Pathology', 'CSF', 800, 4, 'Cerebrospinal fluid analysis', NOW(), NOW()),
  (gen_random_uuid(), 'Pleural Fluid Analysis', 'PLEURAL-01', 'Clinical Pathology', 'Pleural Fluid', 700, 4, 'Pleural fluid examination', NOW(), NOW()),
  (gen_random_uuid(), 'Ascitic Fluid Analysis', 'ASCITIC-01', 'Clinical Pathology', 'Ascitic Fluid', 700, 4, 'Ascites analysis', NOW(), NOW()),
  (gen_random_uuid(), 'Joint Fluid Analysis', 'JOINT-01', 'Clinical Pathology', 'Joint Fluid', 700, 4, 'Synovial fluid examination', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- SEMEN ANALYSIS --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Semen Analysis', 'SEMEN-01', 'Andrology', 'Semen', 400, 4, 'Sperm count, motility, morphology', NOW(), NOW()),
  (gen_random_uuid(), 'Semen Culture', 'SEMEN-CULT-01', 'Microbiology', 'Semen', 600, 48, 'Bacterial contamination', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- PREGNANCY & OBSTETRIC TESTS --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Pregnancy Test (Urine)', 'UPT-01', 'Hormone', 'Urine', 100, 1, 'Urine pregnancy test', NOW(), NOW()),
  (gen_random_uuid(), 'Pregnancy Test (Serum)', 'SPT-01', 'Hormone', 'Blood', 150, 2, 'Serum beta-HCG qualitative', NOW(), NOW()),
  (gen_random_uuid(), 'PAPP-A (Pregnancy Associated Plasma Protein)', 'PAPPA-01', 'Hormone', 'Blood', 500, 4, 'Down syndrome screening', NOW(), NOW()),
  (gen_random_uuid(), 'AFP (Maternal Serum)', 'AFP-MAT-01', 'Biochemistry', 'Blood', 450, 4, 'Neural tube defect screening', NOW(), NOW()),
  (gen_random_uuid(), 'uE3 (Unconjugated Estriol)', 'UE3-01', 'Hormone', 'Blood', 450, 4, 'Down syndrome screening', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- MISCELLANEOUS TESTS --
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'ACE (Angiotensin Converting Enzyme)', 'ACE-01', 'Biochemistry', 'Blood', 400, 4, 'Sarcoidosis marker', NOW(), NOW()),
  (gen_random_uuid(), 'Lactate Dehydrogenase (LDH)', 'LDH-01', 'Biochemistry', 'Blood', 200, 4, 'Tissue damage marker', NOW(), NOW()),
  (gen_random_uuid(), 'Total Protein', 'TP-01', 'Biochemistry', 'Blood', 100, 2, 'Albumin and globulin', NOW(), NOW()),
  (gen_random_uuid(), 'Albumin', 'ALB-01', 'Biochemistry', 'Blood', 100, 2, 'Protein synthesis marker', NOW(), NOW()),
  (gen_random_uuid(), 'Globulin', 'GLOB-01', 'Biochemistry', 'Blood', 100, 2, 'Immune protein level', NOW(), NOW()),
  (gen_random_uuid(), 'Blood Alcohol Level', 'BAL-01', 'Toxicology', 'Blood', 300, 2, 'Ethanol concentration', NOW(), NOW()),
  (gen_random_uuid(), 'Ammonia', 'AMMON-01', 'Biochemistry', 'Blood', 400, 4, 'Hepatic encephalopathy marker', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- ============================================
-- SECTION 6: INSERT COMPREHENSIVE TEST FIELDS
-- ============================================

-- CBC Test Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, section_group, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, f.section, NOW(), NOW()
FROM tests t
CROSS JOIN (
  VALUES
    ('Hemoglobin', 'g/dL', 12.0, 15.5, 'number', 1, 'RBC Parameters'),
    ('RBC Count', 'million/uL', 4.0, 5.5, 'number', 2, 'RBC Parameters'),
    ('Hematocrit', '%', 36.0, 46.0, 'number', 3, 'RBC Parameters'),
    ('MCV', 'fL', 80.0, 100.0, 'number', 4, 'RBC Indices'),
    ('MCH', 'pg', 27.0, 33.0, 'number', 5, 'RBC Indices'),
    ('MCHC', 'g/dL', 32.0, 36.0, 'number', 6, 'RBC Indices'),
    ('RDW', '%', 11.5, 14.5, 'number', 7, 'RBC Indices'),
    ('WBC Count', 'thou/uL', 4.5, 11.0, 'number', 8, 'WBC Count'),
    ('Neutrophils', '%', 40.0, 75.0, 'number', 9, 'Differential'),
    ('Lymphocytes', '%', 20.0, 40.0, 'number', 10, 'Differential'),
    ('Monocytes', '%', 2.0, 8.0, 'number', 11, 'Differential'),
    ('Eosinophils', '%', 1.0, 4.0, 'number', 12, 'Differential'),
    ('Basophils', '%', 0.0, 1.0, 'number', 13, 'Differential'),
    ('Platelet Count', 'thou/uL', 150.0, 400.0, 'number', 14, 'Platelets')
) AS f(field_name, unit, min_value, max_value, input_type, order_index, section)
WHERE t.test_code = 'CBC-01' AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id AND tf.field_name = f.field_name);

-- LFT Test Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, section_group, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, f.section, NOW(), NOW()
FROM tests t
CROSS JOIN (
  VALUES
    ('Total Bilirubin', 'mg/dL', 0.1, 1.2, 'number', 1, 'Bilirubin'),
    ('Direct Bilirubin', 'mg/dL', 0.0, 0.3, 'number', 2, 'Bilirubin'),
    ('Indirect Bilirubin', 'mg/dL', 0.1, 0.9, 'number', 3, 'Bilirubin'),
    ('SGOT (AST)', 'U/L', 10.0, 40.0, 'number', 4, 'Transaminases'),
    ('SGPT (ALT)', 'U/L', 7.0, 56.0, 'number', 5, 'Transaminases'),
    ('ALP (Alkaline Phosphatase)', 'U/L', 44.0, 147.0, 'number', 6, 'Alkaline Phosphatase'),
    ('Total Protein', 'g/dL', 6.0, 8.3, 'number', 7, 'Proteins'),
    ('Albumin', 'g/dL', 3.5, 5.5, 'number', 8, 'Proteins'),
    ('Globulin', 'g/dL', 2.0, 3.5, 'number', 9, 'Proteins'),
    ('A/G Ratio', 'Ratio', 1.0, 2.5, 'number', 10, 'Proteins'),
    ('GGT', 'U/L', 9.0, 48.0, 'number', 11, 'Additional Enzymes')
) AS f(field_name, unit, min_value, max_value, input_type, order_index, section)
WHERE t.test_code = 'LFT-01' AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id AND tf.field_name = f.field_name);

-- KFT Test Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, section_group, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, f.section, NOW(), NOW()
FROM tests t
CROSS JOIN (
  VALUES
    ('Urea', 'mg/dL', 15.0, 45.0, 'number', 1, 'Nitrogen Metabolism'),
    ('Creatinine', 'mg/dL', 0.6, 1.2, 'number', 2, 'Nitrogen Metabolism'),
    ('Uric Acid', 'mg/dL', 3.5, 7.2, 'number', 3, 'Nitrogen Metabolism'),
    ('Sodium', 'mEq/L', 136.0, 145.0, 'number', 4, 'Electrolytes'),
    ('Potassium', 'mEq/L', 3.5, 5.0, 'number', 5, 'Electrolytes'),
    ('Chloride', 'mEq/L', 98.0, 107.0, 'number', 6, 'Electrolytes'),
    ('CO2 (Bicarbonate)', 'mEq/L', 23.0, 29.0, 'number', 7, 'Electrolytes'),
    ('Calcium', 'mg/dL', 8.5, 10.2, 'number', 8, 'Minerals'),
    ('Phosphorus', 'mg/dL', 2.5, 4.5, 'number', 9, 'Minerals'),
    ('Magnesium', 'mg/dL', 1.7, 2.2, 'number', 10, 'Minerals'),
    ('eGFR', 'mL/min/1.73m2', 60.0, 120.0, 'number', 11, 'Renal Function')
) AS f(field_name, unit, min_value, max_value, input_type, order_index, section)
WHERE t.test_code = 'KFT-01' AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id AND tf.field_name = f.field_name);

-- Lipid Profile Test Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, section_group, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, f.section, NOW(), NOW()
FROM tests t
CROSS JOIN (
  VALUES
    ('Total Cholesterol', 'mg/dL', 0.0, 200.0, 'number', 1, 'Lipids'),
    ('HDL', 'mg/dL', 40.0, 200.0, 'number', 2, 'Lipids'),
    ('LDL', 'mg/dL', 0.0, 130.0, 'number', 3, 'Lipids'),
    ('VLDL', 'mg/dL', 0.0, 40.0, 'number', 4, 'Lipids'),
    ('Triglycerides', 'mg/dL', 0.0, 150.0, 'number', 5, 'Lipids'),
    ('TC/HDL Ratio', 'Ratio', 0.0, 5.0, 'number', 6, 'Ratios')
) AS f(field_name, unit, min_value, max_value, input_type, order_index, section)
WHERE t.test_code = 'LIPID-01' AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id AND tf.field_name = f.field_name);

-- Thyroid Profile Test Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, section_group, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, f.section, NOW(), NOW()
FROM tests t
CROSS JOIN (
  VALUES
    ('TSH', 'mIU/L', 0.4, 4.0, 'number', 1, 'Thyroid Hormones'),
    ('T3', 'pg/mL', 80.0, 200.0, 'number', 2, 'Thyroid Hormones'),
    ('T4', 'ng/dL', 4.5, 12.0, 'number', 3, 'Thyroid Hormones'),
    ('Free T3', 'pg/mL', 2.3, 4.2, 'number', 4, 'Thyroid Hormones'),
    ('Free T4', 'ng/dL', 0.8, 1.8, 'number', 5, 'Thyroid Hormones')
) AS f(field_name, unit, min_value, max_value, input_type, order_index, section)
WHERE t.test_code = 'THYROID-01' AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id AND tf.field_name = f.field_name);

-- Urine Routine Test Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, section_group, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, f.section, NOW(), NOW()
FROM tests t
CROSS JOIN (
  VALUES
    ('Color', 'Text', 0, 0, 'text', 1, 'Physical'),
    ('Appearance', 'Text', 0, 0, 'text', 2, 'Physical'),
    ('Specific Gravity', 'Value', 1.005, 1.030, 'number', 3, 'Physical'),
    ('pH', 'Value', 4.5, 8.0, 'number', 4, 'Physical'),
    ('Protein', 'mg/dL', 0.0, 0.0, 'number', 5, 'Chemical'),
    ('Sugar', 'mg/dL', 0.0, 0.0, 'number', 6, 'Chemical'),
    ('Ketone', 'Text', 0, 0, 'text', 7, 'Chemical'),
    ('Bilirubin', 'Text', 0, 0, 'text', 8, 'Chemical'),
    ('Urobilinogen', 'mg/dL', 0.1, 1.0, 'number', 9, 'Chemical'),
    ('RBC', 'Cells/hpf', 0.0, 3.0, 'number', 10, 'Microscopy'),
    ('WBC', 'Cells/hpf', 0.0, 5.0, 'number', 11, 'Microscopy'),
    ('Epithelial Cells', 'Cells/lpf', 0.0, 3.0, 'number', 12, 'Microscopy'),
    ('Casts', 'per lpf', 0.0, 2.0, 'number', 13, 'Microscopy'),
    ('Crystals', 'Text', 0, 0, 'text', 14, 'Microscopy'),
    ('Bacteria', 'Text', 0, 0, 'text', 15, 'Microscopy')
) AS f(field_name, unit, min_value, max_value, input_type, order_index, section)
WHERE t.test_code = 'URINE-01' AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id AND tf.field_name = f.field_name);

-- Blood Glucose Test Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, section_group, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, f.section, NOW(), NOW()
FROM tests t
CROSS JOIN (
  VALUES
    ('Glucose', 'mg/dL', 70.0, 100.0, 'number', 1, 'Glucose')
) AS f(field_name, unit, min_value, max_value, input_type, order_index, section)
WHERE t.test_code IN ('FBS-01', 'PPBS-01', 'RBS-01')
AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id AND tf.field_name = f.field_name);

-- HbA1c Test Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, section_group, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, f.section, NOW(), NOW()
FROM tests t
CROSS JOIN (
  VALUES
    ('HbA1c', '%', 0.0, 5.6, 'number', 1, 'Glycemic Control'),
    ('eAG (Estimated Average Glucose)', 'mg/dL', 0.0, 100.0, 'number', 2, 'Glycemic Control')
) AS f(field_name, unit, min_value, max_value, input_type, order_index, section)
WHERE t.test_code = 'HBA1C-01' AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id AND tf.field_name = f.field_name);

-- PT/INR Test Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, section_group, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, f.section, NOW(), NOW()
FROM tests t
CROSS JOIN (
  VALUES
    ('PT', 'seconds', 11.0, 13.5, 'number', 1, 'Coagulation'),
    ('INR', 'Ratio', 0.8, 1.1, 'number', 2, 'Coagulation')
) AS f(field_name, unit, min_value, max_value, input_type, order_index, section)
WHERE t.test_code = 'PTINR-01' AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id AND tf.field_name = f.field_name);

-- Lipase & Amylase Test Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, section_group, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, f.section, NOW(), NOW()
FROM tests t
CROSS JOIN (
  VALUES
    ('Amylase', 'U/L', 30.0, 110.0, 'number', 1, 'Pancreatic Enzymes')
) AS f(field_name, unit, min_value, max_value, input_type, order_index, section)
WHERE t.test_code = 'AMYL-01' AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id AND tf.field_name = f.field_name);

INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, section_group, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, f.section, NOW(), NOW()
FROM tests t
CROSS JOIN (
  VALUES
    ('Lipase', 'U/L', 0.0, 60.0, 'number', 1, 'Pancreatic Enzymes')
) AS f(field_name, unit, min_value, max_value, input_type, order_index, section)
WHERE t.test_code = 'LIPAS-01' AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id AND tf.field_name = f.field_name);

-- PSA Test Fields
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, section_group, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, f.section, NOW(), NOW()
FROM tests t
CROSS JOIN (
  VALUES
    ('PSA Total', 'ng/mL', 0.0, 4.0, 'number', 1, 'PSA')
) AS f(field_name, unit, min_value, max_value, input_type, order_index, section)
WHERE t.test_code = 'PSA-01' AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id AND tf.field_name = f.field_name);

-- Cardiac Markers
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, section_group, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, f.section, NOW(), NOW()
FROM tests t
CROSS JOIN (
  VALUES
    ('Troponin I', 'ng/mL', 0.0, 0.04, 'number', 1, 'Cardiac')
) AS f(field_name, unit, min_value, max_value, input_type, order_index, section)
WHERE t.test_code = 'TROP-01' AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id AND tf.field_name = f.field_name);

-- TSH Single Test
INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, section_group, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, f.section, NOW(), NOW()
FROM tests t
CROSS JOIN (
  VALUES
    ('TSH', 'mIU/L', 0.4, 4.0, 'number', 1, 'Thyroid')
) AS f(field_name, unit, min_value, max_value, input_type, order_index, section)
WHERE t.test_code = 'TSH-01' AND NOT EXISTS (SELECT 1 FROM test_fields tf WHERE tf.test_id = t.id AND tf.field_name = f.field_name);

-- ============================================
-- SECTION 7: INSERT TEST REFERENCE RANGES
-- ============================================

-- CBC Hemoglobin Reference Ranges
INSERT INTO test_reference_ranges (test_field_id, gender, age_min, age_max, min_value, max_value, critical_low, critical_high, remarks)
SELECT tf.id, 'Male', 18, 120, 13.5, 17.5, 7.0, 20.0, 'Adult males'
FROM test_fields tf
JOIN tests t ON tf.test_id = t.id
WHERE t.test_code = 'CBC-01' AND tf.field_name = 'Hemoglobin' AND NOT EXISTS (
  SELECT 1 FROM test_reference_ranges trr WHERE trr.test_field_id = tf.id AND trr.gender = 'Male'
);

INSERT INTO test_reference_ranges (test_field_id, gender, age_min, age_max, min_value, max_value, critical_low, critical_high, remarks)
SELECT tf.id, 'Female', 18, 120, 12.0, 15.5, 7.0, 20.0, 'Adult females'
FROM test_fields tf
JOIN tests t ON tf.test_id = t.id
WHERE t.test_code = 'CBC-01' AND tf.field_name = 'Hemoglobin' AND NOT EXISTS (
  SELECT 1 FROM test_reference_ranges trr WHERE trr.test_field_id = tf.id AND trr.gender = 'Female'
);

-- CBC WBC Reference Ranges
INSERT INTO test_reference_ranges (test_field_id, gender, age_min, age_max, min_value, max_value, critical_low, critical_high, remarks)
SELECT tf.id, 'Any', 18, 120, 4.5, 11.0, 2.0, 30.0, 'Adult WBC count'
FROM test_fields tf
JOIN tests t ON tf.test_id = t.id
WHERE t.test_code = 'CBC-01' AND tf.field_name = 'WBC Count' AND NOT EXISTS (
  SELECT 1 FROM test_reference_ranges trr WHERE trr.test_field_id = tf.id
);

-- CBC Platelets Reference Ranges
INSERT INTO test_reference_ranges (test_field_id, gender, age_min, age_max, min_value, max_value, critical_low, critical_high, remarks)
SELECT tf.id, 'Any', 18, 120, 150.0, 400.0, 50.0, 1000.0, 'Platelet count'
FROM test_fields tf
JOIN tests t ON tf.test_id = t.id
WHERE t.test_code = 'CBC-01' AND tf.field_name = 'Platelet Count' AND NOT EXISTS (
  SELECT 1 FROM test_reference_ranges trr WHERE trr.test_field_id = tf.id
);

-- Creatinine Reference Ranges
INSERT INTO test_reference_ranges (test_field_id, gender, age_min, age_max, min_value, max_value, critical_low, critical_high, remarks)
SELECT tf.id, 'Male', 18, 120, 0.7, 1.3, 0.4, 10.0, 'Adult male creatinine'
FROM test_fields tf
JOIN tests t ON tf.test_id = t.id
WHERE t.test_code = 'KFT-01' AND tf.field_name = 'Creatinine' AND NOT EXISTS (
  SELECT 1 FROM test_reference_ranges trr WHERE trr.test_field_id = tf.id AND trr.gender = 'Male'
);

INSERT INTO test_reference_ranges (test_field_id, gender, age_min, age_max, min_value, max_value, critical_low, critical_high, remarks)
SELECT tf.id, 'Female', 18, 120, 0.6, 1.2, 0.4, 10.0, 'Adult female creatinine'
FROM test_fields tf
JOIN tests t ON tf.test_id = t.id
WHERE t.test_code = 'KFT-01' AND tf.field_name = 'Creatinine' AND NOT EXISTS (
  SELECT 1 FROM test_reference_ranges trr WHERE trr.test_field_id = tf.id AND trr.gender = 'Female'
);

-- HbA1c Reference Ranges
INSERT INTO test_reference_ranges (test_field_id, gender, age_min, age_max, min_value, max_value, critical_low, critical_high, remarks)
SELECT tf.id, 'Any', 18, 120, 0.0, 5.6, 0.0, 14.0, 'Normal glucose control'
FROM test_fields tf
JOIN tests t ON tf.test_id = t.id
WHERE t.test_code = 'HBA1C-01' AND tf.field_name = 'HbA1c' AND NOT EXISTS (
  SELECT 1 FROM test_reference_ranges trr WHERE trr.test_field_id = tf.id
);

-- TSH Reference Ranges
INSERT INTO test_reference_ranges (test_field_id, gender, age_min, age_max, min_value, max_value, critical_low, critical_high, remarks)
SELECT tf.id, 'Any', 18, 120, 0.4, 4.0, 0.01, 100.0, 'Normal TSH'
FROM test_fields tf
JOIN tests t ON tf.test_id = t.id
WHERE t.test_code = 'TSH-01' AND NOT EXISTS (
  SELECT 1 FROM test_reference_ranges trr WHERE trr.test_field_id = tf.id
);

-- PSA Reference Ranges
INSERT INTO test_reference_ranges (test_field_id, gender, age_min, age_max, min_value, max_value, critical_low, critical_high, remarks)
SELECT tf.id, 'Male', 50, 120, 0.0, 4.0, 0.0, 10.0, 'PSA screening age 50+'
FROM test_fields tf
JOIN tests t ON tf.test_id = t.id
WHERE t.test_code = 'PSA-01' AND NOT EXISTS (
  SELECT 1 FROM test_reference_ranges trr WHERE trr.test_field_id = tf.id
);

-- Vitamin D Reference Ranges
INSERT INTO test_reference_ranges (test_field_id, gender, age_min, age_max, min_value, max_value, critical_low, critical_high, remarks)
SELECT tf.id, 'Any', 18, 120, 30.0, 100.0, 10.0, 150.0, 'Sufficient vitamin D'
FROM test_fields tf
JOIN tests t ON tf.test_id = t.id
WHERE t.test_code = 'VITD-01' AND NOT EXISTS (
  SELECT 1 FROM test_reference_ranges trr WHERE trr.test_field_id = tf.id
);

-- Vitamin B12 Reference Ranges
INSERT INTO test_reference_ranges (test_field_id, gender, age_min, age_max, min_value, max_value, critical_low, critical_high, remarks)
SELECT tf.id, 'Any', 18, 120, 200.0, 900.0, 100.0, 2000.0, 'Normal B12 levels'
FROM test_fields tf
JOIN tests t ON tf.test_id = t.id
WHERE t.test_code = 'VITB12-01' AND NOT EXISTS (
  SELECT 1 FROM test_reference_ranges trr WHERE trr.test_field_id = tf.id
);

-- ============================================
-- SECTION 8: INSERT TEST PACKAGES
-- ============================================

INSERT INTO test_packages (id, package_name, package_code, category, description, price, is_active)
VALUES
  (gen_random_uuid(), 'Fever Profile', 'PKG-FEVER-01', 'Infections', 'Complete fever workup with CBC, malaria, blood culture', 1200, true),
  (gen_random_uuid(), 'Diabetic Profile', 'PKG-DIA-01', 'Metabolic', 'FBS, PPBS, HbA1c, Lipid Profile', 1500, true),
  (gen_random_uuid(), 'Thyroid Profile Advanced', 'PKG-THY-ADV-01', 'Endocrine', 'TSH, Free T3, Free T4, Anti-TPO', 1800, true),
  (gen_random_uuid(), 'Executive Health Checkup', 'PKG-EXEC-01', 'Wellness', 'Comprehensive health screening package', 5000, true),
  (gen_random_uuid(), 'Women''s Health Package', 'PKG-WOMEN-01', 'Reproductive', 'Reproductive hormones, PAP smear, anemia screening', 3000, true),
  (gen_random_uuid(), 'Men''s Health Package', 'PKG-MEN-01', 'Reproductive', 'PSA, testosterone, semen analysis', 2500, true),
  (gen_random_uuid(), 'Cardiac Risk Profile', 'PKG-CARD-01', 'Cardiac', 'Troponin, CK-MB, NT-ProBNP, lipid profile, homocysteine', 3500, true),
  (gen_random_uuid(), 'Arthritis Profile', 'PKG-ARTH-01', 'Autoimmune', 'RA Factor, Anti-CCP, ESR, CRP', 1800, true),
  (gen_random_uuid(), 'Anemia Profile', 'PKG-ANEM-01', 'Hematology', 'CBC, Iron studies, B12, Folic Acid', 2000, true),
  (gen_random_uuid(), 'Antenatal Profile', 'PKG-ANTE-01', 'Obstetric', 'Blood group, VDRL, HIV, HBsAg, CBC, blood glucose', 2500, true),
  (gen_random_uuid(), 'Infertility Profile', 'PKG-INFER-01', 'Reproductive', 'FSH, LH, Prolactin, Testosterone, Semen Analysis', 4000, true),
  (gen_random_uuid(), 'Liver Profile Advanced', 'PKG-LIVER-ADV-01', 'Hepatic', 'LFT, Viral Hepatitis, Albumin, PT/INR', 2500, true),
  (gen_random_uuid(), 'Kidney Profile Advanced', 'PKG-KIDNEY-ADV-01', 'Renal', 'KFT, Urine Routine, Urine Culture, Protein', 2200, true)
ON CONFLICT (package_code) DO NOTHING;

-- ============================================
-- SECTION 9: FORMULA DEFINITIONS FOR CALCULATED FIELDS
-- ============================================

-- Update LFT Globulin and A/G Ratio with formulas
UPDATE test_fields SET
  field_type = 'calculated',
  formula = 'Total Protein - Albumin',
  depends_on = '["Total Protein", "Albumin"]'::jsonb
WHERE test_id IN (SELECT id FROM tests WHERE test_code = 'LFT-01') AND field_name = 'Globulin';

UPDATE test_fields SET
  field_type = 'calculated',
  formula = 'Albumin / Globulin',
  depends_on = '["Albumin", "Globulin"]'::jsonb
WHERE test_id IN (SELECT id FROM tests WHERE test_code = 'LFT-01') AND field_name = 'A/G Ratio';

-- Update Lipid Profile LDL, VLDL, TC/HDL with formulas
UPDATE test_fields SET
  field_type = 'calculated',
  formula = 'Total Cholesterol - HDL - (Triglycerides / 5)',
  depends_on = '["Total Cholesterol", "HDL", "Triglycerides"]'::jsonb
WHERE test_id IN (SELECT id FROM tests WHERE test_code = 'LIPID-01') AND field_name = 'LDL';

UPDATE test_fields SET
  field_type = 'calculated',
  formula = 'Triglycerides / 5',
  depends_on = '["Triglycerides"]'::jsonb
WHERE test_id IN (SELECT id FROM tests WHERE test_code = 'LIPID-01') AND field_name = 'VLDL';

UPDATE test_fields SET
  field_type = 'calculated',
  formula = 'Total Cholesterol / HDL',
  depends_on = '["Total Cholesterol", "HDL"]'::jsonb
WHERE test_id IN (SELECT id FROM tests WHERE test_code = 'LIPID-01') AND field_name = 'TC/HDL Ratio';

-- Update KFT eGFR with formula
UPDATE test_fields SET
  field_type = 'calculated',
  formula = 'Estimated from Creatinine using MDRD equation',
  depends_on = '["Creatinine"]'::jsonb
WHERE test_id IN (SELECT id FROM tests WHERE test_code = 'KFT-01') AND field_name = 'eGFR';

-- Update HbA1c eAG with formula
UPDATE test_fields SET
  field_type = 'calculated',
  formula = '(HbA1c * 35.6) - 77.3',
  depends_on = '["HbA1c"]'::jsonb
WHERE test_id IN (SELECT id FROM tests WHERE test_code = 'HBA1C-01') AND field_name = 'eAG (Estimated Average Glucose)';

-- ============================================
-- SECTION 10: CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_test_fields_test_id_field_name ON test_fields(test_id, field_name);
CREATE INDEX IF NOT EXISTS idx_test_reference_ranges_critical ON test_reference_ranges(test_field_id, critical_low, critical_high);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

COMMIT;
SELECT '✅ Production-Grade Pathology Test Catalog Expanded Successfully' AS migration_status;
