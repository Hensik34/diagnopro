const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const Test = sequelize.define("Test", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  test_name: { type: DataTypes.STRING(255), allowNull: false },
  test_code: { type: DataTypes.STRING(100), allowNull: false },
  category: { type: DataTypes.STRING(100) },
  sample_type: { type: DataTypes.STRING(100) },
  price: { type: DataTypes.DECIMAL(10, 2) },
  turnaround_time: { type: DataTypes.INTEGER },
  description: { type: DataTypes.TEXT },
  branch_id: { type: DataTypes.UUID, allowNull: false },
}, {
  tableName: "tests",
  indexes: [{ unique: true, fields: ["test_code", "branch_id"] }],
});

module.exports = Test;
