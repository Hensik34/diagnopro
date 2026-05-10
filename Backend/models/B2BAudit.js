const pool = require("../config/db");

/**
 * B2B Audit Model — Full audit trail for all B2B operations
 */

exports.log = async (data) => {
  const { entity_type, entity_id, action, old_value, new_value, details, performed_by, ip_address } = data;
  const result = await pool.query(
    `INSERT INTO b2b_audit_log (entity_type, entity_id, action, old_value, new_value, details, performed_by, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [entity_type, entity_id, action, old_value || null, new_value || null,
     details ? JSON.stringify(details) : null, performed_by || null, ip_address || null]
  );
  return result.rows[0];
};

exports.getAuditLog = async (filters = {}) => {
  let query = `
    SELECT a.*,
           u.firstname as performer_firstname, u.lastname as performer_lastname
    FROM b2b_audit_log a
    LEFT JOIN users u ON a.performed_by = u.id
    WHERE 1=1`;
  const params = [];
  let idx = 1;

  if (filters.entity_type) {
    query += ` AND a.entity_type = $${idx++}`;
    params.push(filters.entity_type);
  }
  if (filters.entity_id) {
    query += ` AND a.entity_id = $${idx++}`;
    params.push(filters.entity_id);
  }
  if (filters.action) {
    query += ` AND a.action = $${idx++}`;
    params.push(filters.action);
  }
  if (filters.performed_by) {
    query += ` AND a.performed_by = $${idx++}`;
    params.push(filters.performed_by);
  }
  if (filters.date_from) {
    query += ` AND a.performed_at >= $${idx++}`;
    params.push(filters.date_from);
  }
  if (filters.date_to) {
    query += ` AND a.performed_at <= $${idx++}`;
    params.push(filters.date_to);
  }

  query += ` ORDER BY a.performed_at DESC`;

  if (filters.limit) {
    query += ` LIMIT $${idx++}`;
    params.push(filters.limit);
  }
  if (filters.offset) {
    query += ` OFFSET $${idx++}`;
    params.push(filters.offset);
  }

  const result = await pool.query(query, params);
  return result.rows;
};

// ==========================================
// NOTIFICATIONS
// ==========================================

exports.createNotification = async (data) => {
  const { b2b_lab_id, user_id, type, title, message, order_id, channel } = data;
  const result = await pool.query(
    `INSERT INTO b2b_notifications (b2b_lab_id, user_id, type, title, message, order_id, channel)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [b2b_lab_id || null, user_id || null, type, title, message || null, order_id || null, channel || 'in_app']
  );
  return result.rows[0];
};

exports.getNotifications = async (filters = {}) => {
  let query = `SELECT * FROM b2b_notifications WHERE 1=1`;
  const params = [];
  let idx = 1;

  if (filters.b2b_lab_id) {
    query += ` AND b2b_lab_id = $${idx++}`;
    params.push(filters.b2b_lab_id);
  }
  if (filters.user_id) {
    query += ` AND user_id = $${idx++}`;
    params.push(filters.user_id);
  }
  if (filters.is_read !== undefined) {
    query += ` AND is_read = $${idx++}`;
    params.push(filters.is_read);
  }

  query += ` ORDER BY created_at DESC`;

  if (filters.limit) {
    query += ` LIMIT $${idx++}`;
    params.push(filters.limit);
  }

  const result = await pool.query(query, params);
  return result.rows;
};

exports.markNotificationRead = async (id) => {
  const result = await pool.query(
    `UPDATE b2b_notifications SET is_read = true WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

exports.markAllNotificationsRead = async (userId = null, labId = null) => {
  let query = `UPDATE b2b_notifications SET is_read = true WHERE is_read = false`;
  const params = [];
  let idx = 1;

  if (userId) {
    query += ` AND user_id = $${idx++}`;
    params.push(userId);
  }
  if (labId) {
    query += ` AND b2b_lab_id = $${idx++}`;
    params.push(labId);
  }

  const result = await pool.query(query, params);
  return result.rowCount;
};

module.exports = exports;
