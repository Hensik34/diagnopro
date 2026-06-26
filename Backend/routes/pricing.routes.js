const express = require("express");
const router = express.Router();
const { authorize, PERMISSIONS } = require("../middlewere/authorize");
const pricingController = require("../controllers/pricing.controller");

// Resolve pricing for tests
router.post("/resolve", authorize(PERMISSIONS.TEST_READ), pricingController.resolvePrices);

module.exports = router;
