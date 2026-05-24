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
const B2BRateList      = require("./definitions/B2BRateList");

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

// Test → Branch
Test.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });
Branch.hasMany(Test, { foreignKey: "branch_id" });

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

// UserTest → User, Test
UserTest.belongsTo(User, { foreignKey: "user_id" });
UserTest.belongsTo(Test, { foreignKey: "test_id" });
User.hasMany(UserTest, { foreignKey: "user_id" });
Test.hasMany(UserTest, { foreignKey: "test_id" });

// UserTestField → User, TestField, Test
UserTestField.belongsTo(User, { foreignKey: "user_id" });
UserTestField.belongsTo(TestField, { foreignKey: "test_field_id" });
UserTestField.belongsTo(Test, { foreignKey: "test_id" });

// B2BLab → Branch (owner), User
B2BLab.belongsTo(Branch, { foreignKey: "owner_branch_id", as: "ownerBranch" });
B2BLab.belongsTo(User, { foreignKey: "user_id", as: "linkedUser" });
B2BLab.belongsTo(User, { foreignKey: "created_by", as: "creator" });

// B2BRateList → B2BLab, Test
B2BRateList.belongsTo(B2BLab, { foreignKey: "b2b_lab_id", as: "lab" });
B2BRateList.belongsTo(Test, { foreignKey: "test_id", as: "test" });
B2BLab.hasMany(B2BRateList, { foreignKey: "b2b_lab_id", as: "rateList" });

// ──── Sync Helper ───────────────────────────────────────────────────────────

/**
 * Sync all models with the database.
 * Uses `alter: true` to add missing columns/tables without dropping data.
 */
async function syncDatabase() {
  try {
    console.log("\n🔌  Testing DB connection...");
    await sequelize.authenticate();
    console.log("✅  DB connected successfully");

    console.log("📦  Syncing Sequelize models...");
    await sequelize.sync();
    console.log("✅  All models synced — tables are up to date\n");
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
  B2BRateList,
};
