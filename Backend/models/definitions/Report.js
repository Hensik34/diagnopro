const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const Report = sequelize.define("Report", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  patient_id: { type: DataTypes.UUID, allowNull: false },
  doctor_id: { type: DataTypes.UUID },
  referring_doctor_name: { type: DataTypes.STRING(255) },
  technician_id: { type: DataTypes.UUID },
  report_type: { type: DataTypes.TEXT },
  sample_id: { type: DataTypes.UUID },
  branch_id: { type: DataTypes.UUID, allowNull: false },
  status: { type: DataTypes.STRING(50), defaultValue: "draft" },
  clinical_notes: { type: DataTypes.TEXT },
  findings: { type: DataTypes.TEXT },
  recommendations: { type: DataTypes.TEXT },
  reviewed_by: { type: DataTypes.UUID },
  approved_by: { type: DataTypes.UUID },
  approved_at: { type: DataTypes.DATE },
  submitted_by: { type: DataTypes.UUID },
  submitted_at: { type: DataTypes.DATE },
  rejected_by: { type: DataTypes.UUID },
  rejected_at: { type: DataTypes.DATE },
  rejection_reason: { type: DataTypes.TEXT },
  // Billing
  report_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  doctor_commission: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  is_self_report: { type: DataTypes.BOOLEAN, defaultValue: false },
  test_data: { type: DataTypes.JSONB, defaultValue: {} },
  delivery_preferences: { type: DataTypes.JSONB, defaultValue: {} },
  base_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  lab_discount_type: { type: DataTypes.STRING(20), defaultValue: "percent" },
  lab_discount_value: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  doctor_discount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  final_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  payment_status: { type: DataTypes.STRING(30), defaultValue: "pending" },
  // B2B
  b2b_lab_id: { type: DataTypes.UUID },
  b2b_charge: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  // Multi-tier pricing
  price_list_id: { type: DataTypes.UUID },
  price_locked: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: "reports",
});

module.exports = Report;
