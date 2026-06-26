const express = require("express");
const router = express.Router();
const { authorize, PERMISSIONS } = require("../middlewere/authorize");
const doctorPriceController = require("../controllers/doctorPrice.controller");

// Get pricing (assigned list + overrides) for a doctor
router.get("/:id/pricing", authorize(PERMISSIONS.DOCTOR_READ), doctorPriceController.getDoctorPricing);

// Manage doctor pricing assignment and overrides
router.put("/:id/pricing/assignment", authorize(PERMISSIONS.DOCTOR_UPDATE), doctorPriceController.assignPriceList);
router.put("/:id/pricing/overrides", authorize(PERMISSIONS.DOCTOR_UPDATE), doctorPriceController.upsertOverrides);
router.delete("/:id/pricing/overrides/:testId", authorize(PERMISSIONS.DOCTOR_UPDATE), doctorPriceController.deleteOverride);

module.exports = router;
