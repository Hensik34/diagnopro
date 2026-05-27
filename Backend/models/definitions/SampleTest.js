const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const SampleTest = sequelize.define("SampleTest", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  sample_id: { type: DataTypes.UUID, allowNull: false },
  test_id: { type: DataTypes.UUID, allowNull: false },
  status: { type: DataTypes.STRING(50), defaultValue: "pending" },
  result: { type: DataTypes.TEXT },
  result_unit: { type: DataTypes.STRING(50) },
  reference_range: { type: DataTypes.STRING(100) },
  performed_by: { type: DataTypes.UUID },
}, {
  tableName: "sample_tests",
  indexes: [{ unique: true, fields: ["sample_id", "test_id"] }],
});

module.exports = SampleTest;
