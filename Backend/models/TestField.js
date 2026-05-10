const pool = require("../config/db");

// Get all fields for a test with optional user-specific overrides
exports.getFieldsByTestId = async (testId, userId = null) => {
  // If userId provided, first check user-specific overrides
  if (userId) {
    const userFields = await pool.query(
      "SELECT * FROM user_test_fields WHERE test_id = $1 AND user_id = $2 ORDER BY order_index, created_at",
      [testId, userId]
    );
    
    // If user has custom fields, return those
    if (userFields.rows.length > 0) {
      return userFields.rows;
    }
  }
  
  // Fallback to global test_fields
  const result = await pool.query(
    "SELECT * FROM test_fields WHERE test_id = $1 ORDER BY order_index, created_at",
    [testId]
  );
  return result.rows;
};

// Get fields for multiple tests with per-test user-specific overrides
exports.getFieldsByTestIds = async (testIds, userId = null) => {
  if (!testIds || testIds.length === 0) return [];
  
  const placeholders = testIds.map((_, i) => `$${i + 1}`).join(', ');
  
  if (userId) {
    // Get user-specific fields for all requested tests
    const userFields = await pool.query(
      `SELECT * FROM user_test_fields WHERE test_id IN (${placeholders}) AND user_id = $${testIds.length + 1} ORDER BY test_id, order_index, created_at`,
      [...testIds, userId]
    );
    
    // Build a set of test_ids that have user overrides
    const userOverrideTestIds = new Set(userFields.rows.map(f => f.test_id));
    
    // Find test_ids that DON'T have user overrides (need defaults)
    const defaultTestIds = testIds.filter(id => !userOverrideTestIds.has(id));
    
    let defaultFields = [];
    if (defaultTestIds.length > 0) {
      const defPlaceholders = defaultTestIds.map((_, i) => `$${i + 1}`).join(', ');
      const defResult = await pool.query(
        `SELECT * FROM test_fields WHERE test_id IN (${defPlaceholders}) ORDER BY test_id, order_index, created_at`,
        defaultTestIds
      );
      defaultFields = defResult.rows;
    }
    
    // Merge: user overrides + defaults for tests without overrides
    return [...userFields.rows, ...defaultFields];
  }
  
  // No userId — return global test_fields
  const result = await pool.query(
    `SELECT * FROM test_fields WHERE test_id IN (${placeholders}) ORDER BY test_id, order_index, created_at`,
    testIds
  );
  return result.rows;
};

// Get a single field by id
exports.getFieldById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM test_fields WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
};

// Bulk set fields for a test (replace all) - admins update global, non-admins get personal overrides
exports.setFieldsForTest = async (testId, fields, userId = null, userRole = null) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // If admin or no userId, work with global test_fields
    if (!userId || userRole === 'admin') {
      // Delete existing global fields
      await client.query("DELETE FROM test_fields WHERE test_id = $1", [testId]);

      // Insert new global fields
      const inserted = [];
      for (let i = 0; i < fields.length; i++) {
        const f = fields[i];
        const result = await client.query(
          `INSERT INTO test_fields (test_id, field_name, unit, min_value, max_value, input_type, options, order_index, field_type, formula, depends_on, section_group)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           RETURNING *`,
          [
            testId,
            f.field_name,
            f.unit || null,
            f.min_value != null ? f.min_value : null,
            f.max_value != null ? f.max_value : null,
            f.input_type || "number",
            f.options || null,
            f.order_index != null ? f.order_index : i,
            f.field_type || "input",
            f.formula || null,
            f.depends_on || null,
            f.section_group || null,
          ]
        );
        inserted.push(result.rows[0]);
      }

      await client.query("COMMIT");
      return inserted;
    }

    // For non-admin users, work with user-specific overrides
    // Delete existing user fields for this test
    await client.query(
      "DELETE FROM user_test_fields WHERE test_id = $1 AND user_id = $2",
      [testId, userId]
    );

    // Insert new user fields
    const inserted = [];
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      const result = await client.query(
        `INSERT INTO user_test_fields (user_id, test_id, field_name, unit, min_value, max_value, input_type, options, order_index, field_type, formula, depends_on, section_group)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          userId,
          testId,
          f.field_name,
          f.unit || null,
          f.min_value != null ? f.min_value : null,
          f.max_value != null ? f.max_value : null,
          f.input_type || "number",
          f.options || null,
          f.order_index != null ? f.order_index : i,
          f.field_type || "input",
          f.formula || null,
          f.depends_on || null,
          f.section_group || null,
        ]
      );
      inserted.push(result.rows[0]);
    }

    await client.query("COMMIT");
    return inserted;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// Add a single field to a test
exports.addField = async (testId, field) => {
  const result = await pool.query(
    `INSERT INTO test_fields (test_id, field_name, unit, min_value, max_value, input_type, options, order_index, field_type, formula, depends_on, section_group)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      testId,
      field.field_name,
      field.unit || null,
      field.min_value != null ? field.min_value : null,
      field.max_value != null ? field.max_value : null,
      field.input_type || "number",
      field.options || null,
      field.order_index != null ? field.order_index : 0,
      field.field_type || "input",
      field.formula || null,
      field.depends_on || null,
      field.section_group || null,
    ]
  );
  return result.rows[0];
};

// Update a single field
exports.updateField = async (id, data) => {
  const result = await pool.query(
    `UPDATE test_fields
     SET field_name = COALESCE($1, field_name),
         unit = COALESCE($2, unit),
         min_value = $3,
         max_value = $4,
         input_type = COALESCE($5, input_type),
         options = $6,
         order_index = COALESCE($7, order_index),
         field_type = COALESCE($8, field_type),
         formula = $9,
         depends_on = $10,
         section_group = $11,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $12
     RETURNING *`,
    [
      data.field_name,
      data.unit,
      data.min_value != null ? data.min_value : null,
      data.max_value != null ? data.max_value : null,
      data.input_type,
      data.options || null,
      data.order_index,
      data.field_type || null,
      data.formula || null,
      data.depends_on || null,
      data.section_group || null,
      id,
    ]
  );
  return result.rows[0] || null;
};

// Delete a single field
exports.deleteField = async (id) => {
  const result = await pool.query(
    "DELETE FROM test_fields WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rows[0] || null;
};
