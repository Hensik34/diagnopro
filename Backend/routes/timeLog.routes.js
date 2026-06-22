const express = require("express");
const router = express.Router();
const { authorize, authenticate, PERMISSIONS } = require("../middlewere/authorize");
const timeLogController = require("../controllers/timeLog.controller");

// ==========================================
// Self-service routes (any authenticated user)
// ==========================================

// Clock in
router.post("/clock-in", authenticate, authorize(PERMISSIONS.TIMELOG_TRACK), timeLogController.clockIn);

// Clock out
router.post("/clock-out", authenticate, authorize(PERMISSIONS.TIMELOG_TRACK), timeLogController.clockOut);

// Get my active session
router.get("/active", authenticate, authorize(PERMISSIONS.TIMELOG_TRACK), timeLogController.getActiveSession);

// Get my time logs
router.get("/my-logs", authenticate, authorize(PERMISSIONS.TIMELOG_TRACK), timeLogController.getMyLogs);

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
