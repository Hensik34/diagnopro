const pool = require("../config/db");

/**
 * B2B Payment Model — Settlement, partial payments, advance, adjustments, auto-ledger
 */

// ==========================================
// RECORD PAYMENT (with auto-balance update)
// ==========================================

exports.recordPayment = async (data) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { b2b_lab_id, payment_type, amount, payment_mode, reference_number, order_id, notes, created_by } = data;

    // Calculate balance impact
    // credit = lab owes more (order created), debit = we owe lab, settlement = lab paid us, advance = lab paid in advance
    let balanceChange = 0;
    if (payment_type === 'credit') balanceChange = parseFloat(amount);
    else if (payment_type === 'settlement') balanceChange = -parseFloat(amount);
    else if (payment_type === 'advance') balanceChange = -parseFloat(amount);
    else if (payment_type === 'debit') balanceChange = -parseFloat(amount);
    else if (payment_type === 'adjustment') balanceChange = parseFloat(amount); // can be +/-

    // Update lab balance
    const labResult = await client.query(
      `UPDATE b2b_labs SET current_balance = current_balance + $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND is_deleted = false
       RETURNING current_balance`,
      [balanceChange, b2b_lab_id]
    );

    if (!labResult.rows[0]) {
      throw new Error('Lab not found');
    }

    const runningBalance = parseFloat(labResult.rows[0].current_balance);

    // Insert payment record
    const payResult = await client.query(
      `INSERT INTO b2b_payments (
        b2b_lab_id, payment_type, amount, running_balance, payment_mode,
        reference_number, order_id, notes, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [b2b_lab_id, payment_type, amount, runningBalance, payment_mode || null,
       reference_number || null, order_id || null, notes || null, created_by]
    );

    await client.query("COMMIT");
    return payResult.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// ==========================================
// PAYMENT HISTORY & LEDGER
// ==========================================

exports.getPaymentsByLab = async (labId, filters = {}) => {
  let query = `
    SELECT p.*,
           u.firstname as creator_firstname, u.lastname as creator_lastname,
           o.order_code
    FROM b2b_payments p
    LEFT JOIN users u ON p.created_by = u.id
    LEFT JOIN b2b_orders o ON p.order_id = o.id
    WHERE p.b2b_lab_id = $1 AND p.is_deleted = false`;
  const params = [labId];
  let idx = 2;

  if (filters.payment_type) {
    query += ` AND p.payment_type = $${idx++}`;
    params.push(filters.payment_type);
  }
  if (filters.date_from) {
    query += ` AND p.created_at >= $${idx++}`;
    params.push(filters.date_from);
  }
  if (filters.date_to) {
    query += ` AND p.created_at <= $${idx++}`;
    params.push(filters.date_to);
  }

  query += ` ORDER BY p.created_at DESC`;

  if (filters.limit) {
    query += ` LIMIT $${idx++}`;
    params.push(filters.limit);
  }

  const result = await pool.query(query, params);
  return result.rows;
};

exports.getLabLedger = async (labId) => {
  // Get lab info with balance
  const labResult = await pool.query(
    `SELECT id, lab_name, lab_code, current_balance, credit_limit
     FROM b2b_labs WHERE id = $1 AND is_deleted = false`,
    [labId]
  );
  if (!labResult.rows[0]) return null;

  const lab = labResult.rows[0];

  // Summary
  const summaryResult = await pool.query(
    `SELECT
      COALESCE(SUM(CASE WHEN payment_type = 'credit' THEN amount ELSE 0 END), 0) as total_credits,
      COALESCE(SUM(CASE WHEN payment_type = 'settlement' THEN amount ELSE 0 END), 0) as total_settlements,
      COALESCE(SUM(CASE WHEN payment_type = 'advance' THEN amount ELSE 0 END), 0) as total_advances,
      COALESCE(SUM(CASE WHEN payment_type = 'debit' THEN amount ELSE 0 END), 0) as total_debits,
      COUNT(*) as total_transactions
     FROM b2b_payments
     WHERE b2b_lab_id = $1 AND is_deleted = false`,
    [labId]
  );

  return {
    lab,
    summary: summaryResult.rows[0],
    outstanding: parseFloat(lab.current_balance),
    credit_available: parseFloat(lab.credit_limit) - parseFloat(lab.current_balance)
  };
};

// ==========================================
// SETTLEMENT SUMMARY (all labs)
// ==========================================

exports.getSettlementSummary = async (ownerBranchId = null) => {
  let query = `
    SELECT
      l.id, l.lab_name, l.lab_code, l.current_balance, l.credit_limit,
      COALESCE(order_stats.total_orders, 0) as total_orders,
      COALESCE(order_stats.total_collection, 0) as total_collection,
      COALESCE(order_stats.total_processing, 0) as total_processing,
      COALESCE(pay_stats.total_paid, 0) as total_paid
    FROM b2b_labs l
    LEFT JOIN (
      SELECT source_lab_id,
        COUNT(*) as total_orders,
        SUM(total_collection_amount) as total_collection,
        SUM(total_processing_amount) as total_processing
      FROM b2b_orders WHERE is_deleted = false GROUP BY source_lab_id
    ) order_stats ON l.id = order_stats.source_lab_id
    LEFT JOIN (
      SELECT b2b_lab_id, SUM(amount) as total_paid
      FROM b2b_payments WHERE payment_type = 'settlement' AND is_deleted = false
      GROUP BY b2b_lab_id
    ) pay_stats ON l.id = pay_stats.b2b_lab_id
    WHERE l.is_deleted = false`;
  const params = [];

  if (ownerBranchId) {
    query += ` AND l.owner_branch_id = $1`;
    params.push(ownerBranchId);
  }

  query += ` ORDER BY l.current_balance DESC`;

  const result = await pool.query(query, params);
  return result.rows;
};

// ==========================================
// SOFT DELETE
// ==========================================

exports.softDeletePayment = async (id) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Get payment details before deleting
    const payResult = await client.query(
      `SELECT * FROM b2b_payments WHERE id = $1 AND is_deleted = false`, [id]
    );
    if (!payResult.rows[0]) {
      await client.query("ROLLBACK");
      return null;
    }

    const payment = payResult.rows[0];

    // Reverse balance effect
    let reverseAmount = 0;
    if (payment.payment_type === 'credit') reverseAmount = -parseFloat(payment.amount);
    else if (payment.payment_type === 'settlement') reverseAmount = parseFloat(payment.amount);
    else if (payment.payment_type === 'advance') reverseAmount = parseFloat(payment.amount);
    else if (payment.payment_type === 'debit') reverseAmount = parseFloat(payment.amount);

    await client.query(
      `UPDATE b2b_labs SET current_balance = current_balance + $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [reverseAmount, payment.b2b_lab_id]
    );

    // Soft delete
    await client.query(
      `UPDATE b2b_payments SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );

    await client.query("COMMIT");
    return payment;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

module.exports = exports;
