const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const PriceListItem = sequelize.define("PriceListItem", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  price_list_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  test_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
  },
  discount_type: {
    type: DataTypes.STRING(20),
    defaultValue: "none",
  },
  discount_value: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
}, {
  tableName: "price_list_items",
  indexes: [
    { unique: true, fields: ["price_list_id", "test_id"] }
  ]
});

module.exports = PriceListItem;
