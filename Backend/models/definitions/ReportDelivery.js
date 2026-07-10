const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database"); // adjust to your sequelize instance path

const ReportDelivery = sequelize.define("ReportDelivery", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  report_id: { type: DataTypes.UUID, allowNull: false },
  branch_id: { type: DataTypes.UUID, allowNull: true },
  channel: { type: DataTypes.STRING, allowNull: false, defaultValue: "whatsapp" },
  recipient_type: { type: DataTypes.STRING, allowNull: false },
  recipient_phone: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: "pending" },
  reason: { type: DataTypes.TEXT, allowNull: true },
  wa_message_id: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: "report_deliveries",
  underscored: true,
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

module.exports = ReportDelivery;
