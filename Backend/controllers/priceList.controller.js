const priceListModel = require("../models/PriceList");

exports.getPriceLists = async (req, res) => {
  try {
    const { branch_id, is_active } = req.query;
    const filters = {};
    if (branch_id) filters.branch_id = branch_id;
    if (is_active !== undefined) filters.is_active = is_active === "true";

    const lists = await priceListModel.getAllPriceLists(filters);

    // Fetch associated doctors for the price lists
    let listsWithDoctor = lists;
    if (branch_id) {
      const { DoctorPriceListAssignment, Doctor } = require("../models/index");
      const assignments = await DoctorPriceListAssignment.findAll({
        where: { branch_id },
        include: [{ model: Doctor, as: "doctor", attributes: ["id", "name", "title"] }],
        raw: true,
        nest: true,
      });

      const assignmentsMap = {};
      assignments.forEach((assign) => {
        assignmentsMap[assign.price_list_id] = assign.doctor;
      });

      listsWithDoctor = lists.map((list) => ({
        ...list,
        doctor: assignmentsMap[list.id] || null,
      }));
    }

    res.json({
      message: "Price lists retrieved successfully",
      data: listsWithDoctor
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

    const { DoctorPriceListAssignment, Doctor } = require("../models/index");
    const assignment = await DoctorPriceListAssignment.findOne({
      where: { price_list_id: req.params.id },
      include: [{ model: Doctor, as: "doctor", attributes: ["id", "name", "title"] }],
      raw: true,
      nest: true,
    });

    res.json({
      message: "Price list retrieved successfully",
      data: {
        ...list,
        doctor: assignment?.doctor || null,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createPriceList = async (req, res) => {
  try {
    const { name, branch_id, is_active, version, description, effective_from, effective_to, doctor_id, is_default } = req.body;
    if (!name || !branch_id) {
      return res.status(400).json({ error: "Name and branch_id are required" });
    }

    const { DoctorPriceListAssignment, PriceList, Doctor } = require("../models/index");

    // If setting as default, unset other defaults in this branch
    if (is_default) {
      await PriceList.update({ is_default: false }, { where: { branch_id, is_default: true } });
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
      is_default: !!is_default,
    });

    // Handle doctor assignment if provided
    let assignedDoctor = null;
    if (doctor_id) {
      // Remove any existing assignment for this doctor in this branch (one list per doctor/branch)
      await DoctorPriceListAssignment.destroy({ where: { doctor_id, branch_id } });
      await DoctorPriceListAssignment.create({
        doctor_id,
        branch_id,
        price_list_id: list.id,
      });
      assignedDoctor = await Doctor.findByPk(doctor_id, { attributes: ["id", "name", "title"], raw: true });
    }

    res.status(201).json({
      message: "Price list created successfully",
      data: {
        ...list.toJSON(),
        doctor: assignedDoctor,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePriceList = async (req, res) => {
  try {
    const { name, is_active, version, description, effective_from, effective_to, doctor_id, is_default } = req.body;
    const listId = req.params.id;

    const { DoctorPriceListAssignment, PriceList, Doctor } = require("../models/index");

    const currentList = await PriceList.findByPk(listId);
    if (!currentList) {
      return res.status(404).json({ error: "Price list not found" });
    }

    // If is_default is changing to true
    if (is_default === true) {
      await PriceList.update({ is_default: false }, { where: { branch_id: currentList.branch_id, is_default: true } });
    }

    const updateData = {
      name,
      is_active,
      version,
      description,
      effective_from,
      effective_to,
      is_default: is_default !== undefined ? !!is_default : undefined,
    };

    const list = await priceListModel.updatePriceList(listId, updateData);
    if (!list) {
      return res.status(404).json({ error: "Price list not found" });
    }

    // Handle doctor assignment updates
    if (doctor_id !== undefined) {
      // Delete any existing assignment for this price list
      await DoctorPriceListAssignment.destroy({ where: { price_list_id: listId } });
      
      if (doctor_id && doctor_id !== "") {
        // Also clear any other assignment for this doctor in this branch (one list per doctor/branch)
        await DoctorPriceListAssignment.destroy({ where: { doctor_id, branch_id: currentList.branch_id } });
        await DoctorPriceListAssignment.create({
          doctor_id,
          branch_id: currentList.branch_id,
          price_list_id: listId,
        });
      }
    }

    // Get the updated doctor info
    const assignment = await DoctorPriceListAssignment.findOne({
      where: { price_list_id: listId },
      include: [{ model: Doctor, as: "doctor", attributes: ["id", "name", "title"] }],
      raw: true,
      nest: true,
    });

    res.json({
      message: "Price list updated successfully",
      data: {
        ...list,
        doctor: assignment?.doctor || null,
      }
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
