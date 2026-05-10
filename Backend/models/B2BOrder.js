const pool = require("../config/db");
const crypto = require("crypto");

/**
 * B2B Order Model — Order CRUD with per-test tracking, barcode, TAT, partial outsourcing,
 * duplicate prevention, optimistic locking, soft delete, and full transaction support.
 */

// ==========================================
// BARCODE GENERATION
// ==========================================

const generateBarcode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `B2B-${timestamp}-${random}`;
};

const generateOrderCode = () => {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${y}${m}${d}-${rand}`;
};

// ==========================================
// ORDER CRUD
// ==========================================

/**
 * Create a B2B order with tests — fully transactional.
 * Supports partial outsourcing (only outsourced tests go into order).
 * Prevents duplicate test entries via UNIQUE constraint.
 */
exports.createOrder = async (data) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const orderCode = data.order_code || generateOrderCode();
    const barcode = data.barcode || generateBarcode();

    // Insert order
    const orderResult = await client.query(
      `INSERT INTO b2b_orders (
        order_code, source_lab_id, dest_branch_id,
        patient_id, patient_name, patient_age, patient_gender, patient_phone,
        doctor_id, doctor_commission,
        sample_id, barcode, sample_type, container_type, fasting_required,
        collected_by, collection_time, temperature_notes,
        notes, show_processing_lab, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
      RETURNING *`,
      [
        orderCode, data.source_lab_id, data.dest_branch_id,
        data.patient_id, data.patient_name, data.patient_age, data.patient_gender, data.patient_phone,
        data.doctor_id || null, data.doctor_commission || 0,
        data.sample_id || null, barcode, data.sample_type || null, data.container_type || null,
        data.fasting_required || false, data.collected_by || null, data.collection_time || null,
        data.temperature_notes || null, data.notes || null,
        data.show_processing_lab || false, data.created_by
      ]
    );

    const order = orderResult.rows[0];

    // Insert tests
    let totalCollection = 0;
    let totalProcessing = 0;
    const insertedTests = [];

    if (data.tests && data.tests.length > 0) {
      for (const test of data.tests) {
        // Calculate expected completion based on TAT
        let expectedCompletionAt = null;
        if (test.expected_tat_hours) {
          expectedCompletionAt = new Date(Date.now() + test.expected_tat_hours * 60 * 60 * 1000);
        }

        const testResult = await client.query(
          `INSERT INTO b2b_order_tests (
            order_id, test_id, test_name, is_package, parent_test_id,
            collection_price, processing_price,
            expected_tat_hours, expected_completion_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
          RETURNING *`,
          [
            order.id, test.test_id, test.test_name, test.is_package || false,
            test.parent_order_test_id || null,
            test.collection_price || 0, test.processing_price || 0,
            test.expected_tat_hours || null, expectedCompletionAt
          ]
        );

        insertedTests.push(testResult.rows[0]);
        totalCollection += parseFloat(test.collection_price || 0);
        totalProcessing += parseFloat(test.processing_price || 0);
      }
    }

    // Update order totals
    const margin = totalCollection - totalProcessing - parseFloat(data.doctor_commission || 0);
    await client.query(
      `UPDATE b2b_orders SET
        total_collection_amount = $1,
        total_processing_amount = $2,
        margin_amount = $3
       WHERE id = $4`,
      [totalCollection, totalProcessing, margin, order.id]
    );

    // Update lab balance (add to outstanding)
    await client.query(
      `UPDATE b2b_labs SET current_balance = current_balance + $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [totalProcessing, data.source_lab_id]
    );

    await client.query("COMMIT");

    return {
      ...order,
      total_collection_amount: totalCollection,
      total_processing_amount: totalProcessing,
      margin_amount: margin,
      barcode,
      tests: insertedTests
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

exports.getAllOrders = async (filters = {}) => {
  let query = `
    SELECT o.*,
           l.lab_name as source_lab_name, l.lab_code as source_lab_code,
           b.name as dest_branch_name,
           (SELECT COUNT(*) FROM b2b_order_tests ot WHERE ot.order_id = o.id) as test_count,
           (SELECT COUNT(*) FROM b2b_order_tests ot WHERE ot.order_id = o.id AND ot.is_tat_breached = true) as tat_breach_count
    FROM b2b_orders o
    LEFT JOIN b2b_labs l ON o.source_lab_id = l.id
    LEFT JOIN branches b ON o.dest_branch_id = b.id
    WHERE o.is_deleted = false`;
  const params = [];
  let idx = 1;

  if (filters.source_lab_id) {
    query += ` AND o.source_lab_id = $${idx++}`;
    params.push(filters.source_lab_id);
  }
  if (filters.dest_branch_id) {
    query += ` AND o.dest_branch_id = $${idx++}`;
    params.push(filters.dest_branch_id);
  }
  if (filters.status) {
    query += ` AND o.status = $${idx++}`;
    params.push(filters.status);
  }
  if (filters.patient_id) {
    query += ` AND o.patient_id = $${idx++}`;
    params.push(filters.patient_id);
  }
  if (filters.barcode) {
    query += ` AND o.barcode = $${idx++}`;
    params.push(filters.barcode);
  }
  if (filters.date_from) {
    query += ` AND o.created_at >= $${idx++}`;
    params.push(filters.date_from);
  }
  if (filters.date_to) {
    query += ` AND o.created_at <= $${idx++}`;
    params.push(filters.date_to);
  }
  if (filters.owner_branch_id) {
    query += ` AND l.owner_branch_id = $${idx++}`;
    params.push(filters.owner_branch_id);
  }

  query += ` ORDER BY o.created_at DESC`;

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

exports.getOrderById = async (id) => {
  const orderResult = await pool.query(
    `SELECT o.*,
            l.lab_name as source_lab_name, l.lab_code as source_lab_code,
            l.contact_person, l.mobile as lab_mobile,
            b.name as dest_branch_name
     FROM b2b_orders o
     LEFT JOIN b2b_labs l ON o.source_lab_id = l.id
     LEFT JOIN branches b ON o.dest_branch_id = b.id
     WHERE o.id = $1 AND o.is_deleted = false`,
    [id]
  );
  if (!orderResult.rows[0]) return null;

  const order = orderResult.rows[0];

  // Get tests
  const testsResult = await pool.query(
    `SELECT ot.*, t.test_code, t.category
     FROM b2b_order_tests ot
     LEFT JOIN tests t ON ot.test_id = t.id
     WHERE ot.order_id = $1
     ORDER BY ot.created_at`,
    [id]
  );
  order.tests = testsResult.rows;

  return order;
};

exports.getOrderByBarcode = async (barcode) => {
  const result = await pool.query(
    `SELECT * FROM b2b_orders WHERE barcode = $1 AND is_deleted = false`,
    [barcode]
  );
  if (!result.rows[0]) return null;
  return exports.getOrderById(result.rows[0].id);
};

// ==========================================
// ORDER STATUS & UPDATES (with optimistic locking)
// ==========================================

exports.updateOrderField = async (id, data, expectedVersion = null) => {
  const fields = [];
  const values = [];
  let idx = 1;

  const allowedFields = [
    'received_time', 'notes', 'rejection_reason', 'show_processing_lab',
    'sample_type', 'container_type', 'temperature_notes'
  ];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }
  }

  if (fields.length === 0) return exports.getOrderById(id);

  fields.push(`version = version + 1`);
  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  let query = `UPDATE b2b_orders SET ${fields.join(', ')} WHERE id = $${idx} AND is_deleted = false`;
  values.push(id);
  idx++;

  if (expectedVersion != null) {
    query += ` AND version = $${idx}`;
    values.push(expectedVersion);
    idx++;
  }

  query += ` RETURNING *`;
  const result = await pool.query(query, values);

  if (result.rows.length === 0 && expectedVersion != null) {
    throw new Error('CONFLICT: Order was modified by another user. Please refresh and try again.');
  }

  return result.rows[0] || null;
};

exports.receiveOrder = async (id, receivedTime = new Date()) => {
  const result = await pool.query(
    `UPDATE b2b_orders SET
      status = CASE WHEN status = 'pending' OR status = 'sample_sent' THEN 'sample_received' ELSE status END,
      received_time = $1,
      version = version + 1,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 AND is_deleted = false
     RETURNING *`,
    [receivedTime, id]
  );
  return result.rows[0] || null;
};

exports.cancelOrder = async (id, reason, userId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Cancel all pending tests
    await client.query(
      `UPDATE b2b_order_tests SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE order_id = $1 AND status IN ('pending', 'processing')`,
      [id]
    );

    // Update order
    const result = await client.query(
      `UPDATE b2b_orders SET
        status = 'cancelled', rejection_reason = $1,
        version = version + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND is_deleted = false
       RETURNING *`,
      [reason, id]
    );

    // Reverse balance adjustment
    if (result.rows[0]) {
      await client.query(
        `UPDATE b2b_labs SET current_balance = current_balance - $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [result.rows[0].total_processing_amount, result.rows[0].source_lab_id]
      );
    }

    await client.query("COMMIT");
    return result.rows[0] || null;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

exports.softDeleteOrder = async (id) => {
  const result = await pool.query(
    `UPDATE b2b_orders SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP
     WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rows[0] || null;
};

// ==========================================
// PER-TEST STATUS UPDATES
// ==========================================

exports.getOrderTest = async (orderTestId) => {
  const result = await pool.query(
    `SELECT ot.*, t.test_code, t.category, o.source_lab_id, o.order_code
     FROM b2b_order_tests ot
     LEFT JOIN tests t ON ot.test_id = t.id
     LEFT JOIN b2b_orders o ON ot.order_id = o.id
     WHERE ot.id = $1`,
    [orderTestId]
  );
  return result.rows[0] || null;
};

exports.updateTestStatus = async (orderTestId, status, data = {}) => {
  const updates = [`status = $1`, `updated_at = CURRENT_TIMESTAMP`];
  const values = [status];
  let idx = 2;

  if (status === 'completed' || status === 'approved') {
    updates.push(`actual_completion_at = COALESCE(actual_completion_at, CURRENT_TIMESTAMP)`);
  }
  if (data.rejection_reason) {
    updates.push(`rejection_reason = $${idx++}`);
    values.push(data.rejection_reason);
  }
  if (data.report_id) {
    updates.push(`report_id = $${idx++}`);
    values.push(data.report_id);
  }
  if (data.report_version) {
    updates.push(`report_version = $${idx++}`);
    values.push(data.report_version);
  }

  values.push(orderTestId);

  const result = await pool.query(
    `UPDATE b2b_order_tests SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

exports.getOrderTests = async (orderId) => {
  const result = await pool.query(
    `SELECT ot.*, t.test_code, t.category
     FROM b2b_order_tests ot
     LEFT JOIN tests t ON ot.test_id = t.id
     WHERE ot.order_id = $1
     ORDER BY ot.created_at`,
    [orderId]
  );
  return result.rows;
};

// Check for duplicate test in an order
exports.checkDuplicateTest = async (orderId, testId) => {
  const result = await pool.query(
    `SELECT id FROM b2b_order_tests WHERE order_id = $1 AND test_id = $2`,
    [orderId, testId]
  );
  return result.rows.length > 0;
};

// Check for duplicate order for same patient+sample+test
exports.checkDuplicateOrder = async (sourceLabId, patientId, testIds) => {
  if (!testIds || testIds.length === 0) return [];

  const placeholders = testIds.map((_, i) => `$${i + 3}`).join(', ');
  const result = await pool.query(
    `SELECT DISTINCT o.order_code, ot.test_name
     FROM b2b_orders o
     JOIN b2b_order_tests ot ON o.id = ot.order_id
     WHERE o.source_lab_id = $1
       AND o.patient_id = $2
       AND ot.test_id IN (${placeholders})
       AND o.status NOT IN ('cancelled', 'rejected')
       AND o.is_deleted = false
       AND o.created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'`,
    [sourceLabId, patientId, ...testIds]
  );
  return result.rows;
};

// ==========================================
// TAT BREACH DETECTION
// ==========================================

exports.getTATBreachedTests = async (destBranchId = null) => {
  let query = `
    SELECT ot.*, o.order_code, o.source_lab_id, o.barcode,
           l.lab_name as source_lab_name, t.test_code
    FROM b2b_order_tests ot
    JOIN b2b_orders o ON ot.order_id = o.id
    LEFT JOIN b2b_labs l ON o.source_lab_id = l.id
    LEFT JOIN tests t ON ot.test_id = t.id
    WHERE ot.expected_completion_at < CURRENT_TIMESTAMP
      AND ot.actual_completion_at IS NULL
      AND ot.status NOT IN ('completed', 'approved', 'rejected', 'cancelled')
      AND o.is_deleted = false`;
  const params = [];

  if (destBranchId) {
    query += ` AND o.dest_branch_id = $1`;
    params.push(destBranchId);
  }

  query += ` ORDER BY ot.expected_completion_at ASC`;
  const result = await pool.query(query, params);
  return result.rows;
};

// ==========================================
// REPORT VERSIONS
// ==========================================

exports.createReportVersion = async (data, client = null) => {
  const db = client || pool;
  const result = await db.query(
    `INSERT INTO b2b_report_versions (
      order_test_id, report_id, version_number, file_url, report_data,
      status, uploaded_by, uploaded_at, revision_reason
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,CURRENT_TIMESTAMP,$8)
    RETURNING *`,
    [
      data.order_test_id, data.report_id || null, data.version_number || 1,
      data.file_url || null, JSON.stringify(data.report_data || {}),
      data.status || 'uploaded', data.uploaded_by, data.revision_reason || null
    ]
  );
  return result.rows[0];
};

exports.getReportVersions = async (orderTestId) => {
  const result = await pool.query(
    `SELECT rv.*,
            u_up.firstname as uploader_firstname, u_up.lastname as uploader_lastname,
            u_ap.firstname as approver_firstname, u_ap.lastname as approver_lastname
     FROM b2b_report_versions rv
     LEFT JOIN users u_up ON rv.uploaded_by = u_up.id
     LEFT JOIN users u_ap ON rv.approved_by = u_ap.id
     WHERE rv.order_test_id = $1
     ORDER BY rv.version_number DESC`,
    [orderTestId]
  );
  return result.rows;
};

exports.getLatestReportVersion = async (orderTestId) => {
  const result = await pool.query(
    `SELECT * FROM b2b_report_versions
     WHERE order_test_id = $1
     ORDER BY version_number DESC LIMIT 1`,
    [orderTestId]
  );
  return result.rows[0] || null;
};

exports.approveReportVersion = async (versionId, approvedBy) => {
  const result = await pool.query(
    `UPDATE b2b_report_versions SET
      status = 'approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP
     WHERE id = $2 RETURNING *`,
    [approvedBy, versionId]
  );
  return result.rows[0] || null;
};

exports.releaseReportVersion = async (versionId, releasedBy) => {
  const result = await pool.query(
    `UPDATE b2b_report_versions SET
      status = 'released', released_by = $1, released_at = CURRENT_TIMESTAMP
     WHERE id = $2 RETURNING *`,
    [releasedBy, versionId]
  );
  return result.rows[0] || null;
};

// ==========================================
// DASHBOARD STATS
// ==========================================

exports.getDashboardStats = async (ownerBranchId = null, filters = {}) => {
  const params = [];
  let idx = 1;
  let labFilter = '';

  if (ownerBranchId) {
    labFilter = ` AND l.owner_branch_id = $${idx++}`;
    params.push(ownerBranchId);
  }

  // Total orders & amounts
  const statsResult = await pool.query(
    `SELECT
      COUNT(*) as total_orders,
      COUNT(*) FILTER (WHERE o.status = 'pending') as pending_orders,
      COUNT(*) FILTER (WHERE o.status = 'processing') as processing_orders,
      COUNT(*) FILTER (WHERE o.status IN ('completed', 'report_released')) as completed_orders,
      COALESCE(SUM(o.total_collection_amount), 0) as total_revenue,
      COALESCE(SUM(o.total_processing_amount), 0) as total_cost,
      COALESCE(SUM(o.margin_amount), 0) as total_margin,
      COUNT(*) FILTER (WHERE o.status = 'rejected') as rejected_orders
     FROM b2b_orders o
     LEFT JOIN b2b_labs l ON o.source_lab_id = l.id
     WHERE o.is_deleted = false${labFilter}`,
    params
  );

  // Pending payments
  const paymentResult = await pool.query(
    `SELECT
      COALESCE(SUM(CASE WHEN current_balance > 0 THEN current_balance ELSE 0 END), 0) as total_receivable,
      COALESCE(SUM(CASE WHEN current_balance < 0 THEN ABS(current_balance) ELSE 0 END), 0) as total_payable,
      COUNT(*) as total_labs
     FROM b2b_labs
     WHERE is_deleted = false${ownerBranchId ? ` AND owner_branch_id = $1` : ''}`,
    ownerBranchId ? [ownerBranchId] : []
  );

  // TAT breaches
  const tatResult = await pool.query(
    `SELECT COUNT(*) as tat_breaches
     FROM b2b_order_tests ot
     JOIN b2b_orders o ON ot.order_id = o.id
     LEFT JOIN b2b_labs l ON o.source_lab_id = l.id
     WHERE ot.expected_completion_at < CURRENT_TIMESTAMP
       AND ot.actual_completion_at IS NULL
       AND ot.status NOT IN ('completed', 'approved', 'rejected', 'cancelled')
       AND o.is_deleted = false${labFilter}`,
    params
  );

  // Top partner labs
  const topLabsResult = await pool.query(
    `SELECT l.id, l.lab_name, l.lab_code,
       COUNT(o.id) as order_count,
       COALESCE(SUM(o.total_collection_amount), 0) as revenue
     FROM b2b_labs l
     LEFT JOIN b2b_orders o ON l.id = o.source_lab_id AND o.is_deleted = false
     WHERE l.is_deleted = false${ownerBranchId ? ` AND l.owner_branch_id = $1` : ''}
     GROUP BY l.id, l.lab_name, l.lab_code
     ORDER BY revenue DESC
     LIMIT 5`,
    ownerBranchId ? [ownerBranchId] : []
  );

  return {
    ...statsResult.rows[0],
    ...paymentResult.rows[0],
    tat_breaches: parseInt(tatResult.rows[0].tat_breaches),
    top_labs: topLabsResult.rows
  };
};

module.exports = exports;
