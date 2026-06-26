const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const DoctorPriceListAssignment = sequelize.define("DoctorPriceListAssignment", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  doctor_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  branch_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  price_list_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  tableName: "doctor_price_list_assignments",
  indexes: [
    { unique: true, fields: ["doctor_id", "branch_id"] }
  ]
});

module.exports = DoctorPriceListAssignment;
