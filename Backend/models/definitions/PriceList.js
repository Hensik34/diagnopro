const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const PriceList = sequelize.define("PriceList", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  branch_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  effective_from: {
    type: DataTypes.DATEONLY,
  },
  effective_to: {
    type: DataTypes.DATEONLY,
  },
  created_by: {
    type: DataTypes.UUID,
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: "price_lists",
  indexes: [
    { unique: true, fields: ["name", "branch_id", "version"] }
  ]
});

module.exports = PriceList;
