const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const WhatsappTemplate = sequelize.define("WhatsappTemplate", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  branch_id: { type: DataTypes.UUID, allowNull: true },
  event_key: { type: DataTypes.STRING(80), allowNull: false },
  template_name: { type: DataTypes.STRING(140), allowNull: false },
  template_body: { type: DataTypes.TEXT, allowNull: false },
  is_enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  is_system: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  created_by: { type: DataTypes.UUID },
  updated_by: { type: DataTypes.UUID },
}, {
  tableName: "whatsapp_templates",
  indexes: [
    { unique: true, fields: ["branch_id", "event_key"] },
    { fields: ["is_enabled"] },
  ],
});

module.exports = WhatsappTemplate;
