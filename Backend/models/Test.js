const pool = require("../config/db");

// Get all tests for a branch with optional user-specific overrides
exports.getAllTests = async (branchId, userId = null) => {
  // If userId provided, join with user_tests to get user-specific overrides
  if (userId) {
    const result = await pool.query(
      `SELECT 
        t.id,
        COALESCE(ut.test_name, t.test_name) AS test_name,
        COALESCE(ut.category, t.category) AS category,
        COALESCE(ut.sample_type, t.sample_type) AS sample_type,
        COALESCE(ut.price, t.price) AS price,
        COALESCE(ut.turnaround_time, t.turnaround_time) AS turnaround_time,
        COALESCE(ut.description, t.description) AS description,
        t.test_code,
        t.branch_id,
        t.created_at,
        t.updated_at,
        -- Include user override info for UI
        CASE WHEN ut.id IS NOT NULL THEN true ELSE false END AS has_user_override
      FROM tests t
      LEFT JOIN user_tests ut 
        ON ut.test_id = t.id AND ut.user_id = $1
      ORDER BY t.category, COALESCE(ut.test_name, t.test_name)`,
      [userId]
    );
    return result.rows;
  }

  // Original behavior without userId
  const result = await pool.query(
    "SELECT * FROM tests ORDER BY category, test_name"
  );
  return result.rows;
};

// Get test by ID with optional user-specific override
exports.getTestById = async (id, userId = null) => {
  // If userId provided, join with user_tests to get user-specific overrides
  if (userId) {
    const result = await pool.query(
      `SELECT 
        t.id,
        COALESCE(ut.test_name, t.test_name) AS test_name,
        COALESCE(ut.category, t.category) AS category,
        COALESCE(ut.sample_type, t.sample_type) AS sample_type,
        COALESCE(ut.price, t.price) AS price,
        COALESCE(ut.turnaround_time, t.turnaround_time) AS turnaround_time,
        COALESCE(ut.description, t.description) AS description,
        t.test_code,
        t.branch_id,
        t.created_at,
        t.updated_at,
        CASE WHEN ut.id IS NOT NULL THEN true ELSE false END AS has_user_override
      FROM tests t
      LEFT JOIN user_tests ut 
        ON ut.test_id = t.id AND ut.user_id = $2
      WHERE t.id = $1`,
      [id, userId]
    );
    return result.rows[0] || null;
  }

  // Original behavior
  const result = await pool.query(
    "SELECT * FROM tests WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
};

// Create new test
exports.createTest = async (testData) => {
  const { test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id } = testData;
  
  const result = await pool.query(
    `INSERT INTO tests (test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id]
  );
  
  return result.rows[0];
};

// Update test - supports user-specific override when userId is provided
// Admins always update global test; non-admins can have personal overrides
exports.updateTest = async (id, testData, userId = null, userRole = null) => {
  const { test_name, category, sample_type, price, turnaround_time, description } = testData;
  
  // If admin or no userId, update global test (not user override)
  if (!userId || userRole === 'admin') {
    // Update global test
    const result = await pool.query(
      `UPDATE tests 
       SET test_name = COALESCE($1, test_name),
           category = COALESCE($2, category),
           sample_type = COALESCE($3, sample_type),
           price = COALESCE($4, price),
           turnaround_time = COALESCE($5, turnaround_time),
           description = COALESCE($6, description),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [test_name, category, sample_type, price, turnaround_time, description, id]
    );
    return result.rows[0] || null;
  }
  
  // For non-admin users, create/update user-specific override
  const result = await pool.query(
    `INSERT INTO user_tests (user_id, test_id, test_name, category, sample_type, price, turnaround_time, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (user_id, test_id)
     DO UPDATE SET
       test_name = COALESCE($9, user_tests.test_name),
       category = COALESCE($10, user_tests.category),
       sample_type = COALESCE($11, user_tests.sample_type),
       price = COALESCE($12, user_tests.price),
       turnaround_time = COALESCE($13, user_tests.turnaround_time),
       description = COALESCE($14, user_tests.description),
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [userId, id, test_name, category, sample_type, price, turnaround_time, description,
     test_name, category, sample_type, price, turnaround_time, description]
  );
  return result.rows[0];
};

// Delete test
exports.deleteTest = async (id) => {
  const result = await pool.query(
    "DELETE FROM tests WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rows[0] || null;
};

// Get tests by category for a branch with optional user-specific overrides
exports.getTestsByCategory = async (category, branchId, userId = null) => {
  if (userId) {
    const result = await pool.query(
      `SELECT 
        t.id,
        COALESCE(ut.test_name, t.test_name) AS test_name,
        COALESCE(ut.category, t.category) AS category,
        COALESCE(ut.sample_type, t.sample_type) AS sample_type,
        COALESCE(ut.price, t.price) AS price,
        COALESCE(ut.turnaround_time, t.turnaround_time) AS turnaround_time,
        COALESCE(ut.description, t.description) AS description,
        t.test_code,
        t.branch_id,
        t.created_at,
        t.updated_at,
        CASE WHEN ut.id IS NOT NULL THEN true ELSE false END AS has_user_override
      FROM tests t
      LEFT JOIN user_tests ut 
        ON ut.test_id = t.id AND ut.user_id = $2
      WHERE COALESCE(ut.category, t.category) = $1
      ORDER BY COALESCE(ut.test_name, t.test_name)`,
      [category, userId]
    );
    return result.rows;
  }

  const result = await pool.query(
    "SELECT * FROM tests WHERE category = $1 ORDER BY test_name",
    [category]
  );
  return result.rows;
};

// Get tests for a sample
exports.getTestsForSample = async (sampleId) => {
  const result = await pool.query(
    `SELECT st.*, t.test_name, t.test_code, t.category
     FROM sample_tests st
     JOIN tests t ON st.test_id = t.id
     WHERE st.sample_id = $1
     ORDER BY st.created_at DESC`,
    [sampleId]
  );
  
  return result.rows;
};

// Add test to sample
exports.addTestToSample = async (sampleId, testId) => {
  const result = await pool.query(
    `INSERT INTO sample_tests (sample_id, test_id)
     VALUES ($1, $2)
     ON CONFLICT (sample_id, test_id) DO NOTHING
     RETURNING *`,
    [sampleId, testId]
  );
  
  return result.rows[0] || null;
};

// Update test result
exports.updateTestResult = async (sampleTestId, resultData) => {
  const { result, result_unit, reference_range, performed_by } = resultData;
  
  const updateResult = await pool.query(
    `UPDATE sample_tests 
     SET result = COALESCE($1, result),
         result_unit = COALESCE($2, result_unit),
         reference_range = COALESCE($3, reference_range),
         performed_by = COALESCE($4, performed_by),
         status = 'completed',
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $5
     RETURNING *`,
    [result, result_unit, reference_range, performed_by, sampleTestId]
  );
  
  return updateResult.rows[0] || null;
};

// Clone all default tests (from the first branch) to a new branch
exports.cloneTestsForBranch = async (sourceBranchId, targetBranchId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Get all tests from source branch
    const sourceTests = await client.query(
      "SELECT * FROM tests WHERE branch_id = $1",
      [sourceBranchId]
    );

    for (const test of sourceTests.rows) {
      // Check if test already exists in target branch
      const existing = await client.query(
        "SELECT id FROM tests WHERE test_code = $1 AND branch_id = $2",
        [test.test_code, targetBranchId]
      );
      if (existing.rows.length > 0) continue;

      // Clone the test
      const newTest = await client.query(
        `INSERT INTO tests (test_name, test_code, category, sample_type, price, turnaround_time, description, branch_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [test.test_name, test.test_code, test.category, test.sample_type, test.price, test.turnaround_time, test.description, targetBranchId]
      );

      // Clone test fields
      const fields = await client.query(
        "SELECT * FROM test_fields WHERE test_id = $1 ORDER BY order_index",
        [test.id]
      );

      for (const field of fields.rows) {
        await client.query(
          `INSERT INTO test_fields (test_id, field_name, unit, min_value, max_value, input_type, options, order_index, field_type, formula, depends_on, section_group)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [newTest.rows[0].id, field.field_name, field.unit, field.min_value, field.max_value, field.input_type, field.options, field.order_index, field.field_type, field.formula, field.depends_on, field.section_group]
        );
      }
    }

    await client.query("COMMIT");
    return true;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// Reset user-specific override for a test (revert to global defaults)
exports.resetUserOverride = async (testId, userId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Delete user test override
    await client.query(
      "DELETE FROM user_tests WHERE test_id = $1 AND user_id = $2",
      [testId, userId]
    );

    // Delete user test field overrides
    await client.query(
      "DELETE FROM user_test_fields WHERE test_id = $1 AND user_id = $2",
      [testId, userId]
    );

    await client.query("COMMIT");
    return true;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
