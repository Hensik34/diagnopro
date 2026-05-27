const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const Patient = sequelize.define("Patient", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: { type: DataTypes.STRING(200), allowNull: false },
  email: { type: DataTypes.STRING(255) },
  phone: { type: DataTypes.STRING(20), allowNull: false },
  age: { type: DataTypes.INTEGER },
  gender: { type: DataTypes.STRING(20) },
  address: { type: DataTypes.TEXT },
  city: { type: DataTypes.STRING(100) },
  state: { type: DataTypes.STRING(100) },
  postal_code: { type: DataTypes.STRING(20) },
  blood_type: { type: DataTypes.STRING(10) },
  branch_id: { type: DataTypes.UUID, allowNull: false },
  created_by: { type: DataTypes.UUID, allowNull: false },
}, {
  tableName: "patients",
});

module.exports = Patient;
