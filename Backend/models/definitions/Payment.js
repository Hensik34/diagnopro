const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const Payment = sequelize.define("Payment", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  report_id: { type: DataTypes.UUID },
  patient_id: { type: DataTypes.UUID },
  doctor_id: { type: DataTypes.UUID },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  payment_mode: { type: DataTypes.STRING(50) },
  payment_date: { type: DataTypes.DATE },
  reference_number: { type: DataTypes.STRING(100) },
  status: { type: DataTypes.STRING(50), defaultValue: "pending" },
  notes: { type: DataTypes.TEXT },
}, {
  tableName: "payments",
});

module.exports = Payment;
