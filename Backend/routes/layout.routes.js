const express = require("express");
const router = express.Router();
const { authorize, PERMISSIONS } = require("../middlewere/authorize");
const layoutController = require("../controllers/layout.controller");

// Get test layout configuration
router.get("/:testId", authorize(PERMISSIONS.TEST_READ), layoutController.getTestLayout);

// Update test layout configuration
router.put("/:testId", authorize(PERMISSIONS.TEST_UPDATE), layoutController.updateTestLayout);

module.exports = router;
