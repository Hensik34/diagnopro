const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const TimeLog = sequelize.define("TimeLog", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: { type: DataTypes.UUID, allowNull: false },
  clock_in: { type: DataTypes.DATE },
  clock_out: { type: DataTypes.DATE },
  total_hours: { type: DataTypes.DECIMAL(10, 2) },
  branch_id: { type: DataTypes.UUID },
  notes: { type: DataTypes.TEXT },
}, {
  tableName: "time_logs",
});

module.exports = TimeLog;
