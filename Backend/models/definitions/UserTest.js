const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const UserTest = sequelize.define("UserTest", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  branch_id: { type: DataTypes.UUID, allowNull: false },
  test_id: { type: DataTypes.UUID, allowNull: false },
  test_name: { type: DataTypes.STRING(255) },
  category: { type: DataTypes.STRING(100) },
  sample_type: { type: DataTypes.STRING(100) },
  price: { type: DataTypes.DECIMAL(10, 2) },
  turnaround_time: { type: DataTypes.INTEGER },
  description: { type: DataTypes.TEXT },
  layout_config: { type: DataTypes.JSONB, defaultValue: null },
}, {
  tableName: "branch_tests",
  indexes: [{ unique: true, fields: ["branch_id", "test_id"] }],
});

module.exports = UserTest;
