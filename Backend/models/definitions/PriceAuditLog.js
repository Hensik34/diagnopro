const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const PriceAuditLog = sequelize.define("PriceAuditLog", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  report_id: {
    type: DataTypes.UUID,
  },
  test_id: {
    type: DataTypes.UUID,
  },
  old_price: {
    type: DataTypes.DECIMAL(10, 2),
  },
  new_price: {
    type: DataTypes.DECIMAL(10, 2),
  },
  source: {
    type: DataTypes.STRING(30),
  },
  changed_by: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  reason: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: "price_audit_log",
  updatedAt: false,
});

module.exports = PriceAuditLog;
