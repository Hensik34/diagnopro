const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const WhatsappNotificationSetting = sequelize.define("WhatsappNotificationSetting", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  branch_id: { type: DataTypes.UUID, allowNull: false },
  event_key: { type: DataTypes.STRING(80), allowNull: false },
  is_enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  created_by: { type: DataTypes.UUID },
  updated_by: { type: DataTypes.UUID },
}, {
  tableName: "whatsapp_notification_settings",
  indexes: [
    { unique: true, fields: ["branch_id", "event_key"] },
  ],
});

module.exports = WhatsappNotificationSetting;
