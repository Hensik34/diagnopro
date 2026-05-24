const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const B2BLab = sequelize.define("B2BLab", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  lab_name: { type: DataTypes.STRING(255), allowNull: false },
  lab_code: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  contact_person: { type: DataTypes.STRING(255) },
  mobile: { type: DataTypes.STRING(20) },
  email: { type: DataTypes.STRING(255) },
  address: { type: DataTypes.TEXT },
  city: { type: DataTypes.STRING(100) },
  state: { type: DataTypes.STRING(100) },
  pincode: { type: DataTypes.STRING(10) },
  gst_number: { type: DataTypes.STRING(50) },
  commission_type: { type: DataTypes.STRING(20), defaultValue: "percentage" },
  commission_value: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  credit_limit: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  current_balance: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  lab_type: { type: DataTypes.STRING(20), defaultValue: "collection" },
  owner_branch_id: { type: DataTypes.UUID },
  user_id: { type: DataTypes.UUID },
  logo_url: { type: DataTypes.TEXT },
  show_processing_lab: { type: DataTypes.BOOLEAN, defaultValue: false },
  custom_footer: { type: DataTypes.TEXT },
  status: { type: DataTypes.STRING(20), defaultValue: "active" },
  is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  deleted_at: { type: DataTypes.DATE },
  version: { type: DataTypes.INTEGER, defaultValue: 1 },
  created_by: { type: DataTypes.UUID },
}, {
  tableName: "b2b_labs",
  defaultScope: { where: { is_deleted: false } },
});

module.exports = B2BLab;
