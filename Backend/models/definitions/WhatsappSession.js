const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const WhatsappSession = sequelize.define("WhatsappSession", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  branch_id: { type: DataTypes.UUID, allowNull: false, unique: true },
  status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "disconnected" },
  phone_number: { type: DataTypes.STRING(30) },
  wa_jid: { type: DataTypes.STRING(120) },
  qr_expires_at: { type: DataTypes.DATE },
  last_connected_at: { type: DataTypes.DATE },
  last_disconnected_at: { type: DataTypes.DATE },
  failure_reason: { type: DataTypes.TEXT },
  session_metadata: { type: DataTypes.JSONB, defaultValue: {} },
  created_by: { type: DataTypes.UUID },
  updated_by: { type: DataTypes.UUID },
}, {
  tableName: "whatsapp_sessions",
  indexes: [
    { fields: ["branch_id"] },
    { fields: ["status"] },
  ],
});

module.exports = WhatsappSession;
