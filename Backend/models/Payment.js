const pool = require("../config/db");

// Get all payments for a report
exports.getPaymentsByReportId = async (reportId) => {
  const result = await pool.query(
    `SELECT * FROM payments WHERE report_id = $1 ORDER BY created_at ASC`,
    [reportId]
  );
  return result.rows;
};

// Add a payment to a report
exports.addPayment = async ({ report_id, payment_mode, amount }) => {
  const result = await pool.query(
    `INSERT INTO payments (report_id, payment_mode, amount)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [report_id, payment_mode, amount]
  );
  return result.rows[0];
};

// Delete a payment by ID
exports.deletePayment = async (id) => {
  const result = await pool.query(
    `DELETE FROM payments WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

// Get total paid for a report
exports.getTotalPaid = async (reportId) => {
  const result = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE report_id = $1`,
    [reportId]
  );
  return parseFloat(result.rows[0].total_paid);
};

// Calculate and update payment status on a report based on payments table
exports.recalcPaymentStatus = async (reportId) => {
  const totalPaid = await exports.getTotalPaid(reportId);

  // Get the final_amount from the report
  const reportResult = await pool.query(
    `SELECT final_amount FROM reports WHERE id = $1`,
    [reportId]
  );
  if (!reportResult.rows[0]) return null;

  const finalAmount = parseFloat(reportResult.rows[0].final_amount) || 0;

  let paymentStatus = 'pending';
  if (totalPaid >= finalAmount && finalAmount > 0) {
    paymentStatus = 'paid';
  } else if (totalPaid > 0) {
    paymentStatus = 'partial';
  }

  await pool.query(
    `UPDATE reports SET payment_status = $1 WHERE id = $2`,
    [paymentStatus, reportId]
  );

  return { totalPaid, finalAmount, paymentStatus };
};
