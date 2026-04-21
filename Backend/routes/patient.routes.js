const express = require("express");
const router = express.Router();
const { authorize, PERMISSIONS } = require("../middlewere/authorize");
const patientController = require("../controllers/patient.controller");

// ==========================================
// PATIENT ROUTES - RBAC Protected
// ==========================================

// Get all patients
router.get("/", authorize(PERMISSIONS.PATIENT_READ), patientController.getPatients);

// Create new patient
router.post("/", authorize(PERMISSIONS.PATIENT_CREATE), patientController.createPatient);

// Get patient by ID
router.get("/:id", authorize(PERMISSIONS.PATIENT_READ), patientController.getPatientById);

// Update patient
router.put("/:id", authorize(PERMISSIONS.PATIENT_UPDATE), patientController.updatePatient);

// Delete patient
router.delete("/:id", authorize(PERMISSIONS.PATIENT_DELETE), patientController.deletePatient);

module.exports = router;
