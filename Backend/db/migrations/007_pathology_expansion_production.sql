-- ============================================
-- PRODUCTION PATHOLOGY LABORATORY EXPANSION
-- Migration: Comprehensive 100+ Test Catalog
-- ============================================
-- Safe, idempotent migration to add reference ranges,
-- test packages, and 60+ additional pathology tests
-- ============================================

-- ============================================
-- 1. CREATE TEST REFERENCE RANGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS test_reference_ranges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_field_id UUID NOT NULL REFERENCES test_fields(id) ON DELETE CASCADE,
    gender VARCHAR(20) DEFAULT 'Any',
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

CREATE INDEX IF NOT EXISTS idx_ref_ranges_field ON test_reference_ranges(test_field_id);
CREATE INDEX IF NOT EXISTS idx_ref_ranges_gender_age ON test_reference_ranges(gender, age_min, age_max);

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

CREATE INDEX IF NOT EXISTS idx_packages_code ON test_packages(package_code);

-- ============================================
-- 3. CREATE PACKAGE-TEST MAPPING
-- ============================================

CREATE TABLE IF NOT EXISTS package_test_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES test_packages(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(package_id, test_id)
);

CREATE INDEX IF NOT EXISTS idx_pkg_test_pkg ON package_test_mapping(package_id);
CREATE INDEX IF NOT EXISTS idx_pkg_test_tst ON package_test_mapping(test_id);

-- ============================================
-- 4. ADD FORMULA COLUMNS TO TEST_FIELDS
-- ============================================

ALTER TABLE test_fields ADD COLUMN IF NOT EXISTS formula TEXT;
ALTER TABLE test_fields ADD COLUMN IF NOT EXISTS depends_on JSONB DEFAULT '[]';
ALTER TABLE test_fields ADD COLUMN IF NOT EXISTS field_type VARCHAR(50) DEFAULT 'input';

-- ============================================
-- 5. ADD 60+ PATHOLOGY TESTS
-- ============================================

-- HEMATOLOGY ADDITIONAL TESTS
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'aPTT (Activated Partial Thromboplastin Time)', 'APTT-01', 'Hematology', 'Blood', 250, 4, 'Intrinsic coagulation pathway', NOW(), NOW()),
(gen_random_uuid(), 'Bleeding Time', 'BT-01', 'Hematology', 'Blood', 150, 2, 'Platelet function test', NOW(), NOW()),
(gen_random_uuid(), 'Clotting Time', 'CT-01', 'Hematology', 'Blood', 150, 2, 'Extrinsic pathway', NOW(), NOW()),
(gen_random_uuid(), 'Fibrinogen', 'FIBR-01', 'Hematology', 'Blood', 300, 4, 'Clotting factor', NOW(), NOW()),
(gen_random_uuid(), 'D-Dimer', 'DD-01', 'Hematology', 'Blood', 400, 4, 'Thrombosis marker', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- DIABETES PANEL
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'Oral Glucose Tolerance Test (OGTT)', 'OGTT-01', 'Biochemistry', 'Blood', 400, 4, 'Glucose tolerance', NOW(), NOW()),
(gen_random_uuid(), 'GTT (2-hour)', 'GTT-01', 'Biochemistry', 'Blood', 350, 4, '2-hour glucose tolerance', NOW(), NOW()),
(gen_random_uuid(), 'Fasting Insulin', 'INS-F-01', 'Biochemistry', 'Blood', 300, 4, 'Beta cell function', NOW(), NOW()),
(gen_random_uuid(), 'C-Peptide', 'CPEP-01', 'Biochemistry', 'Blood', 350, 4, 'Beta cell reserve', NOW(), NOW()),
(gen_random_uuid(), 'Microalbumin (Urine)', 'MALB-01', 'Biochemistry', 'Urine', 200, 4, 'Early kidney disease', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- EXTENDED THYROID PANEL
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'Free T3', 'FT3-01', 'Hormone', 'Blood', 300, 4, 'Free triiodothyronine', NOW(), NOW()),
(gen_random_uuid(), 'Free T4', 'FT4-01', 'Hormone', 'Blood', 300, 4, 'Free thyroxine', NOW(), NOW()),
(gen_random_uuid(), 'Total T3', 'T3-01', 'Hormone', 'Blood', 250, 4, 'Total T3', NOW(), NOW()),
(gen_random_uuid(), 'Total T4', 'T4-01', 'Hormone', 'Blood', 250, 4, 'Total T4', NOW(), NOW()),
(gen_random_uuid(), 'Anti-TPO (Thyroid Peroxidase)', 'ATPO-01', 'Immunology', 'Blood', 400, 4, 'Autoimmune thyroid', NOW(), NOW()),
(gen_random_uuid(), 'Anti-Thyroglobulin', 'ATG-01', 'Immunology', 'Blood', 400, 4, 'Thyroid antibodies', NOW(), NOW()),
(gen_random_uuid(), 'Thyroglobulin', 'TG-01', 'Hormone', 'Blood', 350, 4, 'Thyroid hormone precursor', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- REPRODUCTIVE HORMONES
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'FSH (Follicle Stimulating Hormone)', 'FSH-01', 'Hormone', 'Blood', 350, 4, 'Pituitary hormone', NOW(), NOW()),
(gen_random_uuid(), 'LH (Luteinizing Hormone)', 'LH-01', 'Hormone', 'Blood', 350, 4, 'Pituitary hormone', NOW(), NOW()),
(gen_random_uuid(), 'Prolactin', 'PROL-01', 'Hormone', 'Blood', 350, 4, 'Lactation hormone', NOW(), NOW()),
(gen_random_uuid(), 'Testosterone', 'TEST-01', 'Hormone', 'Blood', 400, 4, 'Male sex hormone', NOW(), NOW()),
(gen_random_uuid(), 'Free Testosterone', 'FTEST-01', 'Hormone', 'Blood', 450, 4, 'Bioavailable testosterone', NOW(), NOW()),
(gen_random_uuid(), 'Estradiol', 'ESTR-01', 'Hormone', 'Blood', 400, 4, 'Female sex hormone', NOW(), NOW()),
(gen_random_uuid(), 'Progesterone', 'PROG-01', 'Hormone', 'Blood', 400, 4, 'Luteal hormone', NOW(), NOW()),
(gen_random_uuid(), 'AMH (Anti-Müllerian Hormone)', 'AMH-01', 'Hormone', 'Blood', 500, 4, 'Ovarian reserve', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- ADRENAL & PITUITARY HORMONES
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'Cortisol (8 AM)', 'CORT-AM-01', 'Hormone', 'Blood', 400, 4, 'Morning cortisol', NOW(), NOW()),
(gen_random_uuid(), 'Cortisol (4 PM)', 'CORT-PM-01', 'Hormone', 'Blood', 400, 4, 'Afternoon cortisol', NOW(), NOW()),
(gen_random_uuid(), 'ACTH (Adrenocorticotropic)', 'ACTH-01', 'Hormone', 'Blood', 450, 4, 'Pituitary hormone', NOW(), NOW()),
(gen_random_uuid(), 'PTH (Parathyroid Hormone)', 'PTH-01', 'Hormone', 'Blood', 400, 4, 'Calcium hormone', NOW(), NOW()),
(gen_random_uuid(), 'Growth Hormone', 'GH-01', 'Hormone', 'Blood', 450, 4, 'Growth factor', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- MINERALS & VITAMINS
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'Serum Phosphorus', 'PHOS-01', 'Biochemistry', 'Blood', 150, 4, 'Phosphate level', NOW(), NOW()),
(gen_random_uuid(), 'Serum Magnesium', 'MAG-01', 'Biochemistry', 'Blood', 150, 4, 'Magnesium level', NOW(), NOW()),
(gen_random_uuid(), 'Serum Iron', 'IRON-01', 'Biochemistry', 'Blood', 200, 4, 'Iron level', NOW(), NOW()),
(gen_random_uuid(), 'TIBC (Iron Binding Capacity)', 'TIBC-01', 'Biochemistry', 'Blood', 200, 4, 'Iron capacity', NOW(), NOW()),
(gen_random_uuid(), 'Ferritin', 'FERR-01', 'Biochemistry', 'Blood', 300, 4, 'Iron storage', NOW(), NOW()),
(gen_random_uuid(), 'Iron Saturation', 'IROS-01', 'Biochemistry', 'Blood', 200, 4, 'Iron percentage', NOW(), NOW()),
(gen_random_uuid(), 'Vitamin D (25-Hydroxy)', 'VITD-01', 'Biochemistry', 'Blood', 600, 12, 'Vitamin D status', NOW(), NOW()),
(gen_random_uuid(), 'Vitamin B12', 'VITB12-01', 'Biochemistry', 'Blood', 500, 12, 'Cobalamin level', NOW(), NOW()),
(gen_random_uuid(), 'Folic Acid', 'FOLIC-01', 'Biochemistry', 'Blood', 450, 12, 'Folate level', NOW(), NOW()),
(gen_random_uuid(), 'Vitamin B1 (Thiamine)', 'VITB1-01', 'Biochemistry', 'Blood', 400, 12, 'Thiamine level', NOW(), NOW()),
(gen_random_uuid(), 'Vitamin B6 (Pyridoxine)', 'VITB6-01', 'Biochemistry', 'Blood', 400, 12, 'Pyridoxine level', NOW(), NOW()),
(gen_random_uuid(), 'Vitamin C', 'VITC-01', 'Biochemistry', 'Blood', 450, 12, 'Ascorbic acid', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- CARDIAC MARKERS
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'CK-MB (Creatine Kinase MB)', 'CKMB-01', 'Biochemistry', 'Blood', 350, 4, 'Cardiac enzyme', NOW(), NOW()),
(gen_random_uuid(), 'MyoGlobin', 'MYO-01', 'Biochemistry', 'Blood', 300, 4, 'Cardiac injury marker', NOW(), NOW()),
(gen_random_uuid(), 'NT-ProBNP', 'NTPNB-01', 'Biochemistry', 'Blood', 600, 4, 'Heart failure marker', NOW(), NOW()),
(gen_random_uuid(), 'BNP (B-type Natriuretic)', 'BNP-01', 'Biochemistry', 'Blood', 500, 4, 'Cardiac stress', NOW(), NOW()),
(gen_random_uuid(), 'Homocysteine', 'HCYS-01', 'Biochemistry', 'Blood', 400, 4, 'Cardiovascular risk', NOW(), NOW()),
(gen_random_uuid(), 'Apolipoprotein A1', 'APOA1-01', 'Biochemistry', 'Blood', 350, 4, 'HDL component', NOW(), NOW()),
(gen_random_uuid(), 'Apolipoprotein B', 'APOB-01', 'Biochemistry', 'Blood', 350, 4, 'LDL component', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- TUMOR MARKERS
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'PSA (Prostate Specific Antigen)', 'PSA-01', 'Biochemistry', 'Blood', 400, 4, 'Prostate cancer marker', NOW(), NOW()),
(gen_random_uuid(), 'Free PSA', 'FREE-PSA-01', 'Biochemistry', 'Blood', 450, 4, 'Free PSA percentage', NOW(), NOW()),
(gen_random_uuid(), 'CA-125', 'CA125-01', 'Biochemistry', 'Blood', 500, 4, 'Ovarian cancer marker', NOW(), NOW()),
(gen_random_uuid(), 'CA 19-9', 'CA199-01', 'Biochemistry', 'Blood', 500, 4, 'Pancreatic cancer marker', NOW(), NOW()),
(gen_random_uuid(), 'CEA (Carcinoembryonic Antigen)', 'CEA-01', 'Biochemistry', 'Blood', 450, 4, 'Colorectal marker', NOW(), NOW()),
(gen_random_uuid(), 'AFP (Alpha-Fetoprotein)', 'AFP-01', 'Biochemistry', 'Blood', 450, 4, 'Liver cancer marker', NOW(), NOW()),
(gen_random_uuid(), 'HER2/neu', 'HER2-01', 'Biochemistry', 'Blood', 600, 4, 'Breast cancer marker', NOW(), NOW()),
(gen_random_uuid(), 'S100 Protein', 'S100-01', 'Biochemistry', 'Blood', 400, 4, 'Melanoma marker', NOW(), NOW()),
(gen_random_uuid(), 'Calcitonin', 'CALC-TM-01', 'Hormone', 'Blood', 500, 4, 'Thyroid cancer marker', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- EXTENDED SEROLOGY
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'RPR (Rapid Plasma Reagin)', 'RPR-01', 'Serology', 'Blood', 200, 4, 'Syphilis detection', NOW(), NOW()),
(gen_random_uuid(), 'FTA-ABS (Syphilis)', 'FTAABS-01', 'Serology', 'Blood', 300, 4, 'Syphilis confirmation', NOW(), NOW()),
(gen_random_uuid(), 'HIV Rapid Test', 'HIV-RAPID-01', 'Serology', 'Blood', 150, 1, 'Rapid HIV screening', NOW(), NOW()),
(gen_random_uuid(), 'Anti-HBc', 'AHBC-01', 'Serology', 'Blood', 250, 4, 'Hepatitis B core', NOW(), NOW()),
(gen_random_uuid(), 'Anti-HBs', 'AHBS-01', 'Serology', 'Blood', 250, 4, 'Hepatitis B immunity', NOW(), NOW()),
(gen_random_uuid(), 'HBeAg', 'HBEAG-01', 'Serology', 'Blood', 300, 4, 'Hepatitis B viral load', NOW(), NOW()),
(gen_random_uuid(), 'HCV RNA', 'HCV-RNA-01', 'Serology', 'Blood', 600, 4, 'Hepatitis C viral load', NOW(), NOW()),
(gen_random_uuid(), 'Anti-HAV IgM', 'AHAV-IGM-01', 'Serology', 'Blood', 250, 4, 'Acute Hepatitis A', NOW(), NOW()),
(gen_random_uuid(), 'Anti-HAV IgG', 'AHAV-IGG-01', 'Serology', 'Blood', 250, 4, 'Hepatitis A immunity', NOW(), NOW()),
(gen_random_uuid(), 'Chikungunya IgM', 'CHIK-IGM-01', 'Serology', 'Blood', 400, 4, 'Chikungunya', NOW(), NOW()),
(gen_random_uuid(), 'Zika IgM', 'ZIKA-IGM-01', 'Serology', 'Blood', 400, 4, 'Zika virus', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- IMMUNOLOGY EXTENDED
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'Anti-CCP', 'ANTICCP-01', 'Immunology', 'Blood', 450, 4, 'RA-specific antibody', NOW(), NOW()),
(gen_random_uuid(), 'ANA (Antinuclear)', 'ANA-01', 'Immunology', 'Blood', 400, 4, 'Autoimmune screening', NOW(), NOW()),
(gen_random_uuid(), 'Anti-dsDNA', 'ANTIDSDNA-01', 'Immunology', 'Blood', 450, 4, 'SLE antibody', NOW(), NOW()),
(gen_random_uuid(), 'Complement C3', 'C3-01', 'Immunology', 'Blood', 400, 4, 'Complement component', NOW(), NOW()),
(gen_random_uuid(), 'Complement C4', 'C4-01', 'Immunology', 'Blood', 400, 4, 'Complement component', NOW(), NOW()),
(gen_random_uuid(), 'Immunoglobulin A (IgA)', 'IGA-01', 'Immunology', 'Blood', 350, 4, 'Immune antibody', NOW(), NOW()),
(gen_random_uuid(), 'Immunoglobulin G (IgG)', 'IGG-01', 'Immunology', 'Blood', 350, 4, 'Immune antibody', NOW(), NOW()),
(gen_random_uuid(), 'Immunoglobulin M (IgM)', 'IGM-01', 'Immunology', 'Blood', 350, 4, 'Acute response', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- CULTURE TESTS & MICROBIOLOGY
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'Stool Culture & Sensitivity', 'SCULT-01', 'Microbiology', 'Stool', 600, 48, 'Bacterial pathogens', NOW(), NOW()),
(gen_random_uuid(), 'Sputum Culture & Sensitivity', 'SPCULT-01', 'Microbiology', 'Sputum', 600, 48, 'Respiratory pathogens', NOW(), NOW()),
(gen_random_uuid(), 'Pus Culture & Sensitivity', 'PCULT-01', 'Microbiology', 'Pus', 600, 48, 'Wound pathogens', NOW(), NOW()),
(gen_random_uuid(), 'Throat Swab Culture', 'TCULT-01', 'Microbiology', 'Throat Swab', 500, 48, 'Streptococcus detection', NOW(), NOW()),
(gen_random_uuid(), 'Fungal Culture', 'FCULT-01', 'Microbiology', 'Various', 700, 72, 'Fungal identification', NOW(), NOW()),
(gen_random_uuid(), 'KOH Preparation', 'KOH-01', 'Microbiology', 'Various', 200, 2, 'Fungal elements', NOW(), NOW()),
(gen_random_uuid(), 'TB Culture (Sputum)', 'TBCULT-01', 'Microbiology', 'Sputum', 1000, 72, 'Tuberculosis', NOW(), NOW()),
(gen_random_uuid(), 'TB GENE XPERT (Rapid)', 'TB-XPERT-01', 'Microbiology', 'Sputum', 800, 2, 'Rapid TB detection', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- HISTOPATHOLOGY & CYTOLOGY
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'FNAC (Fine Needle Aspiration)', 'FNAC-01', 'Histopathology', 'Tissue', 1500, 5, 'Needle aspiration', NOW(), NOW()),
(gen_random_uuid(), 'PAP Smear', 'PAP-01', 'Cytology', 'Cervical', 500, 3, 'Cervical screening', NOW(), NOW()),
(gen_random_uuid(), 'Biopsy Examination', 'BIOPSY-01', 'Histopathology', 'Tissue', 2000, 7, 'Tissue diagnosis', NOW(), NOW()),
(gen_random_uuid(), 'Bone Marrow Examination', 'BM-01', 'Histopathology', 'Bone Marrow', 2500, 5, 'Marrow investigation', NOW(), NOW()),
(gen_random_uuid(), 'CSF Analysis', 'CSF-01', 'Clinical Pathology', 'CSF', 800, 4, 'Cerebrospinal fluid', NOW(), NOW()),
(gen_random_uuid(), 'Pleural Fluid Analysis', 'PLEURAL-01', 'Clinical Pathology', 'Pleural Fluid', 700, 4, 'Pleural examination', NOW(), NOW()),
(gen_random_uuid(), 'Ascitic Fluid Analysis', 'ASCITIC-01', 'Clinical Pathology', 'Ascitic Fluid', 700, 4, 'Ascites analysis', NOW(), NOW()),
(gen_random_uuid(), 'Joint Fluid Analysis', 'JOINT-01', 'Clinical Pathology', 'Joint Fluid', 700, 4, 'Synovial examination', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- ANDROLOGY & OBSTETRICS
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'Semen Culture', 'SEMEN-CULT-01', 'Microbiology', 'Semen', 600, 48, 'Bacterial contamination', NOW(), NOW()),
(gen_random_uuid(), 'Pregnancy Test (Serum)', 'SPT-01', 'Hormone', 'Blood', 150, 2, 'Beta-HCG qualitative', NOW(), NOW()),
(gen_random_uuid(), 'PAPP-A', 'PAPPA-01', 'Hormone', 'Blood', 500, 4, 'Down syndrome screening', NOW(), NOW()),
(gen_random_uuid(), 'AFP (Maternal)', 'AFP-MAT-01', 'Biochemistry', 'Blood', 450, 4, 'Neural tube screening', NOW(), NOW()),
(gen_random_uuid(), 'uE3 (Unconjugated Estriol)', 'UE3-01', 'Hormone', 'Blood', 450, 4, 'Down syndrome screening', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- MISCELLANEOUS
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'ACE (Angiotensin Enzyme)', 'ACE-01', 'Biochemistry', 'Blood', 400, 4, 'Sarcoidosis marker', NOW(), NOW()),
(gen_random_uuid(), 'Lactate Dehydrogenase', 'LDH-01', 'Biochemistry', 'Blood', 200, 4, 'Tissue damage', NOW(), NOW()),
(gen_random_uuid(), 'Total Protein', 'TP-01', 'Biochemistry', 'Blood', 100, 2, 'Protein level', NOW(), NOW()),
(gen_random_uuid(), 'Albumin', 'ALB-01', 'Biochemistry', 'Blood', 100, 2, 'Synthesis marker', NOW(), NOW()),
(gen_random_uuid(), 'Globulin', 'GLOB-01', 'Biochemistry', 'Blood', 100, 2, 'Immune protein', NOW(), NOW()),
(gen_random_uuid(), 'Blood Alcohol Level', 'BAL-01', 'Toxicology', 'Blood', 300, 2, 'Ethanol level', NOW(), NOW()),
(gen_random_uuid(), 'Ammonia', 'AMMON-01', 'Biochemistry', 'Blood', 400, 4, 'Encephalopathy', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- CMV & EBV
INSERT INTO tests (id, test_name, test_code, category, sample_type, price, turnaround_time, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'CMV IgM', 'CMV-IGM-01', 'Serology', 'Blood', 350, 4, 'Acute CMV', NOW(), NOW()),
(gen_random_uuid(), 'CMV IgG', 'CMV-IGG-01', 'Serology', 'Blood', 350, 4, 'CMV immunity', NOW(), NOW()),
(gen_random_uuid(), 'EBV VCA IgM', 'EBV-VCA-IGM-01', 'Serology', 'Blood', 350, 4, 'Acute EBV', NOW(), NOW()),
(gen_random_uuid(), 'EBV VCA IgG', 'EBV-VCA-IGG-01', 'Serology', 'Blood', 350, 4, 'Past EBV', NOW(), NOW()),
(gen_random_uuid(), 'Measles IgM', 'MEASLES-IGM-01', 'Serology', 'Blood', 350, 4, 'Acute measles', NOW(), NOW()),
(gen_random_uuid(), 'Mumps IgM', 'MUMPS-IGM-01', 'Serology', 'Blood', 350, 4, 'Acute mumps', NOW(), NOW())
ON CONFLICT (test_code) DO NOTHING;

-- ============================================
-- 6. INSERT TEST PACKAGES
-- ============================================

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

-- ============================================
-- 7. ADD FORMULAS FOR CALCULATED FIELDS
-- ============================================

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

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

SELECT COUNT(*) as total_tests FROM tests;
SELECT COUNT(*) as total_packages FROM test_packages;
SELECT '✅ Production Pathology Expansion Complete' AS status;
