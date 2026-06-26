const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const DoctorTestPrice = sequelize.define("DoctorTestPrice", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  doctor_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  test_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  branch_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  tableName: "doctor_test_prices",
  indexes: [
    { unique: true, fields: ["doctor_id", "test_id", "branch_id"] }
  ]
});

module.exports = DoctorTestPrice;
