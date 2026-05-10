const express = require("express");
const router = express.Router();
const b2bController = require("../controllers/b2b.controller");
const { authorize, authenticate } = require("../middlewere/authorize");

// ==========================================
// B2B LAB MANAGEMENT
// ==========================================
router.post("/labs", authorize('b2b:lab_create'), b2bController.createLab);
router.get("/labs", authorize('b2b:lab_read'), b2bController.getAllLabs);
router.get("/labs/:id", authorize('b2b:lab_read'), b2bController.getLabById);
router.put("/labs/:id", authorize('b2b:lab_update'), b2bController.updateLab);
router.delete("/labs/:id", authorize('b2b:lab_delete'), b2bController.deleteLab);

// ==========================================
// B2B RATE LISTS
// ==========================================
router.get("/labs/:labId/rates", authorize('b2b:lab_read'), b2bController.getRateList);
router.post("/labs/:labId/rates", authorize('b2b:lab_update'), b2bController.upsertRate);
router.put("/labs/:labId/rates/bulk", authorize('b2b:lab_update'), b2bController.bulkUpsertRates);
router.delete("/labs/:labId/rates/:rateId", authorize('b2b:lab_update'), b2bController.deleteRate);

// ==========================================
// B2B ORDERS
// ==========================================
router.post("/orders", authorize('b2b:order_create'), b2bController.createOrder);
router.get("/orders", authorize('b2b:order_read'), b2bController.getAllOrders);
router.get("/orders/:id", authorize('b2b:order_read'), b2bController.getOrderById);
router.get("/orders/barcode/:barcode", authorize('b2b:order_read'), b2bController.getOrderByBarcode);
router.put("/orders/:id", authorize('b2b:order_update'), b2bController.updateOrder);
router.patch("/orders/:id/receive", authorize('b2b:order_update'), b2bController.receiveOrder);
router.patch("/orders/:id/cancel", authorize('b2b:order_update'), b2bController.cancelOrder);

// ==========================================
// PER-TEST STATUS
// ==========================================
router.patch("/order-tests/:testId/status", authorize('b2b:order_update'), b2bController.updateTestStatus);

// ==========================================
// REPORT VERSIONS & APPROVAL FLOW
// ==========================================
router.post("/reports/upload", authorize('b2b:report_upload'), b2bController.uploadReportVersion);
router.get("/reports/:orderTestId/versions", authorize('b2b:order_read'), b2bController.getReportVersions);
router.patch("/reports/versions/:versionId/approve", authorize('b2b:report_approve'), b2bController.approveReport);
router.patch("/reports/versions/:versionId/release", authorize('b2b:report_release'), b2bController.releaseReport);

// ==========================================
// PAYMENTS & SETTLEMENTS
// ==========================================
router.post("/payments", authorize('b2b:payment_create'), b2bController.recordPayment);
router.get("/payments/:labId", authorize('b2b:payment_read'), b2bController.getPayments);
router.get("/ledger/:labId", authorize('b2b:payment_read'), b2bController.getLabLedger);
router.get("/settlements/summary", authorize('b2b:payment_read'), b2bController.getSettlementSummary);
router.delete("/payments/:id", authorize('b2b:payment_delete'), b2bController.deletePayment);

// ==========================================
// DASHBOARD
// ==========================================
router.get("/dashboard", authorize('b2b:dashboard_view'), b2bController.getDashboard);

// ==========================================
// NOTIFICATIONS
// ==========================================
router.get("/notifications", authenticate, b2bController.getNotifications);
router.patch("/notifications/:id/read", authenticate, b2bController.markNotificationRead);
router.patch("/notifications/read-all", authenticate, b2bController.markAllRead);

// ==========================================
// AUDIT LOG
// ==========================================
router.get("/audit", authorize('b2b:audit_view'), b2bController.getAuditLog);

module.exports = router;
