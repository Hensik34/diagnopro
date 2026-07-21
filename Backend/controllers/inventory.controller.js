const Inventory = require("../models/Inventory");

// GET ALL INVENTORY ITEMS
exports.getAll = async (req, res) => {
  try {
    const branch_id = req.headers['x-branch-id'] || req.query.branch_id;
    if (!branch_id) {
      return res.status(400).json({ error: "branch_id is required" });
    }
    const items = await Inventory.getAll(branch_id);
    res.json({
      message: "Inventory retrieved successfully",
      count: items.length,
      data: items,
    });
  } catch (err) {
    console.error("Get inventory error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET ITEM BY ID
exports.getById = async (req, res) => {
  try {
    const item = await Inventory.getById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json({ message: "Item retrieved successfully", data: item });
  } catch (err) {
    console.error("Get inventory item error:", err);
    res.status(500).json({ error: err.message });
  }
};

// CREATE ITEM
exports.create = async (req, res) => {
  try {
    const { name, category, quantity, alert_threshold, branch_id } = req.body;
    const targetBranchId = branch_id || req.headers['x-branch-id'];

    if (!name || !targetBranchId) {
      return res.status(400).json({ error: "name and branch_id are required" });
    }

    const item = await Inventory.create({
      name,
      category,
      quantity,
      alert_threshold,
      branch_id: targetBranchId,
    });

    res.status(201).json({ message: "Item created successfully", data: item });
  } catch (err) {
    console.error("Create inventory error:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE ITEM
exports.update = async (req, res) => {
  try {
    const { name, category, quantity, alert_threshold } = req.body;

    const item = await Inventory.update(req.params.id, {
      name,
      category,
      quantity,
      alert_threshold,
    });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({ message: "Item updated successfully", data: item });
  } catch (err) {
    console.error("Update inventory error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ADD STOCK (restock)
exports.addStock = async (req, res) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: "quantity must be a positive number" });
    }

    const item = await Inventory.addStock(req.params.id, quantity);

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({ message: "Stock added successfully", data: item });
  } catch (err) {
    console.error("Add stock error:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE ITEM
exports.delete = async (req, res) => {
  try {
    const result = await Inventory.delete(req.params.id);

    if (!result) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({ message: "Item deleted successfully", data: result });
  } catch (err) {
    console.error("Delete inventory error:", err);
    res.status(500).json({ error: err.message });
  }
};
