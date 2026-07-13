const express = require("express");
const router = express.Router();
const { authorize, PERMISSIONS } = require("../middlewere/authorize");
const doctorController = require("../controllers/doctor.controller");
const doctorPriceController = require("../controllers/doctorPrice.controller");

// ==========================================
// DOCTOR ROUTES - RBAC Protected
// ==========================================

// Get all doctors (requires branch_id query param)
router.get("/", authorize([PERMISSIONS.DOCTOR_READ, PERMISSIONS.SETTINGS_READ]), doctorController.getDoctors);

// Get pricing (assigned list + overrides) for a doctor
router.get("/:id/pricing", authorize(PERMISSIONS.DOCTOR_READ), doctorPriceController.getDoctorPricing);

// Manage doctor pricing assignment and overrides
router.put("/:id/pricing/assignment", authorize(PERMISSIONS.DOCTOR_UPDATE), doctorPriceController.assignPriceList);
router.put("/:id/pricing/overrides", authorize(PERMISSIONS.DOCTOR_UPDATE), doctorPriceController.upsertOverrides);
router.delete("/:id/pricing/overrides/:testId", authorize(PERMISSIONS.DOCTOR_UPDATE), doctorPriceController.deleteOverride);

// Get doctor statement (for commission settlement)
router.get("/:id/statement", authorize(PERMISSIONS.DOCTOR_COMMISSION_VIEW), doctorController.getDoctorStatement);

// Get doctor by ID
router.get("/:id", authorize(PERMISSIONS.DOCTOR_READ), doctorController.getDoctorById);

// Create new doctor
router.post("/", authorize(PERMISSIONS.DOCTOR_CREATE), doctorController.createDoctor);

// Set/update doctor login password
router.put("/:id/password", authorize(PERMISSIONS.DOCTOR_UPDATE), doctorController.setDoctorPassword);

// Update doctor
router.put("/:id", authorize(PERMISSIONS.DOCTOR_UPDATE), doctorController.updateDoctor);

// Delete doctor
router.delete("/:id", authorize(PERMISSIONS.DOCTOR_DELETE), doctorController.deleteDoctor);

module.exports = router;

