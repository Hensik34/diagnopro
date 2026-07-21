const express = require("express");
const router = express.Router();
const { authorize, PERMISSIONS } = require("../middlewere/authorize");
const sampleController = require("../controllers/sample.controller");

// ==========================================
// SAMPLE ROUTES - RBAC Protected
// ==========================================

// Get all samples (with optional filters: branch_id, status, patient_id)
router.get("/", authorize(PERMISSIONS.SAMPLE_READ), sampleController.getSamples);

// Get next auto-generated sample ID
router.get("/next-id", authorize([PERMISSIONS.SAMPLE_CREATE, PERMISSIONS.SAMPLE_COLLECT, PERMISSIONS.SAMPLE_READ]), sampleController.getNextSampleId);

// Get samples by patient (must be before /:id to avoid route conflict)
router.get("/patient/:patientId", authorize(PERMISSIONS.SAMPLE_READ), sampleController.getSamplesByPatient);

// Get sample by ID
router.get("/:id", authorize(PERMISSIONS.SAMPLE_READ), sampleController.getSampleById);

// Create new sample (includes sample collection)
router.post("/", authorize([PERMISSIONS.SAMPLE_CREATE, PERMISSIONS.SAMPLE_COLLECT]), sampleController.createSample);

// Update sample
router.put("/:id", authorize([PERMISSIONS.SAMPLE_UPDATE, PERMISSIONS.SAMPLE_COLLECT]), sampleController.updateSample);

// Delete sample
router.delete("/:id", authorize(PERMISSIONS.SAMPLE_DELETE), sampleController.deleteSample);

module.exports = router;
