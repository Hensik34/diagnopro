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
  start_km: { type: DataTypes.DECIMAL(10, 2) },
  end_km: { type: DataTypes.DECIMAL(10, 2) },
  total_km: { type: DataTypes.DECIMAL(10, 2) },
  end_meter_image: { type: DataTypes.TEXT },
  start_meter_image: { type: DataTypes.TEXT },
  location_meta: { type: DataTypes.JSONB, defaultValue: {} },
  approval_status: { type: DataTypes.STRING(30), defaultValue: "approved" },
  is_outside: { type: DataTypes.BOOLEAN, defaultValue: false },
  outside_reason: { type: DataTypes.TEXT },
  rejection_note: { type: DataTypes.TEXT },
  penalty_hours: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  approved_by: { type: DataTypes.UUID },
  approved_at: { type: DataTypes.DATE },
  requested_clock_in: { type: DataTypes.DATE },
  requested_clock_out: { type: DataTypes.DATE },
}, {
  tableName: "time_logs",
});

module.exports = TimeLog;
