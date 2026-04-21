const pool = require("../config/db");

// Get all fields for a test, ordered by order_index
exports.getFieldsByTestId = async (testId) => {
  const result = await pool.query(
    "SELECT * FROM test_fields WHERE test_id = $1 ORDER BY order_index, created_at",
    [testId]
  );
  return result.rows;
};

// Get fields for multiple tests, ordered by test_id then order_index
exports.getFieldsByTestIds = async (testIds) => {
  if (!testIds || testIds.length === 0) return [];
  const placeholders = testIds.map((_, i) => `$${i + 1}`).join(', ');
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

// Bulk set fields for a test (replace all)
exports.setFieldsForTest = async (testId, fields) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Delete existing fields
    await client.query("DELETE FROM test_fields WHERE test_id = $1", [testId]);

    // Insert new fields
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
