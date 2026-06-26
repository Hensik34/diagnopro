const priceListModel = require("../models/PriceList");

exports.getPriceLists = async (req, res) => {
  try {
    const { branch_id, is_active } = req.query;
    const filters = {};
    if (branch_id) filters.branch_id = branch_id;
    if (is_active !== undefined) filters.is_active = is_active === "true";

    const lists = await priceListModel.getAllPriceLists(filters);
    res.json({
      message: "Price lists retrieved successfully",
      data: lists
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPriceListById = async (req, res) => {
  try {
    const list = await priceListModel.getPriceListById(req.params.id);
    if (!list) {
      return res.status(404).json({ error: "Price list not found" });
    }
    res.json({
      message: "Price list retrieved successfully",
      data: list
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createPriceList = async (req, res) => {
  try {
    const { name, branch_id, is_active, version, description, effective_from, effective_to } = req.body;
    if (!name || !branch_id) {
      return res.status(400).json({ error: "Name and branch_id are required" });
    }

    const createdBy = req.user?.id || null;
    const list = await priceListModel.createPriceList({
      name,
      branch_id,
      is_active,
      version,
      description,
      effective_from,
      effective_to,
      created_by: createdBy,
    });
    res.status(201).json({
      message: "Price list created successfully",
      data: list
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePriceList = async (req, res) => {
  try {
    const list = await priceListModel.updatePriceList(req.params.id, req.body);
    if (!list) {
      return res.status(404).json({ error: "Price list not found" });
    }
    res.json({
      message: "Price list updated successfully",
      data: list
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deletePriceList = async (req, res) => {
  try {
    const result = await priceListModel.deletePriceList(req.params.id);
    if (!result) {
      return res.status(404).json({ error: "Price list not found" });
    }
    res.json({ message: "Price list deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.bulkUpsertItems = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Items array is required" });
    }

    await priceListModel.bulkUpsertItems(req.params.id, items);
    const updatedList = await priceListModel.getPriceListById(req.params.id);
    res.json({
      message: "Price list overrides saved successfully",
      data: updatedList
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const { id, testId } = req.params;
    const result = await priceListModel.deleteItem(id, testId);
    if (!result) {
      return res.status(404).json({ error: "Item not found in price list" });
    }
    res.json({ message: "Item removed from price list" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
