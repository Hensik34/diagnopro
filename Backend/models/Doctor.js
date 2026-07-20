const bcrypt = require("bcrypt");
const { Doctor, DoctorBranch, Branch, User, Report, Patient, sequelize } = require("./index");
const { Op, fn, col, literal } = require("sequelize");

// Get all doctors (optionally filtered by branch)
exports.getAllDoctors = async (branchId = null) => {
  if (branchId) {
    const junctions = await DoctorBranch.findAll({
      where: { branch_id: branchId },
      include: [{ model: Doctor }],
    });
    return junctions.map((j) => j.Doctor.toJSON());
  }
  return await Doctor.findAll({ order: [["created_at", "DESC"]] });
};

// Get doctors by branch (backward compat)
exports.getDoctorsByBranch = exports.getAllDoctors;

// Get doctor by ID
exports.getDoctorById = async (id) => {
  return await Doctor.findByPk(id);
};

// Find doctor by email (for unified login)
exports.findDoctorByEmail = async (email) => {
  return await Doctor.findOne({ where: { email, is_active: true } });
};

// Verify doctor password
exports.verifyPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// Get doctor by linked user_id
exports.getDoctorByUserId = async (userId) => {
  return await Doctor.findOne({ where: { user_id: userId } });
};

// Create new doctor
exports.createDoctor = async (doctorData) => {
  const { title = "Dr", name, email, phone, specialization, license_number, branch_id, commission_percentage = 0, user_id = null, password } = doctorData;

  let password_hash = null;
  if (password) password_hash = await bcrypt.hash(password, 10);

  const doctor = await Doctor.create({
    title, name, firstname: name, lastname: "",
    email: email || null, phone, specialization: specialization || null,
    license_number: license_number || null,
    branch_id, commission_percentage, user_id, password_hash,
  });

  if (branch_id) {
    await DoctorBranch.findOrCreate({
      where: { doctor_id: doctor.id, branch_id },
      defaults: { doctor_id: doctor.id, branch_id },
    });
  }

  return doctor;
};

// Update doctor
exports.updateDoctor = async (id, doctorData) => {
  const { title, name, email, phone, specialization, license_number, branch_id, commission_percentage, signature_url, user_id } = doctorData;

  const updateObj = {};
  if (title !== undefined) updateObj.title = title;
  if (name !== undefined) { updateObj.name = name; updateObj.firstname = name; }
  if (email !== undefined) updateObj.email = email || null;
  if (phone !== undefined) updateObj.phone = phone;
  if (specialization !== undefined) updateObj.specialization = specialization;
  if (license_number !== undefined) updateObj.license_number = license_number || null;
  if (branch_id !== undefined) updateObj.branch_id = branch_id;
  if (commission_percentage !== undefined) updateObj.commission_percentage = commission_percentage;
  if (signature_url !== undefined) updateObj.signature_url = signature_url;
  if (user_id !== undefined) updateObj.user_id = user_id;

  const [count, [updated]] = await Doctor.update(updateObj, {
    where: { id },
    returning: true,
  });

  if (branch_id) {
    await DoctorBranch.findOrCreate({
      where: { doctor_id: id, branch_id },
      defaults: { doctor_id: id, branch_id },
    });
  }

  return updated ? updated.toJSON() : null;
};

// Update doctor password
exports.updateDoctorPassword = async (id, password) => {
  const password_hash = await bcrypt.hash(password, 10);
  const [count, [updated]] = await Doctor.update(
    { password_hash },
    { where: { id }, returning: true }
  );
  return updated ? { id: updated.id } : null;
};

// Delete doctor
exports.deleteDoctor = async (id) => {
  const deleted = await Doctor.destroy({ where: { id } });
  return deleted ? { id } : null;
};

// Get doctor's branches
exports.getDoctorBranches = async (doctorId) => {
  const junctions = await DoctorBranch.findAll({
    where: { doctor_id: doctorId },
    include: [{ model: Branch }],
    order: [["created_at", "DESC"]],
  });
  return junctions.map((j) => ({
    ...j.Branch.toJSON(),
    assigned_at: j.created_at,
  }));
};

// Assign doctor to branch
exports.assignDoctorToBranch = async (doctorId, branchId) => {
  const [record, created] = await DoctorBranch.findOrCreate({
    where: { doctor_id: doctorId, branch_id: branchId },
    defaults: { doctor_id: doctorId, branch_id: branchId },
  });
  return record;
};

// Remove doctor from branch
exports.removeDoctorFromBranch = async (doctorId, branchId) => {
  const deleted = await DoctorBranch.destroy({
    where: { doctor_id: doctorId, branch_id: branchId },
  });
  return deleted ? { id: "deleted" } : null;
};

// Deactivate doctor
exports.deactivateDoctor = async (id) => {
  const [count, [updated]] = await Doctor.update(
    { is_active: false },
    { where: { id }, returning: true }
  );
  return updated ? updated.toJSON() : null;
};

// Activate doctor
exports.activateDoctor = async (id) => {
  const [count, [updated]] = await Doctor.update(
    { is_active: true },
    { where: { id }, returning: true }
  );
  return updated ? updated.toJSON() : null;
};

// Get doctor statement (all reports with commission for a date range)
exports.getDoctorStatement = async (doctorId, startDate, endDate) => {
  return await Report.findAll({
    where: {
      doctor_id: doctorId,
      is_self_report: false,
      created_at: { [Op.between]: [startDate, endDate] },
    },
    include: [{
      model: Patient,
      as: "patient",
      attributes: ["id", "name", "phone"],
    }],
    attributes: ["id", "created_at", "report_type", "report_amount", "doctor_commission", "b2b_charge", "status"],
    order: [["created_at", "DESC"]],
    raw: true,
    nest: true,
  });
};

// Get doctor statement summary
exports.getDoctorStatementSummary = async (doctorId, startDate, endDate) => {
  const result = await Report.findOne({
    where: {
      doctor_id: doctorId,
      is_self_report: false,
      created_at: { [Op.between]: [startDate, endDate] },
    },
    attributes: [
      [fn("COUNT", col("id")), "total_reports"],
      [fn("COALESCE", fn("SUM", col("report_amount")), 0), "total_amount"],
      [fn("COALESCE", fn("SUM", col("doctor_commission")), 0), "total_commission"],
      [fn("COALESCE", fn("SUM", col("b2b_charge")), 0), "total_b2b_charge"],
    ],
    raw: true,
  });
  return result;
};
