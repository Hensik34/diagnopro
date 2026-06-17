const { B2BLab, Report, Patient } = require("../models");

// ==========================================
// B2B LAB MANAGEMENT (Simplified)
// ==========================================

// Create a B2B partner lab
exports.createLab = async (req, res) => {
  try {
    const { lab_name, contact_person, mobile, email, owner_branch_id } = req.body;

    if (!lab_name) {
      return res.status(400).json({ error: "lab_name is required" });
    }

    const resolvedBranchId = owner_branch_id || req.query.branch_id || req.user.branch_id;

    if (!resolvedBranchId) {
      return res.status(400).json({ error: "owner_branch_id is required" });
    }

    const lab = await B2BLab.create({
      lab_name,
      lab_code: lab_name.replace(/\s+/g, "-").toUpperCase().slice(0, 20) + "-" + Date.now().toString(36).toUpperCase(),
      contact_person: contact_person || null,
      mobile: mobile || null,
      email: email || null,
      owner_branch_id: resolvedBranchId,
      created_by: req.user.id,
    });

    res.status(201).json({ message: "B2B Lab created", data: lab });
  } catch (err) {
    console.error("Create B2B lab error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get all B2B partner labs
exports.getAllLabs = async (req, res) => {
  try {
    const { branch_id } = req.query;
    const { Op } = require("sequelize");
    
    const where = {
      [Op.or]: [{ is_deleted: false }, { is_deleted: null }],
    };

    if (branch_id) {
      where.owner_branch_id = branch_id;
    } else {
      // Auto-filter by user's/doctor's branches if not specified, to prevent cross-branch leakage
      const userId = req.user.id;
      const { Branch } = require("../models");
      const userBranches = await Branch.getUserBranches(userId);
      if (userBranches.length > 0) {
        where.owner_branch_id = { [Op.in]: userBranches.map(b => b.id) };
      }
    }

    const labs = await B2BLab.findAll({
      where,
      order: [["created_at", "DESC"]],
    });
    res.json({ message: "Labs retrieved", data: labs });
  } catch (err) {
    console.error("Get B2B labs error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get B2B lab by ID
exports.getLabById = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const lab = await B2BLab.findOne({
      where: {
        id: req.params.id,
        [Op.or]: [{ is_deleted: false }, { is_deleted: null }],
      },
    });
    if (!lab) {
      return res.status(404).json({ error: "Lab not found" });
    }
    res.json({ message: "Lab retrieved", data: lab });
  } catch (err) {
    console.error("Get B2B lab error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Update B2B lab
exports.updateLab = async (req, res) => {
  try {
    const { lab_name, contact_person, mobile, email, status } = req.body;
    const { Op } = require("sequelize");

    const [count, [updated]] = await B2BLab.update(
      { lab_name, contact_person, mobile, email, status },
      {
        where: {
          id: req.params.id,
          [Op.or]: [{ is_deleted: false }, { is_deleted: null }],
        },
        returning: true,
      }
    );

    if (!updated) {
      return res.status(404).json({ error: "Lab not found" });
    }
    res.json({ message: "Lab updated", data: updated });
  } catch (err) {
    console.error("Update B2B lab error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Delete (soft) B2B lab
exports.deleteLab = async (req, res) => {
  try {
    const [count] = await B2BLab.update(
      { is_deleted: true, deleted_at: new Date() },
      { where: { id: req.params.id } }
    );
    if (!count) {
      return res.status(404).json({ error: "Lab not found" });
    }
    res.json({ message: "Lab deleted" });
  } catch (err) {
    console.error("Delete B2B lab error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get B2B Lab Statement (monthly bill with reports)
exports.getStatement = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    const { Op } = require("sequelize");

    // Validate lab exists
    const lab = await B2BLab.findOne({
      where: {
        id,
        [Op.or]: [{ is_deleted: false }, { is_deleted: null }],
      },
    });

    if (!lab) {
      return res.status(404).json({ error: "Lab not found" });
    }

    // Fetch all reports for this B2B lab within date range

    const startAt = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const endAt = endDate ? new Date(`${endDate}T23:59:59.999`) : null;

    const reports = await Report.findAll({
      where: {
        b2b_lab_id: id,
        status: {
          [Op.in]: ["approved", "completed"],
        },
        ...(startAt && endAt && {
          created_at: {
            [Op.between]: [startAt, endAt],
          },
        }),
      },
      include: [
        {
          model: Patient,
          as: "patient",
          attributes: ["name"],
        },
      ],
      order: [["created_at", "DESC"]],
      raw: true,
    });

    // Calculate summary
    let totalReports = 0;
    let totalAmount = 0;
    let totalCharge = 0;

    const formattedReports = reports.map((report) => {
      const reportAmount = Number(report.report_amount) || 0;
      const b2bCharge = Number(report.b2b_charge) || 0;

      totalReports += 1;
      totalAmount += reportAmount;
      totalCharge += b2bCharge;

      return {
        id: report.id,
        report_date: report.created_at,
        patient_name: report["patient.name"] || "Unknown Patient",
        report_type: report.report_type,
        status: report.status,
        report_amount: reportAmount,
        b2b_charge: b2bCharge,
      };
    });

    res.json({
      message: "B2B lab statement retrieved",
      data: {
        summary: {
          total_reports: totalReports,
          total_amount: totalAmount,
          total_charge: totalCharge,
        },
        reports: formattedReports,
      },
    });
  } catch (err) {
    console.error("Get B2B statement error:", err);
    res.status(500).json({ error: err.message });
  }
};
