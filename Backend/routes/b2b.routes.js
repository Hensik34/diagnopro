const express = require("express");
const router = express.Router();
const b2bController = require("../controllers/b2b.controller");
const { authorize } = require("../middlewere/authorize");

// ==========================================
// B2B PARTNER LAB MANAGEMENT (Simplified)
// ==========================================
router.post("/labs", authorize('b2b:lab_create'), b2bController.createLab);
router.get("/labs", authorize('b2b:lab_read'), b2bController.getAllLabs);
router.get("/labs/:id", authorize('b2b:lab_read'), b2bController.getLabById);
router.put("/labs/:id", authorize('b2b:lab_update'), b2bController.updateLab);
router.delete("/labs/:id", authorize('b2b:lab_delete'), b2bController.deleteLab);

module.exports = router;
