const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const TestField = sequelize.define("TestField", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  test_id: { type: DataTypes.UUID, allowNull: false },
  field_name: { type: DataTypes.STRING(255), allowNull: false },
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
  tableName: "test_fields",
  timestamps: true,
});

module.exports = TestField;
