/**
 * Central Model Registry - Sequelize Associations and Sync
 */

const sequelize = require("../config/database");

// Import model definitions
const User = require("./definitions/User");
const Branch = require("./definitions/Branch");
const UserBranch = require("./definitions/UserBranch");
const Patient = require("./definitions/Patient");
const Doctor = require("./definitions/Doctor");
const DoctorBranch = require("./definitions/DoctorBranch");
const Sample = require("./definitions/Sample");
const Test = require("./definitions/Test");
const TestField = require("./definitions/TestField");
const SampleTest = require("./definitions/SampleTest");
const Report = require("./definitions/Report");
const Payment = require("./definitions/Payment");
const Inventory = require("./definitions/Inventory");
const SampleCollectionTracking = require("./definitions/SampleCollectionTracking");
const TimeLog = require("./definitions/TimeLog");
const Settings = require("./definitions/Settings");
const UserTest = require("./definitions/UserTest");
const UserTestField = require("./definitions/UserTestField");
const B2BLab = require("./definitions/B2BLab");

// Associations
User.belongsToMany(Branch, { through: UserBranch, foreignKey: "user_id", otherKey: "branch_id", as: "branches" });
Branch.belongsToMany(User, { through: UserBranch, foreignKey: "branch_id", otherKey: "user_id", as: "users" });
User.hasMany(UserBranch, { foreignKey: "user_id" });
UserBranch.belongsTo(User, { foreignKey: "user_id" });
UserBranch.belongsTo(Branch, { foreignKey: "branch_id" });
User.belongsTo(User, { foreignKey: "created_by", as: "creator" });

Patient.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });
Patient.belongsTo(User, { foreignKey: "created_by", as: "creator" });
Branch.hasMany(Patient, { foreignKey: "branch_id" });

Doctor.belongsToMany(Branch, { through: DoctorBranch, foreignKey: "doctor_id", otherKey: "branch_id", as: "branches" });
Branch.belongsToMany(Doctor, { through: DoctorBranch, foreignKey: "branch_id", otherKey: "doctor_id", as: "doctors" });
Doctor.hasMany(DoctorBranch, { foreignKey: "doctor_id" });
DoctorBranch.belongsTo(Doctor, { foreignKey: "doctor_id" });
DoctorBranch.belongsTo(Branch, { foreignKey: "branch_id" });
Doctor.belongsTo(Branch, { foreignKey: "branch_id", as: "primaryBranch" });
Doctor.belongsTo(User, { foreignKey: "user_id", as: "linkedUser" });

Sample.belongsTo(Patient, { foreignKey: "patient_id", as: "patient" });
Sample.belongsTo(User, { foreignKey: "collected_by", as: "collector" });
Sample.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });
Patient.hasMany(Sample, { foreignKey: "patient_id" });

TestField.belongsTo(Test, { foreignKey: "test_id", as: "test" });
Test.hasMany(TestField, { foreignKey: "test_id", as: "fields" });

SampleTest.belongsTo(Sample, { foreignKey: "sample_id" });
SampleTest.belongsTo(Test, { foreignKey: "test_id" });
SampleTest.belongsTo(User, { foreignKey: "performed_by", as: "performer" });
Sample.hasMany(SampleTest, { foreignKey: "sample_id", as: "tests" });

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

Payment.belongsTo(Report, { foreignKey: "report_id", as: "report" });
Payment.belongsTo(Patient, { foreignKey: "patient_id" });
Payment.belongsTo(Doctor, { foreignKey: "doctor_id" });
Report.hasMany(Payment, { foreignKey: "report_id", as: "payments" });

Settings.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });
Branch.hasOne(Settings, { foreignKey: "branch_id", as: "settings" });

Inventory.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });
Branch.hasMany(Inventory, { foreignKey: "branch_id" });

SampleCollectionTracking.belongsTo(User, { foreignKey: "staff_id", as: "staff" });
SampleCollectionTracking.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });

TimeLog.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(TimeLog, { foreignKey: "user_id" });

UserTest.belongsTo(Branch, { foreignKey: "branch_id" });
UserTest.belongsTo(Test, { foreignKey: "test_id" });
Branch.hasMany(UserTest, { foreignKey: "branch_id" });
Test.hasMany(UserTest, { foreignKey: "test_id" });

UserTestField.belongsTo(Branch, { foreignKey: "branch_id" });
UserTestField.belongsTo(TestField, { foreignKey: "test_field_id" });
UserTestField.belongsTo(Test, { foreignKey: "test_id" });

B2BLab.belongsTo(Branch, { foreignKey: "owner_branch_id", as: "ownerBranch" });
B2BLab.belongsTo(User, { foreignKey: "user_id", as: "linkedUser" });
B2BLab.belongsTo(User, { foreignKey: "created_by", as: "creator" });

async function syncDatabase() {
  try {
    const shouldSync = process.env.SEQUELIZE_SYNC === "true";
    const shouldSeed = process.env.SEQUELIZE_SEED_DATA === "true";

    if (shouldSync || shouldSeed) {
      const { ensureDatabase } = require("../db/init");
      await ensureDatabase();
    }

    console.log("\n??  Testing DB connection...");
    await sequelize.authenticate();
    console.log("?  DB connected successfully\n");

    const { runMigrations, runSchemaMigrations, runSeedMigrations } = require("../db/init");

    if (shouldSync && shouldSeed) {
      console.log("??  SEQUELIZE_SYNC=true and SEQUELIZE_SEED_DATA=true: Creating tables and seeding data...");
      await runMigrations("all");
      console.log("?  Database schema and seed data applied (migrations 001, 002)\n");
      return;
    }

    if (shouldSync) {
      console.log("??  SEQUELIZE_SYNC enabled: Creating/updating tables...");
      await runSchemaMigrations();
      console.log("?  Database schema created/updated (migration 001)\n");
    } else {
      console.log("??  SEQUELIZE_SYNC disabled (tables not created/updated)\n");
    }

    if (shouldSeed) {
      console.log("??  SEQUELIZE_SEED_DATA enabled: Seeding data via migration 002...");
      await runSeedMigrations();
      console.log("?  Seed data applied (migration 002)\n");
    } else {
      console.log("??  SEQUELIZE_SEED_DATA disabled (data not seeded)\n");
    }
  } catch (err) {
    console.error("?  Database sync failed:", err.message);
    throw err;
  }
}

module.exports = {
  sequelize,
  syncDatabase,
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
