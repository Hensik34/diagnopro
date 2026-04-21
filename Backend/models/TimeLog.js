const pool = require("../config/db");

// Clock in - create a new time log entry
exports.clockIn = async (userId) => {
  const result = await pool.query(
    `INSERT INTO time_logs (user_id, clock_in) 
     VALUES ($1, CURRENT_TIMESTAMP) 
     RETURNING *`,
    [userId]
  );
  return result.rows[0];
};

// Clock out - update existing open time log
exports.clockOut = async (userId, notes) => {
  const result = await pool.query(
    `UPDATE time_logs 
     SET clock_out = CURRENT_TIMESTAMP,
         total_hours = ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - clock_in)) / 3600.0, 2),
         notes = COALESCE($2, notes),
         updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $1 AND clock_out IS NULL
     RETURNING *`,
    [userId, notes]
  );
  return result.rows[0] || null;
};

// Get active (open) session for a user
exports.getActiveSession = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM time_logs 
     WHERE user_id = $1 AND clock_out IS NULL 
     ORDER BY clock_in DESC LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
};

// Get time logs for a user with date range
exports.getByUser = async (userId, startDate, endDate) => {
  const result = await pool.query(
    `SELECT * FROM time_logs 
     WHERE user_id = $1 
       AND clock_in >= $2 
       AND clock_in < $3
     ORDER BY clock_in DESC`,
    [userId, startDate, endDate]
  );
  return result.rows;
};

// Get all users' time logs (admin) filtered by admin's team
exports.getAll = async (startDate, endDate, adminId) => {
  const result = await pool.query(
    `SELECT tl.*, 
            u.firstname, u.lastname, u.email, u.role
     FROM time_logs tl
     JOIN users u ON tl.user_id = u.id
     WHERE tl.clock_in >= $1 
       AND tl.clock_in < $2
       AND (u.created_by = $3 OR u.id = $3)
     ORDER BY tl.clock_in DESC`,
    [startDate, endDate, adminId]
  );
  return result.rows;
};

// Get summary of hours per user for a date range (admin's team only)
exports.getUserSummary = async (startDate, endDate, adminId) => {
  const result = await pool.query(
    `SELECT 
        u.id as user_id,
        u.firstname,
        u.lastname,
        u.email,
        u.role,
        COUNT(tl.id) as total_sessions,
        COALESCE(SUM(tl.total_hours), 0) as total_hours,
        MIN(tl.clock_in) as first_clock_in,
        MAX(tl.clock_out) as last_clock_out
     FROM users u
     LEFT JOIN time_logs tl ON u.id = tl.user_id 
       AND tl.clock_in >= $1 
       AND tl.clock_in < $2
     WHERE u.is_active = true AND u.role != 'admin'
       AND (u.created_by = $3 OR u.id = $3)
     GROUP BY u.id, u.firstname, u.lastname, u.email, u.role
     ORDER BY total_hours DESC`,
    [startDate, endDate, adminId]
  );
  return result.rows;
};

// Delete a time log (admin only)
exports.deleteLog = async (id) => {
  const result = await pool.query(
    `DELETE FROM time_logs WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};
