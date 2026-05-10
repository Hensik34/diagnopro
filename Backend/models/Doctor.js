const pool = require("../config/db");
const bcrypt = require("bcrypt");

// Get all doctors (optionally filtered by branch)
exports.getAllDoctors = async (branchId = null) => {
  if (branchId) {
    const result = await pool.query(
      `SELECT d.* FROM doctors d
       JOIN doctor_branches db ON d.id = db.doctor_id
       WHERE db.branch_id = $1 
       ORDER BY d.created_at DESC`,
      [branchId]
    );
    return result.rows;
  }

  const result = await pool.query(
    `SELECT * FROM doctors ORDER BY created_at DESC`
  );
  return result.rows;
};

// Get all doctors for a branch (kept for backwards compatibility)
exports.getDoctorsByBranch = async (branchId) => {
  const result = await pool.query(
    `SELECT d.* FROM doctors d
     JOIN doctor_branches db ON d.id = db.doctor_id
     WHERE db.branch_id = $1 
     ORDER BY d.created_at DESC`,
    [branchId]
  );
  return result.rows;
};

// Get doctor by ID
exports.getDoctorById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM doctors WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
};

// Find doctor by email (for unified login)
exports.findDoctorByEmail = async (email) => {
  const result = await pool.query(
    "SELECT * FROM doctors WHERE email = $1 AND is_active = TRUE LIMIT 1",
    [email]
  );
  return result.rows[0] || null;
};

// Verify doctor password
exports.verifyPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// Get doctor by linked user_id (for doctor login/portal)
exports.getDoctorByUserId = async (userId) => {
  const result = await pool.query(
    "SELECT * FROM doctors WHERE user_id = $1",
    [userId]
  );
  return result.rows[0] || null;
};

// Create new doctor
exports.createDoctor = async (doctorData) => {
  const { title = 'Dr', name, email, phone, specialization, license_number, branch_id, commission_percentage = 0, user_id = null, password } = doctorData;

  // Hash password if provided
  let passwordHash = null;
  if (password) {
    passwordHash = await bcrypt.hash(password, 10);
  }

  const result = await pool.query(
    `INSERT INTO doctors (title, name, firstname, lastname, email, phone, specialization, license_number, branch_id, commission_percentage, user_id, password_hash)
     VALUES ($1, $2, $2, '', $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [title, name, email, phone, specialization, license_number, branch_id, commission_percentage, user_id, passwordHash]
  );

  const doctor = result.rows[0];

  // Also insert into doctor_branches if branch_id provided
  if (branch_id) {
    await pool.query(
      `INSERT INTO doctor_branches (doctor_id, branch_id)
       VALUES ($1, $2)
       ON CONFLICT (doctor_id, branch_id) DO NOTHING`,
      [doctor.id, branch_id]
    );
  }

  return doctor;
};

// Update doctor
exports.updateDoctor = async (id, doctorData) => {
  const { title, name, email, phone, specialization, license_number, branch_id, commission_percentage, signature_url, user_id } = doctorData;

  const result = await pool.query(
    `UPDATE doctors 
     SET title = COALESCE($1, title),
         name = COALESCE($2, name),
         firstname = COALESCE($2, firstname),
         email = COALESCE($3, email),
         phone = COALESCE($4, phone),
         specialization = COALESCE($5, specialization),
         license_number = COALESCE($6, license_number),
         branch_id = COALESCE($7, branch_id),
         commission_percentage = COALESCE($8, commission_percentage),
         signature_url = COALESCE($9, signature_url),
         user_id = COALESCE($10, user_id),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $11
     RETURNING *`,
    [title, name, email, phone, specialization, license_number, branch_id, commission_percentage, signature_url, user_id, id]
  );

  // If branch_id provided, also add to doctor_branches
  if (branch_id) {
    await pool.query(
      `INSERT INTO doctor_branches (doctor_id, branch_id)
       VALUES ($1, $2)
       ON CONFLICT (doctor_id, branch_id) DO NOTHING`,
      [id, branch_id]
    );
  }

  return result.rows[0] || null;
};

// Update doctor password
exports.updateDoctorPassword = async (id, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `UPDATE doctors SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id`,
    [hashedPassword, id]
  );
  return result.rows[0] || null;
};

// Delete doctor
exports.deleteDoctor = async (id) => {
  const result = await pool.query(
    "DELETE FROM doctors WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rows[0] || null;
};

// Get doctor's branches (from doctor_branches table)
exports.getDoctorBranches = async (doctorId) => {
  const result = await pool.query(
    `SELECT b.*, db.created_at as assigned_at
     FROM branches b
     JOIN doctor_branches db ON b.id = db.branch_id
     WHERE db.doctor_id = $1
     ORDER BY db.created_at DESC`,
    [doctorId]
  );
  return result.rows;
};

// Assign doctor to branch
exports.assignDoctorToBranch = async (doctorId, branchId) => {
  const result = await pool.query(
    `INSERT INTO doctor_branches (doctor_id, branch_id)
     VALUES ($1, $2)
     ON CONFLICT (doctor_id, branch_id) DO NOTHING
     RETURNING *`,
    [doctorId, branchId]
  );
  return result.rows[0] || null;
};

// Remove doctor from branch
exports.removeDoctorFromBranch = async (doctorId, branchId) => {
  const result = await pool.query(
    "DELETE FROM doctor_branches WHERE doctor_id = $1 AND branch_id = $2 RETURNING id",
    [doctorId, branchId]
  );
  return result.rows[0] || null;
};

// Deactivate doctor
exports.deactivateDoctor = async (id) => {
  const result = await pool.query(
    `UPDATE doctors SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

// Activate doctor
exports.activateDoctor = async (id) => {
  const result = await pool.query(
    `UPDATE doctors SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

// Get doctor statement (all reports with commission for a date range)
exports.getDoctorStatement = async (doctorId, startDate, endDate) => {
  const result = await pool.query(
    `SELECT 
       r.id as report_id,
       r.created_at as report_date,
       r.report_type,
       r.report_amount,
       r.doctor_commission,
       r.status,
       p.id as patient_id,
       p.name as patient_name,
       p.phone as patient_phone
     FROM reports r
     JOIN patients p ON r.patient_id = p.id
     WHERE r.doctor_id = $1 
       AND r.is_self_report = FALSE
       AND r.created_at >= $2 
       AND r.created_at <= $3
     ORDER BY r.created_at DESC`,
    [doctorId, startDate, endDate]
  );
  return result.rows;
};

// Get doctor statement summary
exports.getDoctorStatementSummary = async (doctorId, startDate, endDate) => {
  const result = await pool.query(
    `SELECT 
       COUNT(*) as total_reports,
       COALESCE(SUM(report_amount), 0) as total_amount,
       COALESCE(SUM(doctor_commission), 0) as total_commission
     FROM reports
     WHERE doctor_id = $1 
       AND is_self_report = FALSE
       AND created_at >= $2 
       AND created_at <= $3`,
    [doctorId, startDate, endDate]
  );
  return result.rows[0];
};
