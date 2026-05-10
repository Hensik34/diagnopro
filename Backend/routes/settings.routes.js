const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settings.controller");
const { letterheadUpload, ownerSignatureUpload, doctorSignatureUpload, settingsUpload, createMulterUpload } = require("../utils/upload");
const {authorize ,PERMISSIONS }= require("../middlewere/authorize");

// Lab signature upload middleware (reuses settings subfolder)
const labSignatureUpload = createMulterUpload("settings").single("signature");

// ==================
// Settings Routes
// ==================

// GET /api/settings - Get branch settings
router.get(
  "/",
  authorize(PERMISSIONS.SETTINGS_READ),
  settingsController.getSettings
);

// POST /api/settings - Create/update settings (with file uploads)
router.post(
  "/",
  authorize(PERMISSIONS.SETTINGS_UPDATE),
  settingsUpload,
  settingsController.upsertSettings
);

// DELETE /api/settings/image/:field - Remove a specific image (letterhead_url, header_url, footer_url, owner_signature_url, signature_N_url)
router.delete(
  "/image/:field",
  authorize(PERMISSIONS.SETTINGS_UPDATE),
  settingsController.removeImage
);

// PATCH /api/settings/letterhead - Upload letterhead
router.patch(
  "/letterhead",
  authorize(PERMISSIONS.SETTINGS_UPDATE),
  letterheadUpload,
  settingsController.uploadLetterhead
);

// PATCH /api/settings/owner-signature - Upload owner signature (legacy)
router.patch(
  "/owner-signature",
  authorize(PERMISSIONS.SETTINGS_UPDATE),
  ownerSignatureUpload,
  settingsController.uploadOwnerSignature
);

// PATCH /api/settings/signature/:index - Upload lab signature (1-4)
router.patch(
  "/signature/:index",
  authorize(PERMISSIONS.SETTINGS_UPDATE),
  labSignatureUpload,
  settingsController.uploadLabSignature
);

// PUT /api/settings/signature/:index/label - Update signature label
router.put(
  "/signature/:index/label",
  authorize(PERMISSIONS.SETTINGS_UPDATE),
  settingsController.updateSignatureLabel
);

// PUT /api/settings/default-signature - Update default signature index
router.put(
  "/default-signature",
  authorize(PERMISSIONS.SETTINGS_UPDATE),
  settingsController.updateDefaultSignature
);

// PATCH /api/doctors/:doctorId/signature - Upload doctor signature
router.patch(
  "/doctors/:doctorId/signature",
  authorize(PERMISSIONS.SETTINGS_UPDATE),
  doctorSignatureUpload,
  settingsController.uploadDoctorSignature
);

module.exports = router;