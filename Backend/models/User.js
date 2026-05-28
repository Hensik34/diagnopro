const bcrypt = require("bcrypt");
const { User } = require("./index");

// Find user by email
exports.findUserByEmail = async (email) => {
  return await User.findOne({ where: { email } });
};

// Find user by ID (exclude password)
exports.findUserById = async (id) => {
  return await User.findByPk(id, {
    attributes: { exclude: ["password_hash"] },
  });
};

// Create new user
exports.createUser = async (firstname, lastname, email, password, phone = null, role = "admin", petrol_price_per_km = 0, created_by = null) => {
  const password_hash = await bcrypt.hash(password, 10);

  const user = await User.create({
    firstname, lastname, email, password_hash, phone, role, petrol_price_per_km, created_by,
  });

  // Return without password_hash
  const { password_hash: _, ...userData } = user.toJSON();
  return userData;
};

// Verify password
exports.verifyPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// Update user profile
exports.updateUserProfile = async (id, firstname, lastname, phone) => {
  const [count, [updated]] = await User.update(
    { firstname, lastname, phone },
    { where: { id }, returning: true }
  );
  return updated ? updated.toJSON() : null;
};

// Get all users created by a specific admin (+ the admin themselves)
exports.getAllUsers = async (adminId) => {
  const { Op } = require("sequelize");

  if (!adminId) {
    return [];
  }

  return await User.findAll({
    where: {
      [Op.or]: [{ created_by: adminId }, { id: adminId }],
    },
    attributes: { exclude: ["password_hash"] },
    order: [["created_at", "DESC"]],
  });
};

// Deactivate user (soft delete)
exports.deactivateUser = async (id) => {
  const [count, [updated]] = await User.update(
    { is_active: false },
    { where: { id }, returning: true }
  );
  return updated ? updated.toJSON() : null;
};

// Activate user
exports.activateUser = async (id) => {
  const [count, [updated]] = await User.update(
    { is_active: true },
    { where: { id }, returning: true }
  );
  return updated ? updated.toJSON() : null;
};

// Update user by admin
exports.updateUser = async (id, data) => {
  const { firstname, lastname, phone, role, petrol_price_per_km } = data;
  const [count, [updated]] = await User.update(
    { firstname, lastname, phone, role, petrol_price_per_km },
    { where: { id }, returning: true }
  );
  return updated ? updated.toJSON() : null;
};
