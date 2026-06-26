const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const ReportTestPrice = sequelize.define("ReportTestPrice", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  report_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  test_id: {
    type: DataTypes.UUID,
  },
  package_id: {
    type: DataTypes.UUID,
  },
  default_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  applied_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  source: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },
  source_id: {
    type: DataTypes.UUID,
  },
  price_list_version: {
    type: DataTypes.INTEGER,
  },
  is_manual_override: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: "report_test_prices",
  updatedAt: false,
  indexes: [
    { unique: true, fields: ["report_id", "test_id"] }
  ]
});

module.exports = ReportTestPrice;
