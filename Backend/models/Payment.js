const { fn, col } = require("sequelize");
const { Payment, Report } = require("./index");

// Get all payments for a report
exports.getPaymentsByReportId = async (reportId) => {
  return await Payment.findAll({
    where: { report_id: reportId },
    order: [["created_at", "ASC"]],
    raw: true,
  });
};

// Add a payment to a report
exports.addPayment = async ({ report_id, payment_mode, amount }) => {
  return await Payment.create({ report_id, payment_mode, amount });
};

// Delete a payment by ID
exports.deletePayment = async (id) => {
  const payment = await Payment.findByPk(id);
  if (!payment) return null;
  await payment.destroy();
  return payment.toJSON();
};

// Get total paid for a report
exports.getTotalPaid = async (reportId) => {
  const result = await Payment.findOne({
    where: { report_id: reportId },
    attributes: [[fn("COALESCE", fn("SUM", col("amount")), 0), "total_paid"]],
    raw: true,
  });
  return parseFloat(result?.total_paid) || 0;
};

// Calculate and update payment status on a report
exports.recalcPaymentStatus = async (reportId) => {
  const totalPaid = await exports.getTotalPaid(reportId);

  const report = await Report.findByPk(reportId, {
    attributes: ["final_amount"],
    raw: true,
  });
  if (!report) return null;

  const finalAmount = parseFloat(report.final_amount) || 0;

  let paymentStatus = "pending";
  if (totalPaid >= finalAmount && finalAmount > 0) {
    paymentStatus = "paid";
  } else if (totalPaid > 0) {
    paymentStatus = "partial";
  }

  await Report.update({ payment_status: paymentStatus }, { where: { id: reportId } });

  return { totalPaid, finalAmount, paymentStatus };
};
