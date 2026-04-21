const express = require("express");
const router = express.Router();
const { authorize, PERMISSIONS } = require("../middlewere/authorize");
const doctorController = require("../controllers/doctor.controller");

// ==========================================
// DOCTOR ROUTES - RBAC Protected
// ==========================================

// Get all doctors (requires branch_id query param)
router.get("/", authorize(PERMISSIONS.DOCTOR_READ), doctorController.getDoctors);

// Get doctor statement (for commission settlement)
router.get("/:id/statement", authorize(PERMISSIONS.DOCTOR_COMMISSION_VIEW), doctorController.getDoctorStatement);

// Get doctor by ID
router.get("/:id", authorize(PERMISSIONS.DOCTOR_READ), doctorController.getDoctorById);

// Create new doctor
router.post("/", authorize(PERMISSIONS.DOCTOR_CREATE), doctorController.createDoctor);

// Update doctor
router.put("/:id", authorize(PERMISSIONS.DOCTOR_UPDATE), doctorController.updateDoctor);

// Delete doctor
router.delete("/:id", authorize(PERMISSIONS.DOCTOR_DELETE), doctorController.deleteDoctor);

module.exports = router;
