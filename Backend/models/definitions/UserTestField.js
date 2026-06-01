const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const UserTestField = sequelize.define("UserTestField", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  branch_id: { type: DataTypes.UUID, allowNull: false },
  test_field_id: { type: DataTypes.UUID, allowNull: true },
  test_id: { type: DataTypes.UUID, allowNull: false },
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
  reference_rules: { type: DataTypes.JSONB },
  critical_rules: { type: DataTypes.JSONB },
  is_mandatory: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: "branch_test_fields",
  indexes: [{ unique: true, fields: ["branch_id", "test_id", "field_name"] }],
});

module.exports = UserTestField;
