const pool = require("../config/db");

// Get all inventory items for a branch
exports.getAll = async (branchId) => {
  const result = await pool.query(
    "SELECT * FROM inventory WHERE branch_id = $1 ORDER BY category, name",
    [branchId]
  );
  return result.rows;
};

// Get item by ID
exports.getById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM inventory WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
};

// Create new inventory item
exports.create = async (data) => {
  const { name, category, quantity, alert_threshold, unit, branch_id } = data;

  const result = await pool.query(
    `INSERT INTO inventory (name, category, quantity, alert_threshold, unit, branch_id, last_restocked)
     VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $3 > 0 THEN CURRENT_TIMESTAMP ELSE NULL END)
     RETURNING *`,
    [name, category, quantity || 0, alert_threshold || 0, unit, branch_id]
  );

  return result.rows[0];
};

// Update inventory item
exports.update = async (id, data) => {
  const { name, category, quantity, alert_threshold, unit } = data;

  const result = await pool.query(
    `UPDATE inventory
     SET name = COALESCE($1, name),
         category = COALESCE($2, category),
         quantity = COALESCE($3, quantity),
         alert_threshold = COALESCE($4, alert_threshold),
         unit = COALESCE($5, unit),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $6
     RETURNING *`,
    [name, category, quantity, alert_threshold, unit, id]
  );

  return result.rows[0] || null;
};

// Add stock (restock) — increments quantity
exports.addStock = async (id, addQuantity) => {
  const result = await pool.query(
    `UPDATE inventory
     SET quantity = quantity + $1,
         last_restocked = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [addQuantity, id]
  );

  return result.rows[0] || null;
};

// Delete inventory item
exports.delete = async (id) => {
  const result = await pool.query(
    "DELETE FROM inventory WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rows[0] || null;
};
