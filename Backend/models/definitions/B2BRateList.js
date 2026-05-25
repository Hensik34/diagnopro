const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const B2BRateList = sequelize.define("B2BRateList", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  b2b_lab_id: { type: DataTypes.UUID, allowNull: false },
  test_id: { type: DataTypes.UUID, allowNull: false },
  collection_price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  processing_price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: "b2b_rate_lists",
  indexes: [{ unique: true, fields: ["b2b_lab_id", "test_id"] }],
});

module.exports = B2BRateList;
