const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const Branch = sequelize.define("Branch", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: { type: DataTypes.STRING(255), allowNull: false },
  location: { type: DataTypes.STRING(255) },
  city: { type: DataTypes.STRING(100) },
  state: { type: DataTypes.STRING(100) },
  postal_code: { type: DataTypes.STRING(20) },
  phone: { type: DataTypes.STRING(20) },
  email: { type: DataTypes.STRING(255) },
}, {
  tableName: "branches",
});

module.exports = Branch;
