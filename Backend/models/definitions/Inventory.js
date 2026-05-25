const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const Inventory = sequelize.define("Inventory", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: { type: DataTypes.STRING(255), allowNull: false },
  category: { type: DataTypes.STRING(100) },
  quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
  alert_threshold: { type: DataTypes.INTEGER, defaultValue: 0 },
  unit: { type: DataTypes.STRING(50), defaultValue: "packs" },
  branch_id: { type: DataTypes.UUID, allowNull: false },
  last_restocked: { type: DataTypes.DATE },
}, {
  tableName: "inventory",
});

module.exports = Inventory;
