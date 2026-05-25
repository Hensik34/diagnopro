const { Sample, Patient, User, Branch } = require("./index");

const includeAll = [
  { model: Patient, as: "patient", attributes: ["name"] },
  { model: User, as: "collector", attributes: ["firstname", "lastname"] },
  { model: Branch, as: "branch", attributes: ["name"] },
];

// Flatten join aliases to match old raw-SQL field names
function flatten(row) {
  if (!row) return null;
  const j = row.toJSON ? row.toJSON() : row;
  return {
    ...j,
    patient_name: j.patient?.name,
    collector_firstname: j.collector?.firstname,
    collector_lastname: j.collector?.lastname,
    branch_name: j.branch?.name,
    patient: undefined, collector: undefined, branch: undefined,
  };
}

// Get all samples
exports.getAllSamples = async (filters = {}) => {
  const where = {};
  if (filters.branch_id) where.branch_id = filters.branch_id;
  if (filters.status) where.status = filters.status;
  if (filters.patient_id) where.patient_id = filters.patient_id;

  const rows = await Sample.findAll({
    where,
    include: includeAll,
    order: [["created_at", "DESC"]],
  });
  return rows.map(flatten);
};

// Get sample by ID
exports.getSampleById = async (id) => {
  const row = await Sample.findByPk(id, { include: includeAll });
  return flatten(row);
};

// Create new sample
exports.createSample = async (sampleData) => {
  return await Sample.create(sampleData);
};

// Update sample
exports.updateSample = async (id, sampleData) => {
  const [count, [updated]] = await Sample.update(sampleData, {
    where: { id },
    returning: true,
  });
  return updated ? updated.toJSON() : null;
};

// Get samples by patient
exports.getSamplesByPatient = async (patientId) => {
  const rows = await Sample.findAll({
    where: { patient_id: patientId },
    include: [
      { model: User, as: "collector", attributes: ["firstname", "lastname"] },
      { model: Branch, as: "branch", attributes: ["name"] },
    ],
    order: [["created_at", "DESC"]],
  });
  return rows.map(flatten);
};

// Delete sample
exports.deleteSample = async (id) => {
  const deleted = await Sample.destroy({ where: { id } });
  return deleted ? { id } : null;
};
