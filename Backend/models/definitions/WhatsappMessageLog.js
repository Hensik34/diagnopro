const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const WhatsappMessageLog = sequelize.define("WhatsappMessageLog", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  branch_id: { type: DataTypes.UUID, allowNull: false },
  whatsapp_session_id: { type: DataTypes.UUID },
  template_id: { type: DataTypes.UUID },
  event_key: { type: DataTypes.STRING(80) },
  recipient_phone: { type: DataTypes.STRING(30), allowNull: false },
  recipient_name: { type: DataTypes.STRING(255) },
  message_content: { type: DataTypes.TEXT, allowNull: false },
  wa_message_id: { type: DataTypes.STRING(255) },
  delivery_status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "Pending" },
  error_message: { type: DataTypes.TEXT },
  metadata: { type: DataTypes.JSONB, defaultValue: {} },
}, {
  tableName: "whatsapp_message_logs",
  indexes: [
    { fields: ["branch_id"] },
    { fields: ["delivery_status"] },
    { fields: ["wa_message_id"] },
  ],
});

module.exports = WhatsappMessageLog;
