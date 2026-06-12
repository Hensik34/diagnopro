const express = require("express");
const router = express.Router();

// Auth routes (public + protected)
router.use("/auth", require("./auth.routes"));

// Protected routes (require authentication)
router.use("/patients", require("./patient.routes"));
router.use("/reports", require("./report.routes"));
router.use("/samples", require("./sample.routes"));
router.use("/tests", require("./test.routes"));
router.use("/test-layouts", require("./layout.routes"));
router.use("/branches", require("./branch.routes"));
router.use("/doctors", require("./doctor.routes"));
router.use("/inventory", require("./inventory.routes"));
router.use("/collection-tracking", require("./collectionTracking.routes"));
router.use("/time-logs", require("./timeLog.routes"));
router.use("/settings", require("./settings.routes"));
router.use("/doctor-portal", require("./doctorPortal.routes"));
router.use("/b2b", require("./b2b.routes"));
router.use("/whatsapp", require("./whatsapp.routes"));

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({ status: "Server is running", timestamp: new Date() });
});

module.exports = router;