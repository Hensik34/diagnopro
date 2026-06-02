const { UserBranch, DoctorBranch } = require("../models");

async function getAccessibleBranchIds(user) {
  if (!user?.id) return [];

  if (user.source === "doctor") {
    const rows = await DoctorBranch.findAll({
      where: { doctor_id: user.id },
      attributes: ["branch_id"],
      raw: true,
    });
    return rows.map((row) => row.branch_id);
  }

  const rows = await UserBranch.findAll({
    where: { user_id: user.id },
    attributes: ["branch_id"],
    raw: true,
  });
  return rows.map((row) => row.branch_id);
}

async function assertBranchAccess(user, branchId) {
  if (!branchId) {
    const err = new Error("branch_id is required");
    err.status = 400;
    throw err;
  }

  const branchIds = await getAccessibleBranchIds(user);
  if (!branchIds.includes(branchId)) {
    const err = new Error("You do not have access to this branch");
    err.status = 403;
    throw err;
  }

  return true;
}

module.exports = {
  getAccessibleBranchIds,
  assertBranchAccess,
};
