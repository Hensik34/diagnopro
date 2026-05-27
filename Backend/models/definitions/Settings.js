const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const Settings = sequelize.define("Settings", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  branch_id: { type: DataTypes.UUID, allowNull: false, unique: true },
  letterhead_url: { type: DataTypes.TEXT },
  owner_signature_url: { type: DataTypes.TEXT },
  header_url: { type: DataTypes.TEXT },
  footer_url: { type: DataTypes.TEXT },
  report_margin_top: { type: DataTypes.STRING(20), defaultValue: "10mm" },
  report_margin_bottom: { type: DataTypes.STRING(20), defaultValue: "10mm" },
  report_margin_left: { type: DataTypes.STRING(20), defaultValue: "10mm" },
  report_margin_right: { type: DataTypes.STRING(20), defaultValue: "10mm" },
  signature_1_url: { type: DataTypes.TEXT },
  signature_1_label: { type: DataTypes.STRING(255) },
  signature_2_url: { type: DataTypes.TEXT },
  signature_2_label: { type: DataTypes.STRING(255) },
  signature_3_url: { type: DataTypes.TEXT },
  signature_3_label: { type: DataTypes.STRING(255) },
  signature_4_url: { type: DataTypes.TEXT },
  signature_4_label: { type: DataTypes.STRING(255) },
  default_signature_index: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: "settings",
});

module.exports = Settings;
