const Payment = require("../models/Payment");
const Report = require("../models/Report");
const Branch = require("../models/Branch");
const workflowNotificationService = require("../services/workflowNotification.service");

// POST /reports/:id/payment - Add a payment entry
exports.addPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_mode, amount } = req.body;

    // Validate inputs
    if (!payment_mode || !['cash', 'upi', 'card'].includes(payment_mode)) {
      return res.status(400).json({ error: "payment_mode must be 'cash', 'upi', or 'card'" });
    }

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ error: "amount must be a positive number" });
    }

    // Verify report exists
    const report = await Report.getReportById(id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    // Add the payment
    const payment = await Payment.addPayment({
      report_id: id,
      payment_mode,
      amount: parsedAmount,
    });

    // Recalculate payment status
    const statusInfo = await Payment.recalcPaymentStatus(id);

    const fullReport = await Report.getReportById(id);
    const reportBranch = fullReport?.branch_id
      ? await Branch.getBranchById(fullReport.branch_id)
      : null;

    if (fullReport?.patient_phone) {
      workflowNotificationService.onPaymentConfirmed({
        branchId: fullReport.branch_id,
        patientName: fullReport.patient_name,
        patientPhone: fullReport.patient_phone,
        branchName: reportBranch?.name,
        testName: fullReport.report_type,
        paymentAmount: parsedAmount,
        reportId: id,
        patientId: fullReport.patient_id,
      });
    }

    res.status(201).json({
      message: "Payment added successfully",
      data: {
        payment,
        ...statusInfo,
      },
    });
  } catch (err) {
    console.error("Add payment error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET /reports/:id/payments - Get all payments for a report
exports.getPayments = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify report exists
    const report = await Report.getReportById(id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    const payments = await Payment.getPaymentsByReportId(id);
    const totalPaid = await Payment.getTotalPaid(id);

    res.json({
      message: "Payments retrieved successfully",
      data: {
        payments,
        totalPaid,
        finalAmount: parseFloat(report.final_amount) || 0,
        paymentStatus: report.payment_status || 'pending',
      },
    });
  } catch (err) {
    console.error("Get payments error:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE /reports/:id/payment/:paymentId - Delete a specific payment
exports.deletePayment = async (req, res) => {
  try {
    const { id, paymentId } = req.params;

    const deleted = await Payment.deletePayment(paymentId);
    if (!deleted) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // Recalculate payment status
    const statusInfo = await Payment.recalcPaymentStatus(id);

    res.json({
      message: "Payment deleted successfully",
      data: {
        deleted,
        ...statusInfo,
      },
    });
  } catch (err) {
    console.error("Delete payment error:", err);
    res.status(500).json({ error: err.message });
  }
};

// PATCH /reports/:id/billing - Update discount info and recalculate final amount
exports.updateBilling = async (req, res) => {
  try {
    const { id } = req.params;
    const { base_amount, lab_discount_type, lab_discount_value, doctor_discount } = req.body;

    // Verify report exists
    const report = await Report.getReportById(id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    // Compute values
    const baseAmt = base_amount != null ? parseFloat(base_amount) : parseFloat(report.base_amount) || 0;
    const discType = lab_discount_type || report.lab_discount_type || 'percent';
    const discValue = lab_discount_value != null ? parseFloat(lab_discount_value) : parseFloat(report.lab_discount_value) || 0;
    const docDiscount = doctor_discount != null ? parseFloat(doctor_discount) : parseFloat(report.doctor_discount) || 0;

    // Calculate lab discount
    let labDiscount = 0;
    if (discType === 'percent') {
      labDiscount = (baseAmt * discValue) / 100;
    } else {
      labDiscount = discValue;
    }

    // Final amount
    const finalAmount = Math.max(0, baseAmt - labDiscount - docDiscount);

    // Recalculate doctor commission: commission applies on (base - b2b_charge)
    let doctor_commission = parseFloat(report.doctor_commission) || 0;
    if (report.doctor_id && !report.is_self_report) {
      const { Doctor } = require("../models");
      const doctor = await Doctor.findByPk(report.doctor_id, { attributes: ["commission_percentage"], raw: true });
      if (doctor) {
        const commissionPercent = parseFloat(doctor.commission_percentage) || 0;
        const b2bCharge = parseFloat(report.b2b_charge) || 0;
        const commissionBase = Math.max(0, baseAmt - b2bCharge);
        const originalCommission = (commissionBase * commissionPercent) / 100;
        doctor_commission = Math.max(0, originalCommission - docDiscount);
      }
    }

    // Update report
    const updatedReport = await Report.updateReport(id, {
      base_amount: baseAmt,
      lab_discount_type: discType,
      lab_discount_value: discValue,
      doctor_discount: docDiscount,
      final_amount: finalAmount,
      report_amount: baseAmt,
      doctor_commission: doctor_commission,
    });

    // Recalculate payment status with new final amount
    const statusInfo = await Payment.recalcPaymentStatus(id);

    res.json({
      message: "Billing updated successfully",
      data: {
        ...updatedReport,
        payment_status: statusInfo?.paymentStatus || updatedReport.payment_status,
        total_paid: statusInfo?.totalPaid || 0,
      },
    });
  } catch (err) {
    console.error("Update billing error:", err);
    res.status(500).json({ error: err.message });
  }
};
