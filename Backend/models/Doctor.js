const pool = require("../config/db");

// Get all doctors (optionally filtered by branch)
exports.getAllDoctors = async (branchId = null) => {
  if (branchId) {
    const result = await pool.query(
      `SELECT * FROM doctors 
       WHERE branch_id = $1 
       ORDER BY created_at DESC`,
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
    `SELECT * FROM doctors 
     WHERE branch_id = $1 
     ORDER BY created_at DESC`,
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

// Create new doctor
exports.createDoctor = async (doctorData) => {
  const { title = 'Dr', name, email, phone, specialization, license_number, branch_id, commission_percentage = 0 } = doctorData;
  
  const result = await pool.query(
    `INSERT INTO doctors (title, name, firstname, lastname, email, phone, specialization, license_number, branch_id, commission_percentage)
     VALUES ($1, $2, $2, '', $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [title, name, email, phone, specialization, license_number, branch_id, commission_percentage]
  );
  
  return result.rows[0];
};

// Update doctor
exports.updateDoctor = async (id, doctorData) => {
  const { title, name, email, phone, specialization, license_number, branch_id, commission_percentage } = doctorData;
  
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
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $9
     RETURNING *`,
    [title, name, email, phone, specialization, license_number, branch_id, commission_percentage, id]
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
