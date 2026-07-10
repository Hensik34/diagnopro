const express = require("express");
const router = express.Router();
const { authorize, PERMISSIONS } = require("../middlewere/authorize");
const reportController = require("../controllers/report.controller");
const paymentController = require("../controllers/payment.controller");

// ==========================================
// REPORT ROUTES - RBAC Protected
// ==========================================

// Public report access (no auth required) - read-only for QR scan download
router.get("/public/:id", reportController.getPublicReport);

// Get all reports (with optional filters: patient_id, status, branch_id)
router.get("/", authorize(PERMISSIONS.REPORT_READ), reportController.getReports);


// Get workflow summary (counts by status)
router.get("/summary", authorize(PERMISSIONS.REPORT_READ), reportController.getReportsSummary);

// Get latest WhatsApp delivery notifications (admin/technician)
router.get(
	"/delivery-notifications",
	authorize(PERMISSIONS.REPORT_READ),
	reportController.getDeliveryNotifications,
);

// Get reports by patient (must be before /:id to avoid route conflict)
router.get("/patient/:patientId", authorize(PERMISSIONS.REPORT_READ), reportController.getReportsByPatient);

// Get report by ID
router.get("/:id", authorize(PERMISSIONS.REPORT_READ), reportController.getReportById);

// Download report PDF (server-side Puppeteer render)
router.get("/:id/pdf", authorize(PERMISSIONS.REPORT_READ), reportController.downloadReportPdf);

// Create new report (status: draft)
router.post("/", authorize(PERMISSIONS.REPORT_CREATE), reportController.createReport);

// Update report (findings, recommendations, clinical_notes, test_data)
router.put("/:id", authorize(PERMISSIONS.REPORT_UPDATE), reportController.updateReport);

// ==========================================
// WORKFLOW ENDPOINTS
// ==========================================

// Submit report for review (draft/rejected → under_review)
router.patch("/:id/submit", authorize(PERMISSIONS.REPORT_CREATE), reportController.submitReport);

// Approve report (under_review → approved)
router.patch("/:id/approve", authorize(PERMISSIONS.REPORT_APPROVE), reportController.approveReport);

// Reject report (under_review → rejected)
router.patch("/:id/reject", authorize(PERMISSIONS.REPORT_APPROVE), reportController.rejectReport);

// Revise rejected report (rejected → draft)
router.patch("/:id/revise", authorize(PERMISSIONS.REPORT_UPDATE), reportController.reviseReport);

// Send report via WhatsApp/Email
router.post("/:id/send", authorize(PERMISSIONS.REPORT_READ), reportController.sendReport);

// Generate AI clinical interpretation
router.post("/:id/generate-interpretation", authorize(PERMISSIONS.REPORT_READ), reportController.generateInterpretation);

// ==========================================
// BILLING & PAYMENT ENDPOINTS
// ==========================================

// Add payment to report
router.post("/:id/payment", authorize(PERMISSIONS.REPORT_UPDATE), paymentController.addPayment);

// Get all payments for a report
router.get("/:id/payments", authorize(PERMISSIONS.REPORT_READ), paymentController.getPayments);

// Delete a specific payment
router.delete("/:id/payment/:paymentId", authorize(PERMISSIONS.REPORT_UPDATE), paymentController.deletePayment);

// Update billing (discount info) and recalculate final amount
router.patch("/:id/billing", authorize(PERMISSIONS.REPORT_UPDATE), paymentController.updateBilling);

// ==========================================
// LEGACY ENDPOINTS (for backward compatibility)
// ==========================================

// Update report status (workflow transition)
router.patch("/:id/status", authorize(PERMISSIONS.REPORT_UPDATE), reportController.updateReportStatus);

// Assign technician to report
router.patch("/:id/assign-technician", authorize(PERMISSIONS.REPORT_ASSIGN_TECHNICIAN), reportController.assignTechnician);

// Delete report
router.delete("/:id", authorize(PERMISSIONS.REPORT_DELETE), reportController.deleteReport);


// get delivery status of a report
router.get("/:id/delivery-status", authorize(PERMISSIONS.REPORT_READ), reportController.getDeliveryStatus);

module.exports = router;
