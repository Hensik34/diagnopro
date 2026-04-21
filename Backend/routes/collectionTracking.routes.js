const express = require("express");
const router = express.Router();
const controller = require("../controllers/collectionTracking.controller");
const { authorize, PERMISSIONS } = require("../middlewere/authorize");

// Staff: get today's own records
router.get("/today", authorize(PERMISSIONS.COLLECTION_READ), controller.getToday);

// Staff: get own records with date filters
router.get("/my-records", authorize(PERMISSIONS.COLLECTION_READ), controller.getMyRecords);

// Admin: salary summary
router.get(
  "/summary",
  authorize(PERMISSIONS.COLLECTION_ADMIN),
  controller.getSummary
);

// Admin: staff list for dropdown
router.get(
  "/staff-list",
  authorize(PERMISSIONS.COLLECTION_ADMIN),
  controller.getStaffList
);

// List all (admin with filters, or staff own)
router.get("/", authorize(PERMISSIONS.COLLECTION_READ), controller.getAll);

// Get single record
router.get("/:id", authorize(PERMISSIONS.COLLECTION_READ), controller.getById);

// Create new record (staff starts day)
router.post("/", authorize(PERMISSIONS.COLLECTION_CREATE), controller.create);

// Update record (staff ends day, admin edits)
router.put(
  "/:id",
  authorize([PERMISSIONS.COLLECTION_UPDATE, PERMISSIONS.COLLECTION_ADMIN]),
  controller.update
);

// Delete record (admin only)
router.delete(
  "/:id",
  authorize(PERMISSIONS.COLLECTION_ADMIN),
  controller.delete
);

module.exports = router;
