const pool = require("../config/db");

/**
 * Get all collection tracking records with filters
 */
exports.getAll = async (filters = {}) => {
  let query = `
    SELECT sct.*, 
      u.firstname AS staff_firstname, 
      u.lastname AS staff_lastname,
      u.petrol_price_per_km AS staff_petrol_price,
      b.name AS branch_name
    FROM sample_collection_tracking sct
    LEFT JOIN users u ON sct.staff_id = u.id
    LEFT JOIN branches b ON sct.branch_id = b.id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (filters.staff_id) {
    query += ` AND sct.staff_id = $${paramIndex++}`;
    params.push(filters.staff_id);
  }

  if (filters.branch_id) {
    query += ` AND sct.branch_id = $${paramIndex++}`;
    params.push(filters.branch_id);
  }

  if (filters.date_from) {
    query += ` AND sct.date >= $${paramIndex++}`;
    params.push(filters.date_from);
  }

  if (filters.date_to) {
    query += ` AND sct.date <= $${paramIndex++}`;
    params.push(filters.date_to);
  }

  if (filters.date) {
    query += ` AND sct.date = $${paramIndex++}`;
    params.push(filters.date);
  }

  query += ` ORDER BY sct.date DESC, sct.created_at DESC`;

  const result = await pool.query(query, params);
  return result.rows;
};

/**
 * Get a single record by id
 */
exports.getById = async (id) => {
  const result = await pool.query(
    `SELECT sct.*, 
      u.firstname AS staff_firstname, 
      u.lastname AS staff_lastname,
      b.name AS branch_name
    FROM sample_collection_tracking sct
    LEFT JOIN users u ON sct.staff_id = u.id
    LEFT JOIN branches b ON sct.branch_id = b.id
    WHERE sct.id = $1`,
    [id]
  );
  return result.rows[0];
};

/**
 * Get today's records for a specific staff member (multiple per day)
 */
exports.getTodayByStaff = async (staffId) => {
  const result = await pool.query(
    `SELECT sct.*, 
      u.firstname AS staff_firstname, 
      u.lastname AS staff_lastname
    FROM sample_collection_tracking sct
    LEFT JOIN users u ON sct.staff_id = u.id
    WHERE sct.staff_id = $1 AND sct.date = CURRENT_DATE
    ORDER BY sct.created_at DESC`,
    [staffId]
  );
  return result.rows;
};

/**
 * Create a new tracking record
 */
exports.create = async (data) => {
  const result = await pool.query(
    `INSERT INTO sample_collection_tracking 
      (staff_id, branch_id, date, start_km, end_km, start_meter_image, end_meter_image, bike_image, visit_charge, per_km_rate)
    VALUES ($1, $2, COALESCE($3, CURRENT_DATE), $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      data.staff_id,
      data.branch_id || null,
      data.date || null,
      data.start_km || null,
      data.end_km || null,
      data.start_meter_image || null,
      data.end_meter_image || null,
      data.bike_image || null,
      data.visit_charge || 0,
      data.per_km_rate || 0,
    ]
  );
  return result.rows[0];
};

/**
 * Update a tracking record (partial update)
 */
exports.update = async (id, data) => {
  const result = await pool.query(
    `UPDATE sample_collection_tracking SET
      start_km = COALESCE($1, start_km),
      end_km = COALESCE($2, end_km),
      start_meter_image = COALESCE($3, start_meter_image),
      end_meter_image = COALESCE($4, end_meter_image),
      bike_image = COALESCE($5, bike_image),
      visit_charge = COALESCE($6, visit_charge),
      per_km_rate = COALESCE($7, per_km_rate),
      updated_at = NOW()
    WHERE id = $8
    RETURNING *`,
    [
      data.start_km ?? null,
      data.end_km ?? null,
      data.start_meter_image ?? null,
      data.end_meter_image ?? null,
      data.bike_image ?? null,
      data.visit_charge ?? null,
      data.per_km_rate ?? null,
      id,
    ]
  );
  return result.rows[0];
};

/**
 * Delete a tracking record
 */
exports.delete = async (id) => {
  const result = await pool.query(
    "DELETE FROM sample_collection_tracking WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rows[0];
};

/**
 * Get salary summary for a staff member over a date range
 */
exports.getSalarySummary = async (staffId, dateFrom, dateTo) => {
  const result = await pool.query(
    `SELECT 
      COUNT(*) AS total_days,
      SUM(total_km) AS total_km,
      SUM(total_km * per_km_rate) AS km_payment,
      SUM(visit_charge) AS total_visit_charges,
      SUM(total_km * per_km_rate + visit_charge) AS total_amount
    FROM sample_collection_tracking
    WHERE staff_id = $1 AND date >= $2 AND date <= $3`,
    [staffId, dateFrom, dateTo]
  );
  return result.rows[0];
};
