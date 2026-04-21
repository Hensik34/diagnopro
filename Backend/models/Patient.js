const pool = require("../config/db");

// Get all patients with optional filters
exports.getAllPatients = async (filters = {}) => {
  let query = `SELECT * FROM patients WHERE 1=1`;
  const params = [];
  let paramIndex = 1;

  if (filters.branch_id) {
    query += ` AND branch_id = $${paramIndex}`;
    params.push(filters.branch_id);
    paramIndex++;
  }

  if (filters.search) {
    query += ` AND (name ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`;
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  query += ` ORDER BY created_at DESC`;
  const result = await pool.query(query, params);
  return result.rows;
};

// Get all patients for a branch (kept for backward compat)
exports.getPatientsByBranch = async (branchId) => {
  const result = await pool.query(
    `SELECT * FROM patients 
     WHERE branch_id = $1 
     ORDER BY created_at DESC`,
    [branchId]
  );
  return result.rows;
};

// Get patient by ID
exports.getPatientById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM patients WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
};

// Create new patient
exports.createPatient = async (patientData) => {
  const { name, email, phone, age, gender, address, city, state, postal_code, blood_type, branch_id, created_by } = patientData;
  
  const result = await pool.query(
    `INSERT INTO patients (name, email, phone, age, gender, address, city, state, postal_code, blood_type, branch_id, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [name, email, phone, age, gender, address, city, state, postal_code, blood_type, branch_id, created_by]
  );
  
  return result.rows[0];
};

// Update patient
exports.updatePatient = async (id, patientData) => {
  const { name, email, phone, age, gender, address, city, state, postal_code, blood_type } = patientData;
  
  const result = await pool.query(
    `UPDATE patients 
     SET name = COALESCE($1, name),
         email = COALESCE($2, email),
         phone = COALESCE($3, phone),
         age = COALESCE($4, age),
         gender = COALESCE($5, gender),
         address = COALESCE($6, address),
         city = COALESCE($7, city),
         state = COALESCE($8, state),
         postal_code = COALESCE($9, postal_code),
         blood_type = COALESCE($10, blood_type),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $11
     RETURNING *`,
    [name, email, phone, age, gender, address, city, state, postal_code, blood_type, id]
  );
  
  return result.rows[0] || null;
};

// Delete patient
exports.deletePatient = async (id) => {
  const result = await pool.query(
    "DELETE FROM patients WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rows[0] || null;
};
