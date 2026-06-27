const doctorPriceModel = require("../models/DoctorTestPrice");

exports.getDoctorPricing = async (req, res) => {
  try {
    const { branch_id } = req.query;
    if (!branch_id) {
      return res.status(400).json({ error: "branch_id is required" });
    }

    const doctorId = req.params.id;
    const assignment = await doctorPriceModel.getAssignment(doctorId, branch_id);
    const overrides = await doctorPriceModel.getDoctorOverrides(doctorId, branch_id);

    res.json({
      assignment: assignment || null,
      overrides: overrides || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.assignPriceList = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { branch_id, price_list_id } = req.body;
    if (!branch_id) {
      return res.status(400).json({ error: "branch_id is required" });
    }

    if (price_list_id === null || price_list_id === undefined || price_list_id === "") {
      // Unassign
      await doctorPriceModel.removeAssignment(doctorId, branch_id);
      return res.json({ message: "Price list unassigned successfully" });
    }

    const assignment = await doctorPriceModel.assignPriceList(doctorId, branch_id, price_list_id);
    res.json({
      message: "Price list assigned successfully",
      data: assignment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.upsertOverrides = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { branch_id, overrides } = req.body;
    if (!branch_id || !Array.isArray(overrides)) {
      return res.status(400).json({ error: "branch_id and overrides array are required" });
    }

    const results = await doctorPriceModel.upsertOverrides(doctorId, branch_id, overrides);
    res.json({
      message: "Overrides updated successfully",
      data: results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteOverride = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { testId } = req.params;
    const { branch_id } = req.query;

    if (!branch_id) {
      return res.status(400).json({ error: "branch_id is required as a query parameter" });
    }

    const result = await doctorPriceModel.deleteOverride(doctorId, branch_id, testId);
    if (!result) {
      return res.status(404).json({ error: "Override exception not found" });
    }
    res.json({ message: "Override exception deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
