const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const Sample = sequelize.define("Sample", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  patient_id: { type: DataTypes.UUID, allowNull: false },
  sample_type: { type: DataTypes.STRING(100) },
  sample_id_code: { type: DataTypes.STRING(100), unique: true, allowNull: false },
  collection_date: { type: DataTypes.DATE },
  collected_by: { type: DataTypes.UUID, allowNull: false },
  branch_id: { type: DataTypes.UUID, allowNull: false },
  status: { type: DataTypes.STRING(50), defaultValue: "pending" },
  notes: { type: DataTypes.TEXT },
}, {
  tableName: "samples",
});

module.exports = Sample;
