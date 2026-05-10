#!/bin/bash

# Frontend Structure Verification Script
# This script validates the new page organization structure

cd "$(dirname "$0")" || exit 1

echo "═══════════════════════════════════════════════════════════"
echo "FRONTEND STRUCTURE VERIFICATION"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check page folders
echo "✓ Checking page folders..."
EXPECTED_FOLDERS=(
  "auth"
  "dashboard"
  "patients"
  "samples"
  "reports"
  "doctors"
  "doctor-portal"
  "tests"
  "users"
  "branches"
  "inventory"
  "billing"
  "time-tracking"
  "settings"
  "error-pages"
  "onboarding"
  "layout"
)

MISSING=0
for folder in "${EXPECTED_FOLDERS[@]}"; do
  if [ -d "src/pages/$folder" ]; then
    echo "  ✅ src/pages/$folder"
  else
    echo "  ❌ src/pages/$folder (MISSING)"
    MISSING=$((MISSING + 1))
  fi
done

echo ""
echo "✓ Checking index.ts files..."

MISSING_INDEX=0
for folder in "${EXPECTED_FOLDERS[@]}"; do
  if [ -f "src/pages/$folder/index.ts" ]; then
    echo "  ✅ src/pages/$folder/index.ts"
  else
    echo "  ❌ src/pages/$folder/index.ts (MISSING)"
    MISSING_INDEX=$((MISSING_INDEX + 1))
  fi
done

echo ""
echo "✓ Checking page component files..."

# Check specific components
PAGES=(
  "auth:Login.tsx"
  "auth:Register.tsx"
  "dashboard:Dashboard.tsx"
  "dashboard:Analytics.tsx"
  "reports:Reports.tsx"
  "doctors:DoctorManagement.tsx"
  "patients:Patients.tsx"
  "tests:TestManagement.tsx"
  "users:Users.tsx"
)

MISSING_PAGES=0
for page in "${PAGES[@]}"; do
  FOLDER="${page%:*}"
  FILE="${page#*:}"
  if [ -f "src/pages/$FOLDER/$FILE" ]; then
    echo "  ✅ src/pages/$FOLDER/$FILE"
  else
    echo "  ❌ src/pages/$FOLDER/$FILE (MISSING)"
    MISSING_PAGES=$((MISSING_PAGES + 1))
  fi
done

echo ""
echo "✓ Checking documentation files..."

DOCS=(
  "DEVELOPER_GUIDE.md"
  "STRUCTURE_REFACTOR.md"
  "FOLDER_STRUCTURE.txt"
)

MISSING_DOCS=0
for doc in "${DOCS[@]}"; do
  if [ -f "frontend/$doc" ] || [ -f "$doc" ]; then
    echo "  ✅ $doc"
  else
    echo "  ❌ $doc (MISSING)"
    MISSING_DOCS=$((MISSING_DOCS + 1))
  fi
done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "VERIFICATION RESULTS"
echo "═══════════════════════════════════════════════════════════"

if [ $MISSING -eq 0 ] && [ $MISSING_INDEX -eq 0 ] && [ $MISSING_PAGES -eq 0 ] && [ $MISSING_DOCS -eq 0 ]; then
  echo "✅ ALL CHECKS PASSED!"
  echo ""
  echo "Your frontend structure is correctly organized:"
  echo "  • 17 feature folders created"
  echo "  • 17 index.ts barrel exports"
  echo "  • All pages in correct locations"
  echo "  • Documentation completed"
  echo ""
  echo "Next steps:"
  echo "  1. Run: npm run dev"
  echo "  2. Check browser console for errors"
  echo "  3. Test key routes"
  echo "  4. Verify all features work"
  exit 0
else
  echo "❌ SOME CHECKS FAILED"
  echo ""
  echo "Missing folders: $MISSING"
  echo "Missing index.ts: $MISSING_INDEX"
  echo "Missing pages: $MISSING_PAGES"
  echo "Missing docs: $MISSING_DOCS"
  echo ""
  echo "Please review the structure and try again."
  exit 1
fi
