const express = require("express");
const router = express.Router();
const { authorize, PERMISSIONS } = require("../middlewere/authorize");
const priceListController = require("../controllers/priceList.controller");

// Read price lists
router.get("/", authorize(PERMISSIONS.TEST_READ), priceListController.getPriceLists);
router.get("/:id", authorize(PERMISSIONS.TEST_READ), priceListController.getPriceListById);

// Manage price lists
router.post("/", authorize(PERMISSIONS.TEST_UPDATE), priceListController.createPriceList);
router.put("/:id", authorize(PERMISSIONS.TEST_UPDATE), priceListController.updatePriceList);
router.delete("/:id", authorize(PERMISSIONS.TEST_UPDATE), priceListController.deletePriceList);

// Manage items within a list
router.put("/:id/items", authorize(PERMISSIONS.TEST_UPDATE), priceListController.bulkUpsertItems);
router.delete("/:id/items/:testId", authorize(PERMISSIONS.TEST_UPDATE), priceListController.deleteItem);

module.exports = router;
