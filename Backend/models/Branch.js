const { Branch, UserBranch } = require("./index");

// Get branches for a specific user (via user_branches)
exports.getAllBranches = async (userId) => {
  const records = await UserBranch.findAll({
    where: { user_id: userId },
    include: [{ model: Branch, as: undefined }],
    order: [[Branch, "created_at", "DESC"]],
  });

  // Flatten: attach user_role from junction
  return records.map((r) => {
    const branch = r.Branch ? r.Branch.toJSON() : {};
    return { ...branch, user_role: r.role };
  });
};

// Get branch by ID
exports.getBranchById = async (id) => {
  return await Branch.findByPk(id);
};

// Create new branch
exports.createBranch = async (branchData) => {
  return await Branch.create(branchData);
};

// Update branch
exports.updateBranch = async (id, branchData) => {
  const [count, [updated]] = await Branch.update(branchData, {
    where: { id },
    returning: true,
  });
  return updated ? updated.toJSON() : null;
};

// Delete branch
exports.deleteBranch = async (id) => {
  const deleted = await Branch.destroy({ where: { id } });
  return deleted ? { id } : null;
};

// Assign user to branch
exports.assignUserToBranch = async (userId, branchId, role = "staff") => {
  const [record] = await UserBranch.upsert(
    { user_id: userId, branch_id: branchId, role },
    { returning: true }
  );
  return record.toJSON();
};

// Get user's branches
exports.getUserBranches = async (userId) => {
  const records = await UserBranch.findAll({
    where: { user_id: userId },
    include: [{ model: Branch, as: undefined }],
    order: [["created_at", "DESC"]],
  });

  return records.map((r) => {
    const branch = r.Branch ? r.Branch.toJSON() : {};
    return { ...branch, user_role: r.role, assigned_at: r.created_at };
  });
};

// Remove user from branch
exports.removeUserFromBranch = async (userId, branchId) => {
  const deleted = await UserBranch.destroy({
    where: { user_id: userId, branch_id: branchId },
  });
  return deleted ? { id: "deleted" } : null;
};
