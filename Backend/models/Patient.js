const { Op } = require("sequelize");
const { Patient, User, Branch } = require("./index");

// Get all patients with optional filters
exports.getAllPatients = async (filters = {}) => {
  const where = {};

  if (filters.branch_id) where.branch_id = filters.branch_id;
  if (filters.created_by) where.created_by = filters.created_by;
  if (filters.today_only) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    where.created_at = { [Op.between]: [todayStart, todayEnd] };
  }
  if (filters.search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${filters.search}%` } },
      { phone: { [Op.iLike]: `%${filters.search}%` } },
    ];
  }

  return await Patient.findAll({
    where,
    include: [
      { model: User, as: "creator", attributes: ["id", "firstname", "lastname", "role", "email"] },
      { model: Branch, as: "branch", attributes: ["id", "name"] }
    ],
    order: [["created_at", "DESC"]]
  });
};

// Get all patients for a branch
exports.getPatientsByBranch = async (branchId) => {
  return await Patient.findAll({
    where: { branch_id: branchId },
    order: [["created_at", "DESC"]],
  });
};

// Get patient by ID
exports.getPatientById = async (id) => {
  return await Patient.findByPk(id);
};

// Create new patient
exports.createPatient = async (patientData) => {
  return await Patient.create(patientData);
};

// Update patient
exports.updatePatient = async (id, patientData) => {
  const [count, [updated]] = await Patient.update(patientData, {
    where: { id },
    returning: true,
  });
  return updated ? updated.toJSON() : null;
};

// Delete patient
exports.deletePatient = async (id) => {
  const deleted = await Patient.destroy({ where: { id } });
  return deleted ? { id } : null;
};
