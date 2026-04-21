const express = require("express");
const router = express.Router();
const { authorize, authenticate, PERMISSIONS } = require("../middlewere/authorize");
const timeLogController = require("../controllers/timeLog.controller");

// ==========================================
// Self-service routes (any authenticated user)
// ==========================================

// Clock in
router.post("/clock-in", authenticate, timeLogController.clockIn);

// Clock out
router.post("/clock-out", authenticate, timeLogController.clockOut);

// Get my active session
router.get("/active", authenticate, timeLogController.getActiveSession);

// Get my time logs
router.get("/my-logs", authenticate, timeLogController.getMyLogs);

// ==========================================
// Admin routes
// ==========================================

// Get all logs (admin)
router.get("/all", authorize(PERMISSIONS.TIMELOG_VIEW_ALL), timeLogController.getAllLogs);

// Get user summary (admin)
router.get("/summary", authorize(PERMISSIONS.TIMELOG_VIEW_ALL), timeLogController.getUserSummary);

// Get specific user's logs (admin)
router.get("/user/:userId", authorize(PERMISSIONS.TIMELOG_VIEW_ALL), timeLogController.getUserLogs);

// Delete a time log (admin)
router.delete("/:id", authorize(PERMISSIONS.TIMELOG_DELETE), timeLogController.deleteLog);

module.exports = router;
