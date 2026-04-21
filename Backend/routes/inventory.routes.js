const express = require("express");
const router = express.Router();
const { authorize, PERMISSIONS } = require("../middlewere/authorize");
const inventoryController = require("../controllers/inventory.controller");

// Get all inventory items
router.get("/", authorize(PERMISSIONS.INVENTORY_READ), inventoryController.getAll);

// Get item by ID
router.get("/:id", authorize(PERMISSIONS.INVENTORY_READ), inventoryController.getById);

// Create new item
router.post("/", authorize(PERMISSIONS.INVENTORY_CREATE), inventoryController.create);

// Update item
router.put("/:id", authorize(PERMISSIONS.INVENTORY_UPDATE), inventoryController.update);

// Add stock (restock)
router.patch("/:id/restock", authorize(PERMISSIONS.INVENTORY_UPDATE), inventoryController.addStock);

// Delete item
router.delete("/:id", authorize(PERMISSIONS.INVENTORY_DELETE), inventoryController.delete);

module.exports = router;
