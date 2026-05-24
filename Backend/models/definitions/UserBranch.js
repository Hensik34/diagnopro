const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const UserBranch = sequelize.define("UserBranch", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: { type: DataTypes.UUID, allowNull: false },
  branch_id: { type: DataTypes.UUID, allowNull: false },
  role: { type: DataTypes.STRING(50), defaultValue: "staff" },
}, {
  tableName: "user_branches",
  updatedAt: false,
  indexes: [{ unique: true, fields: ["user_id", "branch_id"] }],
});

module.exports = UserBranch;
