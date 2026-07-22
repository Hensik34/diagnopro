const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: { type: DataTypes.STRING(255) },
  firstname: { type: DataTypes.STRING(100), allowNull: true },
  lastname: { type: DataTypes.STRING(100), allowNull: true, defaultValue: "" },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  phone: { type: DataTypes.STRING(20) },
  role: { type: DataTypes.STRING(50), defaultValue: "staff" },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  petrol_price_per_km: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  created_by: { type: DataTypes.UUID },
  can_approve_reports: { type: DataTypes.BOOLEAN, defaultValue: false },
  requires_meter_photo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: "users",
});

module.exports = User;
