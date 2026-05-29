/**
 * Central Model Registry — Sequelize Associations & Sync
 *
 * All Sequelize model definitions live in ./definitions/*.js
 * This file wires up relationships and exports a single `db` object.
 */

const sequelize = require("../config/database");

// ──── Import Model Definitions ──────────────────────────────────────────────
const User             = require("./definitions/User");
const Branch           = require("./definitions/Branch");
const UserBranch       = require("./definitions/UserBranch");
const Patient          = require("./definitions/Patient");
const Doctor           = require("./definitions/Doctor");
const DoctorBranch     = require("./definitions/DoctorBranch");
const Sample           = require("./definitions/Sample");
const Test             = require("./definitions/Test");
const TestField        = require("./definitions/TestField");
const SampleTest       = require("./definitions/SampleTest");
const Report           = require("./definitions/Report");
const Payment          = require("./definitions/Payment");
const Inventory        = require("./definitions/Inventory");
const SampleCollectionTracking = require("./definitions/SampleCollectionTracking");
const TimeLog          = require("./definitions/TimeLog");
const Settings         = require("./definitions/Settings");
const UserTest         = require("./definitions/UserTest");
const UserTestField    = require("./definitions/UserTestField");
const B2BLab           = require("./definitions/B2BLab");

// ──── Associations ──────────────────────────────────────────────────────────

// User ↔ Branch (Many-to-Many via UserBranch)
User.belongsToMany(Branch, { through: UserBranch, foreignKey: "user_id", otherKey: "branch_id", as: "branches" });
Branch.belongsToMany(User, { through: UserBranch, foreignKey: "branch_id", otherKey: "user_id", as: "users" });
User.hasMany(UserBranch, { foreignKey: "user_id" });
UserBranch.belongsTo(User, { foreignKey: "user_id" });
UserBranch.belongsTo(Branch, { foreignKey: "branch_id" });

// User — created_by self-ref
User.belongsTo(User, { foreignKey: "created_by", as: "creator" });

// Patient → Branch, User
Patient.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });
Patient.belongsTo(User, { foreignKey: "created_by", as: "creator" });
Branch.hasMany(Patient, { foreignKey: "branch_id" });

// Doctor ↔ Branch (Many-to-Many via DoctorBranch)
Doctor.belongsToMany(Branch, { through: DoctorBranch, foreignKey: "doctor_id", otherKey: "branch_id", as: "branches" });
Branch.belongsToMany(Doctor, { through: DoctorBranch, foreignKey: "branch_id", otherKey: "doctor_id", as: "doctors" });
Doctor.hasMany(DoctorBranch, { foreignKey: "doctor_id" });
DoctorBranch.belongsTo(Doctor, { foreignKey: "doctor_id" });
DoctorBranch.belongsTo(Branch, { foreignKey: "branch_id" });
Doctor.belongsTo(Branch, { foreignKey: "branch_id", as: "primaryBranch" });
Doctor.belongsTo(User, { foreignKey: "user_id", as: "linkedUser" });

// Sample → Patient, User (collector), Branch
Sample.belongsTo(Patient, { foreignKey: "patient_id", as: "patient" });
Sample.belongsTo(User, { foreignKey: "collected_by", as: "collector" });
Sample.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });
Patient.hasMany(Sample, { foreignKey: "patient_id" });

// TestField → Test
TestField.belongsTo(Test, { foreignKey: "test_id", as: "test" });
Test.hasMany(TestField, { foreignKey: "test_id", as: "fields" });

// SampleTest → Sample, Test, User (performer)
SampleTest.belongsTo(Sample, { foreignKey: "sample_id" });
SampleTest.belongsTo(Test, { foreignKey: "test_id" });
SampleTest.belongsTo(User, { foreignKey: "performed_by", as: "performer" });
Sample.hasMany(SampleTest, { foreignKey: "sample_id", as: "tests" });

// Report → Patient, Doctor, User (technician, reviewer, approver), Sample, B2BLab
Report.belongsTo(Patient, { foreignKey: "patient_id", as: "patient" });
Report.belongsTo(Doctor, { foreignKey: "doctor_id", as: "doctor" });
Report.belongsTo(User, { foreignKey: "technician_id", as: "technician" });
Report.belongsTo(User, { foreignKey: "approved_by", as: "approvedByUser" });
Report.belongsTo(User, { foreignKey: "submitted_by", as: "submittedByUser" });
Report.belongsTo(User, { foreignKey: "rejected_by", as: "rejectedByUser" });
Report.belongsTo(Sample, { foreignKey: "sample_id", as: "sample" });
Report.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });
Report.belongsTo(B2BLab, { foreignKey: "b2b_lab_id", as: "b2bLab" });
Patient.hasMany(Report, { foreignKey: "patient_id" });
Doctor.hasMany(Report, { foreignKey: "doctor_id" });

// Payment → Report, Patient, Doctor
Payment.belongsTo(Report, { foreignKey: "report_id", as: "report" });
Payment.belongsTo(Patient, { foreignKey: "patient_id" });
Payment.belongsTo(Doctor, { foreignKey: "doctor_id" });
Report.hasMany(Payment, { foreignKey: "report_id", as: "payments" });

// Settings → Branch
Settings.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });
Branch.hasOne(Settings, { foreignKey: "branch_id", as: "settings" });

// Inventory → Branch
Inventory.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });
Branch.hasMany(Inventory, { foreignKey: "branch_id" });

// SampleCollectionTracking → User (staff), Branch
SampleCollectionTracking.belongsTo(User, { foreignKey: "staff_id", as: "staff" });
SampleCollectionTracking.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });

// TimeLog → User
TimeLog.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(TimeLog, { foreignKey: "user_id" });

// UserTest (branch override) → Branch, Test
UserTest.belongsTo(Branch, { foreignKey: "branch_id" });
UserTest.belongsTo(Test, { foreignKey: "test_id" });
Branch.hasMany(UserTest, { foreignKey: "branch_id" });
Test.hasMany(UserTest, { foreignKey: "test_id" });

// UserTestField (branch override) → Branch, TestField, Test
UserTestField.belongsTo(Branch, { foreignKey: "branch_id" });
UserTestField.belongsTo(TestField, { foreignKey: "test_field_id" });
UserTestField.belongsTo(Test, { foreignKey: "test_id" });

// B2BLab → Branch (owner), User
B2BLab.belongsTo(Branch, { foreignKey: "owner_branch_id", as: "ownerBranch" });
B2BLab.belongsTo(User, { foreignKey: "user_id", as: "linkedUser" });
B2BLab.belongsTo(User, { foreignKey: "created_by", as: "creator" });

// ──── Seed Helper ───────────────────────────────────────────────────────────

/**
 * Auto-seed test data if SEQUELIZE_SEED_DATA is enabled and tests table is empty.
 * Runs after Sequelize sync creates all tables.
 */
async function autoSeedData() {
  try {
    if (process.env.SEQUELIZE_SEED_DATA !== "true") {
      return; // Seed disabled
    }

    const testCount = await Test.count();
    const expectedCount = 40; // We have 40 tests configured
    
    if (testCount >= expectedCount) {
      console.log(`ℹ️  Tests already populated (${testCount} found) — skipping seed`);
      return;
    } else if (testCount > 0) {
      console.log(`⚠️  Only ${testCount}/${expectedCount} tests found — re-seeding to ensure all tests are present...`);
    }

    console.log("🌱  Seeding default test data...");

    // ──── Seed All 40 Default Tests ────────────────────────────────────────
    const defaultTests = [
      { test_code: "CBC-01", test_name: "Complete Blood Count (CBC)", category: "Hematology", sample_type: "Blood", price: 250, turnaround_time: 4, description: "Measures red cells, white cells, hemoglobin, hematocrit, and platelets" },
      { test_code: "ESR-01", test_name: "ESR (Erythrocyte Sedimentation Rate)", category: "Hematology", sample_type: "Blood", price: 100, turnaround_time: 2, description: "Measures the rate at which red blood cells settle" },
      { test_code: "BG-01", test_name: "Blood Group & Rh Typing", category: "Hematology", sample_type: "Blood", price: 150, turnaround_time: 1, description: "Determines ABO blood group and Rh factor" },
      { test_code: "PBS-01", test_name: "Peripheral Blood Smear", category: "Hematology", sample_type: "Blood", price: 200, turnaround_time: 6, description: "Microscopic examination of blood cells morphology" },
      { test_code: "LIPID-01", test_name: "Lipid Profile", category: "Biochemistry", sample_type: "Blood", price: 350, turnaround_time: 6, description: "Measures cholesterol, triglycerides, HDL, LDL, VLDL" },
      { test_code: "LFT-01", test_name: "Liver Function Test (LFT)", category: "Biochemistry", sample_type: "Blood", price: 400, turnaround_time: 6, description: "Evaluates liver health - bilirubin, AST, ALT, ALP, proteins" },
      { test_code: "KFT-01", test_name: "Kidney Function Test (KFT)", category: "Biochemistry", sample_type: "Blood", price: 450, turnaround_time: 6, description: "Evaluates kidney health - urea, creatinine, uric acid, electrolytes" },
      { test_code: "FBS-01", test_name: "Blood Sugar Fasting (FBS)", category: "Biochemistry", sample_type: "Blood", price: 80, turnaround_time: 2, description: "Measures fasting blood glucose level" },
      { test_code: "PPBS-01", test_name: "Blood Sugar PP (Post Prandial)", category: "Biochemistry", sample_type: "Blood", price: 80, turnaround_time: 2, description: "Measures blood glucose 2 hours after meal" },
      { test_code: "RBS-01", test_name: "Random Blood Sugar (RBS)", category: "Biochemistry", sample_type: "Blood", price: 80, turnaround_time: 1, description: "Measures blood glucose at any time of day" },
      { test_code: "HBA1C-01", test_name: "HbA1c (Glycated Hemoglobin)", category: "Biochemistry", sample_type: "Blood", price: 350, turnaround_time: 4, description: "Average blood sugar control over past 2-3 months" },
      { test_code: "THYROID-01", test_name: "Thyroid Profile (T3, T4, TSH)", category: "Hormone", sample_type: "Blood", price: 500, turnaround_time: 6, description: "Measures thyroid hormones T3, T4 and TSH" },
      { test_code: "TSH-01", test_name: "TSH (Thyroid Stimulating Hormone)", category: "Hormone", sample_type: "Blood", price: 200, turnaround_time: 4, description: "Screens for thyroid disorders" },
      { test_code: "URINE-01", test_name: "Urine Routine & Microscopy", category: "Urinalysis", sample_type: "Urine", price: 150, turnaround_time: 3, description: "Physical, chemical and microscopic examination of urine" },
      { test_code: "STOOL-01", test_name: "Stool Routine & Microscopy", category: "Microbiology", sample_type: "Stool", price: 150, turnaround_time: 3, description: "Microscopic examination of stool for ova, cysts, parasites" },
      { test_code: "WIDAL-01", test_name: "Widal Test", category: "Serology", sample_type: "Blood", price: 200, turnaround_time: 4, description: "Serological test for typhoid fever" },
      { test_code: "VDRL-01", test_name: "VDRL (Syphilis Screening)", category: "Serology", sample_type: "Blood", price: 200, turnaround_time: 4, description: "Screening test for syphilis" },
      { test_code: "HIV-01", test_name: "HIV I & II (ELISA)", category: "Serology", sample_type: "Blood", price: 300, turnaround_time: 6, description: "Screening test for HIV antibodies" },
      { test_code: "HBSAG-01", test_name: "HBsAg (Hepatitis B Surface Antigen)", category: "Serology", sample_type: "Blood", price: 250, turnaround_time: 4, description: "Screening test for Hepatitis B infection" },
      { test_code: "HCV-01", test_name: "Anti-HCV (Hepatitis C)", category: "Serology", sample_type: "Blood", price: 300, turnaround_time: 6, description: "Screening test for Hepatitis C infection" },
      { test_code: "CRP-01", test_name: "CRP (C-Reactive Protein)", category: "Biochemistry", sample_type: "Blood", price: 250, turnaround_time: 4, description: "Marker of inflammation in the body" },
      { test_code: "RAF-01", test_name: "RA Factor (Rheumatoid Factor)", category: "Immunology", sample_type: "Blood", price: 300, turnaround_time: 4, description: "Test for rheumatoid arthritis and autoimmune conditions" },
      { test_code: "ASO-01", test_name: "ASO Titre (Anti-Streptolysin O)", category: "Immunology", sample_type: "Blood", price: 250, turnaround_time: 4, description: "Detects streptococcal infection antibodies" },
      { test_code: "ELEC-01", test_name: "Serum Electrolytes (Na/K/Cl)", category: "Biochemistry", sample_type: "Blood", price: 300, turnaround_time: 4, description: "Measures sodium, potassium, chloride levels" },
      { test_code: "CALC-01", test_name: "Serum Calcium", category: "Biochemistry", sample_type: "Blood", price: 150, turnaround_time: 4, description: "Measures calcium level in blood" },
      { test_code: "IRON-01", test_name: "Serum Iron & TIBC", category: "Biochemistry", sample_type: "Blood", price: 350, turnaround_time: 6, description: "Evaluates iron status and iron binding capacity" },
      { test_code: "VITD-01", test_name: "Vitamin D (25-Hydroxy)", category: "Biochemistry", sample_type: "Blood", price: 600, turnaround_time: 12, description: "Measures vitamin D levels" },
      { test_code: "VITB12-01", test_name: "Vitamin B12", category: "Biochemistry", sample_type: "Blood", price: 500, turnaround_time: 12, description: "Measures vitamin B12 levels in blood" },
      { test_code: "URIC-01", test_name: "Serum Uric Acid", category: "Biochemistry", sample_type: "Blood", price: 150, turnaround_time: 4, description: "Measures uric acid levels for gout screening" },
      { test_code: "PTINR-01", test_name: "PT/INR (Prothrombin Time)", category: "Hematology", sample_type: "Blood", price: 250, turnaround_time: 4, description: "Measures blood clotting time" },
      { test_code: "DENGNS1-01", test_name: "Dengue NS1 Antigen", category: "Serology", sample_type: "Blood", price: 500, turnaround_time: 4, description: "Early detection of dengue infection" },
      { test_code: "DENGIGG-01", test_name: "Dengue IgM / IgG", category: "Serology", sample_type: "Blood", price: 500, turnaround_time: 4, description: "Detects dengue antibodies for current or past infection" },
      { test_code: "MALAR-01", test_name: "Malaria Antigen (Rapid Card)", category: "Microbiology", sample_type: "Blood", price: 250, turnaround_time: 1, description: "Rapid test for Plasmodium falciparum and vivax" },
      { test_code: "UCULT-01", test_name: "Urine Culture & Sensitivity", category: "Microbiology", sample_type: "Urine", price: 500, turnaround_time: 48, description: "Culture to identify urinary tract pathogens and antibiotic sensitivity" },
      { test_code: "BCULT-01", test_name: "Blood Culture & Sensitivity", category: "Microbiology", sample_type: "Blood", price: 700, turnaround_time: 72, description: "Culture to detect bloodstream infections" },
      { test_code: "SEMEN-01", test_name: "Semen Analysis", category: "Andrology", sample_type: "Semen", price: 400, turnaround_time: 4, description: "Evaluates sperm count, motility, morphology" },
      { test_code: "UPT-01", test_name: "Pregnancy Test (Urine)", category: "Hormone", sample_type: "Urine", price: 100, turnaround_time: 1, description: "Detects hCG hormone in urine" },
      { test_code: "AMYL-01", test_name: "Serum Amylase", category: "Biochemistry", sample_type: "Blood", price: 250, turnaround_time: 4, description: "Evaluates pancreatic function" },
      { test_code: "LIPAS-01", test_name: "Serum Lipase", category: "Biochemistry", sample_type: "Blood", price: 300, turnaround_time: 4, description: "Diagnoses pancreatitis" },
      { test_code: "TROP-01", test_name: "Troponin I (Cardiac Marker)", category: "Biochemistry", sample_type: "Blood", price: 500, turnaround_time: 2, description: "Cardiac marker for myocardial infarction" },
    ];

    await Test.bulkCreate(defaultTests, { ignoreDuplicates: true });
    console.log(`✅  Default tests seeded (${defaultTests.length} inserted)`);
    console.log(`ℹ️  Test fields are seeded via SQL migration - already in database\n`);

  } catch (err) {
    console.error("❌  Seed failed:", err.message);
    // Don't throw—let app continue even if seed fails
  }
}

// ──── SQL Migration Executor ───────────────────────────────────────────────

/**
 * Execute SQL migration file to populate schema + seed data.
 * Runs after Sequelize sync creates base tables.
 * Automatically adds timestamps to test_fields INSERT statements.
 */
async function executeSQLMigration() {
  try {
    const fs = require("fs");
    const path = require("path");

    // Load main migration
    const migrationPath = path.join(__dirname, "../db/migrations/001_final_schema.sql");
    const expansionPath = path.join(__dirname, "../db/migrations/007_pathology_expansion_production.sql");
    
    if (!fs.existsSync(migrationPath)) {
      console.warn(`⚠️  SQL migration file not found at: ${migrationPath}`);
      return;
    }

    let sqlContent = fs.readFileSync(migrationPath, "utf8");
    
    // Also load expansion migration if it exists
    if (fs.existsSync(expansionPath)) {
      const expansionContent = fs.readFileSync(expansionPath, "utf8");
      sqlContent += "\n\n" + expansionContent;
    }
    
    // Fix all test_fields INSERT statements to include timestamps
    // Pattern 1: INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
    sqlContent = sqlContent.replace(
      /INSERT INTO test_fields \(id, test_id, field_name, unit, min_value, max_value, input_type, order_index\)\nSELECT gen_random_uuid\(\), t\.id, f\.field_name, f\.unit, f\.min_value, f\.max_value, 'number', f\.order_index/g,
      `INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, 'number', f.order_index, NOW(), NOW()`
    );
    
    // Pattern 2: INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index)
    // with variable input_type
    sqlContent = sqlContent.replace(
      /INSERT INTO test_fields \(id, test_id, field_name, unit, min_value, max_value, input_type, order_index\)\nSELECT gen_random_uuid\(\), t\.id, f\.field_name, f\.unit, f\.min_value, f\.max_value, f\.input_type, f\.order_index/g,
      `INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, NOW(), NOW()`
    );

    // Pattern 3: INSERT INTO test_fields (id, test_id, field_name, unit, input_type, order_index)
    sqlContent = sqlContent.replace(
      /INSERT INTO test_fields \(id, test_id, field_name, unit, input_type, order_index\)\nSELECT gen_random_uuid\(\), t\.id, f\.field_name, f\.unit, f\.input_type, f\.order_index/g,
      `INSERT INTO test_fields (id, test_id, field_name, unit, input_type, order_index, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.input_type, f.order_index, NOW(), NOW()`
    );

    // Pattern 4: Handle the urine routine one with mixed columns
    sqlContent = sqlContent.replace(
      /INSERT INTO test_fields \(id, test_id, field_name, unit, min_value, max_value, input_type, order_index\)\nSELECT gen_random_uuid\(\), t\.id, f\.field_name, f\.unit, f\.min_value, f\.max_value, f\.input_type, f\.order_index/g,
      `INSERT INTO test_fields (id, test_id, field_name, unit, min_value, max_value, input_type, order_index, created_at, updated_at)
SELECT gen_random_uuid(), t.id, f.field_name, f.unit, f.min_value, f.max_value, f.input_type, f.order_index, NOW(), NOW()`
    );
    
    // Split by semicolons and filter out empty statements
    const statements = sqlContent
      .split(";")
      .map(s => s.trim())
      .filter(s => s && !s.startsWith("--"));

    console.log(`📜  Executing SQL migration (${statements.length} statements)...`);
    
    let executed = 0;
    let fieldsFixed = 0;
    
    for (const statement of statements) {
      try {
        await sequelize.query(statement);
        if (statement.includes("INSERT INTO test_fields")) {
          fieldsFixed++;
        }
        executed++;
      } catch (err) {
        // Log but don't fail on duplicates or non-critical errors
        if (err.message.includes("duplicate") || err.message.includes("already exists")) {
          // Skip duplicate key errors silently
          if (statement.includes("INSERT INTO test_fields")) {
            fieldsFixed++;
          }
          executed++;
        } else if (err.message.includes("DO NOTHING") || err.message.includes("unrecognized")) {
          // Skip ON CONFLICT syntax errors
          executed++;
        } else if (err.message.includes("null value") && err.message.includes("created_at")) {
          // Still has timestamp issues - log once
          if (fieldsFixed === 0) {
            console.warn(`⚠️  Test fields still missing timestamps - trying manual INSERT`);
          }
        }
      }
    }
    
    console.log(`✅  SQL migration executed (${executed}/${statements.length} statements)`);
    if (fieldsFixed > 0) {
      console.log(`✅  Test fields seeded (${fieldsFixed} INSERT statements executed)\n`);
    }

  } catch (err) {
    console.error("❌  SQL migration failed:", err.message);
    // Don't throw—let app continue even if SQL migration fails
  }
}

// ──── Sync Helper ───────────────────────────────────────────────────────────

/**
 * Sync all models with the database.
 * Uses `alter: true` to add missing columns/tables without dropping data.
 * Optionally runs auto-seed if tables are empty.
 */
async function syncDatabase() {
  try {
    console.log("\n🔌  Testing DB connection...");
    await sequelize.authenticate();
    console.log("✅  DB connected successfully");

    if (process.env.SEQUELIZE_SYNC === "true") {
      console.log("📦  Syncing Sequelize models...");
      await sequelize.sync();
      console.log("✅  All models synced — tables are up to date");

      // Execute SQL migration to seed test fields
      await executeSQLMigration();

      // Auto-seed test data (tests only, fields come from SQL)
      await autoSeedData();
      console.log("");
    } else {
      console.log("ℹ️  Sequelize sync skipped (set SEQUELIZE_SYNC=true to enable)\n");
    }
  } catch (err) {
    console.error("❌  Database sync failed:", err.message);
    throw err;
  }
}

// ──── Export ─────────────────────────────────────────────────────────────────

module.exports = {
  sequelize,
  syncDatabase,
  // Models
  User,
  Branch,
  UserBranch,
  Patient,
  Doctor,
  DoctorBranch,
  Sample,
  Test,
  TestField,
  SampleTest,
  Report,
  Payment,
  Inventory,
  SampleCollectionTracking,
  TimeLog,
  Settings,
  UserTest,
  UserTestField,
  B2BLab,
};
