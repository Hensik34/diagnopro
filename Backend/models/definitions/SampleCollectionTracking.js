const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const SampleCollectionTracking = sequelize.define("SampleCollectionTracking", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  staff_id: { type: DataTypes.UUID, allowNull: false },
  branch_id: { type: DataTypes.UUID },
  date: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  start_km: { type: DataTypes.DECIMAL(10, 2) },
  end_km: { type: DataTypes.DECIMAL(10, 2) },
  total_km: { type: DataTypes.DECIMAL(10, 2) },
  start_meter_image: { type: DataTypes.TEXT },
  end_meter_image: { type: DataTypes.TEXT },
  bike_image: { type: DataTypes.TEXT },
  visit_charge: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  per_km_rate: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
}, {
  tableName: "sample_collection_tracking",
});

module.exports = SampleCollectionTracking;
