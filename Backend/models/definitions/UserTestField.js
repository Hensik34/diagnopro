const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const UserTestField = sequelize.define("UserTestField", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: { type: DataTypes.UUID, allowNull: false },
  test_field_id: { type: DataTypes.UUID, allowNull: false },
  test_id: { type: DataTypes.UUID },
  field_name: { type: DataTypes.STRING(255) },
  unit: { type: DataTypes.STRING(100) },
  min_value: { type: DataTypes.DECIMAL(10, 2) },
  max_value: { type: DataTypes.DECIMAL(10, 2) },
  input_type: { type: DataTypes.STRING(50), defaultValue: "number" },
  options: { type: DataTypes.TEXT },
  order_index: { type: DataTypes.INTEGER, defaultValue: 0 },
  field_type: { type: DataTypes.STRING(50), defaultValue: "input" },
  formula: { type: DataTypes.TEXT },
  depends_on: { type: DataTypes.TEXT },
  section_group: { type: DataTypes.STRING(255) },
}, {
  tableName: "user_test_fields",
  indexes: [{ unique: true, fields: ["user_id", "test_field_id"] }],
});

module.exports = UserTestField;
