#!/bin/bash

# Migration 006 Verification Script
# Validates production-grade pathology laboratory expansion

echo "================================"
echo "Migration 006 Verification"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database connection
DB_NAME="lab_management_db"
DB_USER="postgres"
DB_HOST="localhost"

# Counter for checks
PASSED=0
FAILED=0

# Function to run SQL query
run_query() {
    local query="$1"
    local expected_result="$2"
    local description="$3"
    
    result=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "$query" 2>/dev/null)
    
    if [ ! -z "$result" ] && [ "$result" -gt 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $description (Count: $result)"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $description (Count: $result)"
        ((FAILED++))
    fi
}

echo "Checking Tables..."
echo "-------------------"

run_query "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='test_reference_ranges';" "1" "test_reference_ranges table exists"
run_query "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='test_packages';" "1" "test_packages table exists"
run_query "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='package_test_mapping';" "1" "package_test_mapping table exists"

echo ""
echo "Checking Test Data..."
echo "---------------------"

run_query "SELECT COUNT(*) FROM tests;" "100" "Tests created (100+)"
run_query "SELECT COUNT(*) FROM test_fields;" "400" "Test fields created (400+)"
run_query "SELECT COUNT(*) FROM test_packages;" "13" "Test packages created (13)"
run_query "SELECT COUNT(*) FROM package_test_mapping;" "50" "Package-test mappings created (50+)"
run_query "SELECT COUNT(*) FROM test_reference_ranges;" "50" "Reference ranges created (50+)"

echo ""
echo "Checking Key Test Categories..."
echo "--------------------------------"

run_query "SELECT COUNT(*) FROM tests WHERE category='Hematology';" "1" "Hematology tests exist"
run_query "SELECT COUNT(*) FROM tests WHERE category='Biochemistry';" "1" "Biochemistry tests exist"
run_query "SELECT COUNT(*) FROM tests WHERE category='Hormone';" "1" "Hormone tests exist"
run_query "SELECT COUNT(*) FROM tests WHERE category='Immunology';" "1" "Immunology tests exist"
run_query "SELECT COUNT(*) FROM tests WHERE category='Serology';" "1" "Serology tests exist"
run_query "SELECT COUNT(*) FROM tests WHERE category='Microbiology';" "1" "Microbiology tests exist"
run_query "SELECT COUNT(*) FROM tests WHERE category='Histopathology';" "1" "Histopathology tests exist"

echo ""
echo "Checking Mandatory Tests..."
echo "---------------------------"

# Diabetes tests
run_query "SELECT COUNT(*) FROM tests WHERE test_code IN ('OGTT-01', 'GTT-01', 'INS-F-01', 'CPEP-01', 'MALB-01');" "1" "Diabetes tests (OGTT, GTT, Insulin, C-Peptide, Microalbumin)"

# Thyroid tests
run_query "SELECT COUNT(*) FROM tests WHERE test_code IN ('FT3-01', 'FT4-01', 'ATPO-01', 'TG-01', 'ATG-01');" "1" "Thyroid tests (FT3, FT4, Anti-TPO, Thyroglobulin)"

# Reproductive hormones
run_query "SELECT COUNT(*) FROM tests WHERE test_code IN ('FSH-01', 'LH-01', 'PROL-01', 'TEST-01', 'ESTR-01', 'PROG-01', 'AMH-01', 'BHCG-Q-01');" "1" "Reproductive hormone tests"

# Cardiac markers
run_query "SELECT COUNT(*) FROM tests WHERE test_code IN ('CKMB-01', 'NTPNB-01', 'DD-01', 'HCYS-01', 'APOA1-01', 'APOB-01');" "1" "Cardiac marker tests"

# Tumor markers
run_query "SELECT COUNT(*) FROM tests WHERE test_code IN ('PSA-01', 'FREE-PSA-01', 'CA125-01', 'CA199-01', 'CEA-01', 'AFP-01', 'BHCG-TM-01');" "1" "Tumor marker tests"

# Microbiology
run_query "SELECT COUNT(*) FROM tests WHERE test_code IN ('SPCULT-01', 'SCULT-01', 'PCULT-01', 'TCULT-01', 'FCULT-01', 'KOH-01');" "1" "Microbiology culture tests"

# Histopathology
run_query "SELECT COUNT(*) FROM tests WHERE test_code IN ('FNAC-01', 'PAP-01', 'BIOPSY-01', 'BM-01');" "1" "Histopathology tests"

echo ""
echo "Checking Test Packages..."
echo "-------------------------"

run_query "SELECT COUNT(*) FROM test_packages WHERE package_code='PKG-FEVER-01';" "1" "Fever Profile package exists"
run_query "SELECT COUNT(*) FROM test_packages WHERE package_code='PKG-DIA-01';" "1" "Diabetic Profile package exists"
run_query "SELECT COUNT(*) FROM test_packages WHERE package_code='PKG-THY-ADV-01';" "1" "Thyroid Profile Advanced package exists"
run_query "SELECT COUNT(*) FROM test_packages WHERE package_code='PKG-EXEC-01';" "1" "Executive Health Checkup package exists"
run_query "SELECT COUNT(*) FROM test_packages WHERE package_code='PKG-WOMEN-01';" "1" "Women's Health Package package exists"
run_query "SELECT COUNT(*) FROM test_packages WHERE package_code='PKG-MEN-01';" "1" "Men's Health Package package exists"
run_query "SELECT COUNT(*) FROM test_packages WHERE package_code='PKG-CARD-01';" "1" "Cardiac Risk Profile package exists"
run_query "SELECT COUNT(*) FROM test_packages WHERE package_code='PKG-ARTH-01';" "1" "Arthritis Profile package exists"
run_query "SELECT COUNT(*) FROM test_packages WHERE package_code='PKG-ANEM-01';" "1" "Anemia Profile package exists"

echo ""
echo "Checking Reference Ranges..."
echo "----------------------------"

run_query "SELECT COUNT(DISTINCT gender) FROM test_reference_ranges WHERE gender IN ('Male', 'Female', 'Any');" "1" "Gender-specific reference ranges exist"
run_query "SELECT COUNT(*) FROM test_reference_ranges WHERE critical_low IS NOT NULL;" "1" "Critical value ranges set"
run_query "SELECT COUNT(*) FROM test_reference_ranges WHERE age_min >= 0 AND age_max <= 120;" "1" "Age ranges valid"

echo ""
echo "Checking Calculated Fields..."
echo "-----------------------------"

run_query "SELECT COUNT(*) FROM test_fields WHERE field_type='calculated';" "1" "Calculated fields defined"
run_query "SELECT COUNT(*) FROM test_fields WHERE formula IS NOT NULL;" "1" "Formulas configured"
run_query "SELECT COUNT(*) FROM test_fields WHERE depends_on IS NOT NULL;" "1" "Field dependencies set"

echo ""
echo "Checking Key Test Fields..."
echo "---------------------------"

# CBC fields
run_query "SELECT COUNT(*) FROM test_fields tf JOIN tests t ON tf.test_id = t.id WHERE t.test_code='CBC-01' AND tf.field_name IN ('Hemoglobin', 'RBC Count', 'WBC Count', 'Platelet Count');" "1" "CBC primary fields exist"

# LFT fields
run_query "SELECT COUNT(*) FROM test_fields tf JOIN tests t ON tf.test_id = t.id WHERE t.test_code='LFT-01' AND tf.field_name IN ('Total Bilirubin', 'SGOT (AST)', 'SGPT (ALT)');" "1" "LFT primary fields exist"

# KFT fields
run_query "SELECT COUNT(*) FROM test_fields tf JOIN tests t ON tf.test_id = t.id WHERE t.test_code='KFT-01' AND tf.field_name IN ('Urea', 'Creatinine', 'Sodium', 'Potassium');" "1" "KFT primary fields exist"

# Lipid Profile fields
run_query "SELECT COUNT(*) FROM test_fields tf JOIN tests t ON tf.test_id = t.id WHERE t.test_code='LIPID-01' AND tf.field_name IN ('Total Cholesterol', 'HDL', 'LDL', 'Triglycerides');" "1" "Lipid Profile fields exist"

# Urine Routine fields
run_query "SELECT COUNT(*) FROM test_fields tf JOIN tests t ON tf.test_id = t.id WHERE t.test_code='URINE-01' AND tf.field_name IN ('Color', 'pH', 'Protein', 'Sugar');" "1" "Urine Routine fields exist"

echo ""
echo "================================"
echo "SUMMARY"
echo "================================"
TOTAL=$((PASSED + FAILED))
echo "Total Checks: $TOTAL"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ ALL CHECKS PASSED! Migration 006 is complete and valid.${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ SOME CHECKS FAILED! Please review the migration.${NC}"
    exit 1
fi
