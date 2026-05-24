const { Doctor, Report, Patient, User, Sample, sequelize } = require("../models");
const { Op, fn, col } = require("sequelize");

/**
 * Doctor Portal Controller
 * Endpoints for logged-in doctors to see their own data.
 * 
 * Supports two login paths:
 *   1. Direct doctor login (source='doctor') → req.user.id IS the doctor id
 *   2. Legacy user-linked login (source='user') → lookup doctor by user_id
 */

// Helper: resolve doctor record from req.user regardless of login source
async function resolveDoctor(req) {
  const { id, source } = req.user;
  
  if (source === "doctor") {
    // Direct doctor login — id IS the doctor id
    return await Doctor.findByPk(id);
  }
  
  // Legacy: user logged in with doctor role — find doctor by user_id
  return await Doctor.findOne({ where: { user_id: id } });
}

// GET DOCTOR DASHBOARD - Summary stats for the logged-in doctor
exports.getDashboard = async (req, res) => {
  try {
    // Get linked doctor record
    const doctor = await resolveDoctor(req);
    if (!doctor) {
      return res.status(404).json({ error: "No doctor profile linked to your account" });
    }

    // Get stats: total referred reports, total commission, patients referred
    const statsResult = await Report.findOne({
      where: {
        doctor_id: doctor.id,
        is_self_report: false,
      },
      attributes: [
        [fn("COUNT", col("id")), "total_reports"],
        [fn("COUNT", fn("DISTINCT", col("patient_id"))), "total_patients"],
        [fn("COALESCE", fn("SUM", col("report_amount")), 0), "total_revenue"],
        [fn("COALESCE", fn("SUM", col("doctor_commission")), 0), "total_commission"],
        [fn("COUNT", sequelize.literal("CASE WHEN status = 'approved' THEN 1 END")), "approved_reports"],
        [fn("COUNT", sequelize.literal("CASE WHEN status = 'draft' OR status = 'under_review' THEN 1 END")), "pending_reports"],
      ],
      raw: true,
    });

    // Get this month's stats
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthStatsResult = await Report.findOne({
      where: {
        doctor_id: doctor.id,
        is_self_report: false,
        created_at: {
          [Op.gte]: monthStart,
        },
      },
      attributes: [
        [fn("COUNT", col("id")), "month_reports"],
        [fn("COALESCE", fn("SUM", col("report_amount")), 0), "month_revenue"],
        [fn("COALESCE", fn("SUM", col("doctor_commission")), 0), "month_commission"],
      ],
      raw: true,
    });

    // Get recent 5 reports
    const recentReports = await Report.findAll({
      where: {
        doctor_id: doctor.id,
        is_self_report: false,
      },
      attributes: ["id", "status", "report_amount", "doctor_commission", "created_at"],
      include: [
        {
          model: Patient,
          as: "patient",
          attributes: ["name", "phone"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: 5,
    });

    // Format recent reports to match legacy raw query response
    const formattedReports = recentReports.map((r) => {
      const json = r.toJSON();
      return {
        id: json.id,
        status: json.status,
        report_amount: json.report_amount,
        doctor_commission: json.doctor_commission,
        created_at: json.created_at,
        patient_name: json.patient?.name,
        patient_phone: json.patient?.phone,
      };
    });

    res.json({
      message: "Dashboard data retrieved",
      data: {
        doctor: {
          id: doctor.id,
          name: `${doctor.title || 'Dr'}. ${doctor.name}`,
          specialization: doctor.specialization,
          commission_percentage: doctor.commission_percentage,
        },
        allTime: {
          total_reports: parseInt(statsResult?.total_reports) || 0,
          total_patients: parseInt(statsResult?.total_patients) || 0,
          total_revenue: parseFloat(statsResult?.total_revenue) || 0,
          total_commission: parseFloat(statsResult?.total_commission) || 0,
          approved_reports: parseInt(statsResult?.approved_reports) || 0,
          pending_reports: parseInt(statsResult?.pending_reports) || 0,
        },
        thisMonth: {
          reports: parseInt(monthStatsResult?.month_reports) || 0,
          revenue: parseFloat(monthStatsResult?.month_revenue) || 0,
          commission: parseFloat(monthStatsResult?.month_commission) || 0,
        },
        recentReports: formattedReports,
      }
    });
  } catch (err) {
    console.error("Doctor dashboard error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET MY REPORTS - All reports referred by this doctor
exports.getMyReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const doctor = await resolveDoctor(req);
    if (!doctor) {
      return res.status(404).json({ error: "No doctor profile linked to your account" });
    }

    const where = {
      doctor_id: doctor.id,
      is_self_report: false,
    };

    if (status) {
      where.status = status;
    }

    // Count total
    const total = await Report.count({ where });

    // Fetch with pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const reports = await Report.findAll({
      where,
      include: [
        {
          model: Patient,
          as: "patient",
          attributes: ["name", "phone", "gender", "age"],
        },
        {
          model: User,
          as: "technician",
          attributes: ["firstname", "lastname"],
        },
        {
          model: Sample,
          as: "sample",
          attributes: ["sample_id_code", "sample_type"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    // Format reports to match legacy raw query response
    const formattedReports = reports.map((r) => {
      const json = r.toJSON();
      return {
        ...json,
        patient_name: json.patient?.name,
        patient_phone: json.patient?.phone,
        patient_gender: json.patient?.gender,
        patient_age: json.patient?.age,
        technician_firstname: json.technician?.firstname,
        technician_lastname: json.technician?.lastname,
        sample_id_code: json.sample?.sample_id_code,
        sample_type: json.sample?.sample_type,
      };
    });

    res.json({
      message: "Reports retrieved",
      data: formattedReports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      }
    });
  } catch (err) {
    console.error("Doctor reports error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET MY PROFILE - Doctor's own profile info
exports.getMyProfile = async (req, res) => {
  try {
    const doctor = await resolveDoctor(req);
    if (!doctor) {
      return res.status(404).json({ error: "No doctor profile linked to your account" });
    }

    res.json({
      message: "Profile retrieved",
      data: doctor
    });
  } catch (err) {
    console.error("Doctor profile error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET MY STATEMENT - Commission statement for date range
exports.getMyStatement = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ error: "start_date and end_date are required" });
    }

    const doctor = await resolveDoctor(req);
    if (!doctor) {
      return res.status(404).json({ error: "No doctor profile linked to your account" });
    }

    const doctorModel = require("../models/Doctor");
    const [reports, summary] = await Promise.all([
      doctorModel.getDoctorStatement(doctor.id, start_date, end_date + ' 23:59:59'),
      doctorModel.getDoctorStatementSummary(doctor.id, start_date, end_date + ' 23:59:59')
    ]);

    res.json({
      message: "Statement retrieved",
      data: {
        doctor: {
          id: doctor.id,
          name: `${doctor.title || 'Dr'}. ${doctor.name}`,
          phone: doctor.phone,
          email: doctor.email,
          commission_percentage: doctor.commission_percentage
        },
        period: { start_date, end_date },
        summary: {
          total_reports: parseInt(summary.total_reports) || 0,
          total_amount: parseFloat(summary.total_amount) || 0,
          total_commission: parseFloat(summary.total_commission) || 0
        },
        reports
      }
    });
  } catch (err) {
    console.error("Doctor statement error:", err);
    res.status(500).json({ error: err.message });
  }
};
