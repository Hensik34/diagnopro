const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const DoctorBranch = sequelize.define("DoctorBranch", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  doctor_id: { type: DataTypes.UUID, allowNull: false },
  branch_id: { type: DataTypes.UUID, allowNull: false },
}, {
  tableName: "doctor_branches",
  updatedAt: false,
  indexes: [{ unique: true, fields: ["doctor_id", "branch_id"] }],
});

module.exports = DoctorBranch;
