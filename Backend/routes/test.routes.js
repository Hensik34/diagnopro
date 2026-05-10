const express = require("express");
const router = express.Router();
const { authorize, PERMISSIONS } = require("../middlewere/authorize");
const testController = require("../controllers/test.controller");

// ==========================================
// TEST ROUTES - RBAC Protected
// ==========================================

// Get all tests (with optional filter: category)
router.get("/", authorize(PERMISSIONS.TEST_READ), testController.getTests);

// Get tests for a sample (must be before /:id to avoid route conflict)
router.get("/sample/:sampleId", authorize(PERMISSIONS.TEST_READ), testController.getTestsForSample);

// Get test by ID
router.get("/:id", authorize(PERMISSIONS.TEST_READ), testController.getTestById);

// Create new test (master list)
router.post("/", authorize(PERMISSIONS.TEST_CREATE), testController.createTest);

// Update test (master list)
router.put("/:id", authorize(PERMISSIONS.TEST_UPDATE), testController.updateTest);

// Delete test (master list)
router.delete("/:id", authorize(PERMISSIONS.TEST_DELETE), testController.deleteTest);

// Add test to sample
router.post("/sample/:sampleId", authorize(PERMISSIONS.TEST_CREATE), testController.addTestToSample);

// Update test result (for sample_tests)
router.patch("/result/:sampleTestId", authorize(PERMISSIONS.TEST_RESULT_UPDATE), testController.updateTestResult);

// Reset user-specific test override (revert to default)
router.delete("/:id/override", authorize(PERMISSIONS.TEST_UPDATE), testController.resetTestOverride);

// ==========================================
// TEST FIELDS (Dynamic Parameters)
// ==========================================

// Get fields for a test
router.get("/:testId/fields", authorize(PERMISSIONS.TEST_READ), testController.getTestFields);

// Get fields for multiple tests
router.post("/fields/multi", authorize(PERMISSIONS.TEST_READ), testController.getMultiTestFields);

// Set (replace) all fields for a test
router.put("/:testId/fields", authorize(PERMISSIONS.TEST_UPDATE), testController.setTestFields);

// Delete a single field
router.delete("/fields/:fieldId", authorize(PERMISSIONS.TEST_DELETE), testController.deleteTestField);

module.exports = router;
