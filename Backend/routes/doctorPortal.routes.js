const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewere/authorize");
const doctorPortalController = require("../controllers/doctorPortal.controller");

// ==========================================
// DOCTOR PORTAL ROUTES
// All routes require authentication only (role checked inside controller)
// ==========================================

// Dashboard with summary stats
router.get("/dashboard", authenticate, doctorPortalController.getDashboard);

// My reports (paginated, filterable by status)
router.get("/reports", authenticate, doctorPortalController.getMyReports);

// My profile
router.get("/profile", authenticate, doctorPortalController.getMyProfile);

// My commission statement (date range)
router.get("/statement", authenticate, doctorPortalController.getMyStatement);

module.exports = router;
