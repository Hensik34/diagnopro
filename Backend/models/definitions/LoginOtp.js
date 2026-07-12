/**
 * ============================================
 * LOGIN OTP — Sequelize Model Definition
 * ============================================
 * 
 * Stores hashed OTPs for admin 2FA login verification.
 * OTPs expire after a configurable duration (default: 10 minutes).
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const LoginOtp = sequelize.define(
  "LoginOtp",
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
    tableName: "login_otps",
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

module.exports = LoginOtp;
