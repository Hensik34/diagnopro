const pool = require("../config/db");
const bcrypt = require("bcrypt");

// Find user by email
exports.findUserByEmail = async (email) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0] || null;
};

// Find user by ID
exports.findUserById = async (id) => {
  const result = await pool.query(
    `SELECT id, firstname, lastname, email, phone, role, is_active, petrol_price_per_km, created_by, created_at, updated_at 
     FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

// Create new user
exports.createUser = async (firstname, lastname, email, password, phone = null, role = "admin", petrol_price_per_km = 0, created_by = null) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const result = await pool.query(
    `INSERT INTO users (firstname, lastname, email, password_hash, phone, role, petrol_price_per_km, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
     RETURNING id, firstname, lastname, email, phone, role, petrol_price_per_km, created_by, created_at`,
    [firstname, lastname, email, hashedPassword, phone, role, petrol_price_per_km, created_by]
  );
  
  return result.rows[0];
};

// Verify password
exports.verifyPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// Update user profile
exports.updateUserProfile = async (id, firstname, lastname, phone) => {
  const result = await pool.query(
    `UPDATE users 
     SET firstname = COALESCE($1, firstname), 
         lastname = COALESCE($2, lastname),
         phone = COALESCE($3, phone),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4
     RETURNING id, firstname, lastname, email, phone, role, created_at, updated_at`,
    [firstname, lastname, phone, id]
  );
  
  return result.rows[0] || null;
};

// Get all users created by a specific admin (+ the admin themselves)
exports.getAllUsers = async (adminId) => {
  const result = await pool.query(
    `SELECT id, firstname, lastname, email, phone, role, is_active, petrol_price_per_km, created_by, created_at 
     FROM users 
     WHERE created_by = $1 OR id = $1
     ORDER BY created_at DESC`,
    [adminId]
  );
  
  return result.rows;
};

// Deactivate user (soft delete)
exports.deactivateUser = async (id) => {
  const result = await pool.query(
    `UPDATE users 
     SET is_active = false, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1
     RETURNING id, firstname, lastname, email, is_active`,
    [id]
  );
  
  return result.rows[0] || null;
};

// Activate user
exports.activateUser = async (id) => {
  const result = await pool.query(
    `UPDATE users 
     SET is_active = true, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1
     RETURNING id, firstname, lastname, email, is_active`,
    [id]
  );
  
  return result.rows[0] || null;
};

// Update user by admin (can change role, phone, name, petrol price)
exports.updateUser = async (id, data) => {
  const { firstname, lastname, phone, role, petrol_price_per_km } = data;
  const result = await pool.query(
    `UPDATE users 
     SET firstname = COALESCE($1, firstname), 
         lastname = COALESCE($2, lastname),
         phone = COALESCE($3, phone),
         role = COALESCE($4, role),
         petrol_price_per_km = COALESCE($5, petrol_price_per_km),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $6
     RETURNING id, firstname, lastname, email, phone, role, is_active, petrol_price_per_km, created_at, updated_at`,
    [firstname, lastname, phone, role, petrol_price_per_km ?? null, id]
  );
  
  return result.rows[0] || null;
};
