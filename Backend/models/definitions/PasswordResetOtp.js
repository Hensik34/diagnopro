/**
 * ============================================
 * PASSWORD RESET OTP — Sequelize Model Definition
 * ============================================
 * 
 * Stores hashed OTPs for password reset verification.
 * OTPs expire after a configurable duration (default: 10 minutes).
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const PasswordResetOtp = sequelize.define(
  "PasswordResetOtp",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    otp_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    is_used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "password_reset_otps",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["email"] },
      { fields: ["expires_at"] },
    ],
  }
);

module.exports = PasswordResetOtp;
