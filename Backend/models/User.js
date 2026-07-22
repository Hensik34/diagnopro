const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const { User, UserBranch } = require("./index");

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
exports.createUser = async (firstname, lastname = "", email, password, phone = null, role = "admin", petrol_price_per_km = 0, created_by = null, can_approve_reports = false, requires_meter_photo = true, name = null) => {
  const password_hash = await bcrypt.hash(password, 10);
  const fullName = (name || `${firstname || ''} ${lastname || ''}`).trim();

  const user = await User.create({
    name: fullName,
    firstname: firstname || fullName,
    lastname: lastname || "",
    email,
    password_hash,
    phone,
    role,
    petrol_price_per_km,
    created_by,
    can_approve_reports,
    requires_meter_photo,
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

// Get all users created by an admin (or self), optionally filtered by branchId
exports.getAllUsers = async (adminId, branchId) => {
  const where = {
    [Op.or]: [{ created_by: adminId }, { id: adminId }],
  };

  if (branchId) {
    const branchUserRecords = await UserBranch.findAll({
      where: { branch_id: branchId },
      attributes: ["user_id"],
    });
    const userIds = branchUserRecords.map((r) => r.user_id);
    userIds.push(adminId);
    where.id = { [Op.in]: userIds };
  }

  return await User.findAll({
    where,
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
  const { name, firstname, lastname, email, phone, role, petrol_price_per_km, can_approve_reports, requires_meter_photo } = data;
  const updatePayload = { phone, role, petrol_price_per_km, can_approve_reports, requires_meter_photo };

  if (name || firstname) {
    const fullName = (name || `${firstname || ''} ${lastname || ''}`).trim();
    updatePayload.name = fullName;
    updatePayload.firstname = firstname || fullName;
    updatePayload.lastname = lastname !== undefined ? lastname : "";
  }
  if (email) updatePayload.email = email;

  const [count, [updated]] = await User.update(
    updatePayload,
    { where: { id }, returning: true }
  );
  return updated ? updated.toJSON() : null;
};
