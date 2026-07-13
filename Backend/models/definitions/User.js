const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  firstname: { type: DataTypes.STRING(100), allowNull: false },
  lastname: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  phone: { type: DataTypes.STRING(20) },
  role: { type: DataTypes.STRING(50), defaultValue: "staff" },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  petrol_price_per_km: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  created_by: { type: DataTypes.UUID },
  can_approve_reports: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: "users",
});

module.exports = User;
