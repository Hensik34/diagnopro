const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const Receipt = sequelize.define(
  "Receipt",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    report_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "reports",
        key: "id",
      },
    },
    receipt_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    custom_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    selected_tests: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "receipts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Receipt;
