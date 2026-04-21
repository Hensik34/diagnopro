const pool = require("../config/db");

// Get branches for a specific user (via user_branches)
exports.getAllBranches = async (userId) => {
  const result = await pool.query(
    `SELECT b.*, ub.role as user_role
     FROM branches b
     JOIN user_branches ub ON b.id = ub.branch_id
     WHERE ub.user_id = $1
     ORDER BY b.created_at DESC`,
    [userId]
  );
  return result.rows;
};

// Get branch by ID
exports.getBranchById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM branches WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
};

// Create new branch
exports.createBranch = async (branchData) => {
  const { name, location, city, state, postal_code, phone, email } = branchData;
  
  const result = await pool.query(
    `INSERT INTO branches (name, location, city, state, postal_code, phone, email)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [name, location, city, state, postal_code, phone, email]
  );
  
  return result.rows[0];
};

// Update branch
exports.updateBranch = async (id, branchData) => {
  const { name, location, city, state, postal_code, phone, email } = branchData;
  
  const result = await pool.query(
    `UPDATE branches 
     SET name = COALESCE($1, name),
         location = COALESCE($2, location),
         city = COALESCE($3, city),
         state = COALESCE($4, state),
         postal_code = COALESCE($5, postal_code),
         phone = COALESCE($6, phone),
         email = COALESCE($7, email),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $8
     RETURNING *`,
    [name, location, city, state, postal_code, phone, email, id]
  );
  
  return result.rows[0] || null;
};

// Delete branch
exports.deleteBranch = async (id) => {
  const result = await pool.query(
    "DELETE FROM branches WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rows[0] || null;
};

// Assign user to branch
exports.assignUserToBranch = async (userId, branchId, role = "staff") => {
  const result = await pool.query(
    `INSERT INTO user_branches (user_id, branch_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, branch_id) DO UPDATE 
     SET role = EXCLUDED.role, created_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [userId, branchId, role]
  );
  
  return result.rows[0];
};

// Get user's branches
exports.getUserBranches = async (userId) => {
  const result = await pool.query(
    `SELECT b.*, ub.role as user_role, ub.created_at as assigned_at
     FROM branches b
     JOIN user_branches ub ON b.id = ub.branch_id
     WHERE ub.user_id = $1
     ORDER BY ub.created_at DESC`,
    [userId]
  );
  
  return result.rows;
};

// Remove user from branch
exports.removeUserFromBranch = async (userId, branchId) => {
  const result = await pool.query(
    "DELETE FROM user_branches WHERE user_id = $1 AND branch_id = $2 RETURNING id",
    [userId, branchId]
  );
  
  return result.rows[0] || null;
};
