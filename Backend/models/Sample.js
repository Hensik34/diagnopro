const pool = require("../config/db");

// Get all samples
exports.getAllSamples = async (filters = {}) => {
  let query = `
    SELECT s.*, 
           p.name as patient_name,
           u.firstname as collector_firstname, u.lastname as collector_lastname,
           b.name as branch_name
    FROM samples s
    LEFT JOIN patients p ON s.patient_id = p.id
    LEFT JOIN users u ON s.collected_by = u.id
    LEFT JOIN branches b ON s.branch_id = b.id
    WHERE 1=1`;
  const params = [];
  let paramIndex = 1;

  if (filters.branch_id) {
    query += ` AND s.branch_id = $${paramIndex}`;
    params.push(filters.branch_id);
    paramIndex++;
  }

  if (filters.status) {
    query += ` AND s.status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }

  if (filters.patient_id) {
    query += ` AND s.patient_id = $${paramIndex}`;
    params.push(filters.patient_id);
    paramIndex++;
  }

  query += " ORDER BY s.created_at DESC";

  const result = await pool.query(query, params);
  return result.rows;
};

// Get sample by ID
exports.getSampleById = async (id) => {
  const result = await pool.query(
    `SELECT s.*, 
            p.name as patient_name,
            u.firstname as collector_firstname, u.lastname as collector_lastname,
            b.name as branch_name
     FROM samples s
     LEFT JOIN patients p ON s.patient_id = p.id
     LEFT JOIN users u ON s.collected_by = u.id
     LEFT JOIN branches b ON s.branch_id = b.id
     WHERE s.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

// Create new sample
exports.createSample = async (sampleData) => {
  const { patient_id, sample_type, sample_id_code, collection_date, collected_by, branch_id, notes } = sampleData;
  
  const result = await pool.query(
    `INSERT INTO samples (patient_id, sample_type, sample_id_code, collection_date, collected_by, branch_id, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [patient_id, sample_type, sample_id_code, collection_date, collected_by, branch_id, notes]
  );
  
  return result.rows[0];
};

// Update sample
exports.updateSample = async (id, sampleData) => {
  const { status, notes, sample_type } = sampleData;
  
  const result = await pool.query(
    `UPDATE samples 
     SET status = COALESCE($1, status),
         notes = COALESCE($2, notes),
         sample_type = COALESCE($3, sample_type),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4
     RETURNING *`,
    [status, notes, sample_type, id]
  );
  
  return result.rows[0] || null;
};

// Get samples by patient
exports.getSamplesByPatient = async (patientId) => {
  const result = await pool.query(
    `SELECT s.*, 
            u.firstname as collector_firstname, u.lastname as collector_lastname,
            b.name as branch_name
     FROM samples s
     LEFT JOIN users u ON s.collected_by = u.id
     LEFT JOIN branches b ON s.branch_id = b.id
     WHERE s.patient_id = $1
     ORDER BY s.created_at DESC`,
    [patientId]
  );
  
  return result.rows;
};

// Delete sample
exports.deleteSample = async (id) => {
  const result = await pool.query(
    "DELETE FROM samples WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rows[0] || null;
};
