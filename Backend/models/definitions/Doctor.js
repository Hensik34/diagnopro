const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const Doctor = sequelize.define("Doctor", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: { type: DataTypes.STRING(20), defaultValue: "Dr" },
  name: { type: DataTypes.STRING(200) },
  firstname: { type: DataTypes.STRING(100), allowNull: false },
  lastname: { type: DataTypes.STRING(100) },
  email: { type: DataTypes.STRING(255) },
  phone: { type: DataTypes.STRING(20), allowNull: false },
  specialization: { type: DataTypes.STRING(255) },
  license_number: { type: DataTypes.STRING(100), unique: true },
  password_hash: { type: DataTypes.STRING(255) },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  branch_id: { type: DataTypes.UUID },
  commission_percentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  signature_url: { type: DataTypes.TEXT },
  user_id: { type: DataTypes.UUID },
}, {
  tableName: "doctors",
});

module.exports = Doctor;
