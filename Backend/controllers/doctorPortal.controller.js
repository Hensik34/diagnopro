const Doctor = require("../models/Doctor");
const Report = require("../models/Report");
const pool = require("../config/db");

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
    return await Doctor.getDoctorById(id);
  }
  
  // Legacy: user logged in with doctor role — find doctor by user_id
  return await Doctor.getDoctorByUserId(id);
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
    const statsResult = await pool.query(
      `SELECT 
         COUNT(*) as total_reports,
         COUNT(DISTINCT r.patient_id) as total_patients,
         COALESCE(SUM(r.report_amount), 0) as total_revenue,
         COALESCE(SUM(r.doctor_commission), 0) as total_commission,
         COUNT(CASE WHEN r.status = 'approved' THEN 1 END) as approved_reports,
         COUNT(CASE WHEN r.status = 'draft' OR r.status = 'under_review' THEN 1 END) as pending_reports
       FROM reports r
       WHERE r.doctor_id = $1 AND r.is_self_report = FALSE`,
      [doctor.id]
    );

    // Get this month's stats
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthStatsResult = await pool.query(
      `SELECT 
         COUNT(*) as month_reports,
         COALESCE(SUM(r.report_amount), 0) as month_revenue,
         COALESCE(SUM(r.doctor_commission), 0) as month_commission
       FROM reports r
       WHERE r.doctor_id = $1 AND r.is_self_report = FALSE
         AND r.created_at >= $2`,
      [doctor.id, monthStart.toISOString()]
    );

    // Get recent 5 reports
    const recentReports = await pool.query(
      `SELECT r.id, r.status, r.report_amount, r.doctor_commission, r.created_at,
              p.name as patient_name, p.phone as patient_phone
       FROM reports r
       JOIN patients p ON r.patient_id = p.id
       WHERE r.doctor_id = $1 AND r.is_self_report = FALSE
       ORDER BY r.created_at DESC
       LIMIT 5`,
      [doctor.id]
    );

    const stats = statsResult.rows[0];
    const monthStats = monthStatsResult.rows[0];

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
          total_reports: parseInt(stats.total_reports) || 0,
          total_patients: parseInt(stats.total_patients) || 0,
          total_revenue: parseFloat(stats.total_revenue) || 0,
          total_commission: parseFloat(stats.total_commission) || 0,
          approved_reports: parseInt(stats.approved_reports) || 0,
          pending_reports: parseInt(stats.pending_reports) || 0,
        },
        thisMonth: {
          reports: parseInt(monthStats.month_reports) || 0,
          revenue: parseFloat(monthStats.month_revenue) || 0,
          commission: parseFloat(monthStats.month_commission) || 0,
        },
        recentReports: recentReports.rows,
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

    let query = `
      SELECT r.*, 
             p.name as patient_name, p.phone as patient_phone,
             p.gender as patient_gender, p.age as patient_age,
             t.firstname as technician_firstname, t.lastname as technician_lastname,
             s.sample_id_code, s.sample_type
      FROM reports r
      LEFT JOIN patients p ON r.patient_id = p.id
      LEFT JOIN users t ON r.technician_id = t.id
      LEFT JOIN samples s ON r.sample_id = s.id
      WHERE r.doctor_id = $1 AND r.is_self_report = FALSE`;
    
    const params = [doctor.id];
    let paramIndex = 2;

    if (status) {
      query += ` AND r.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Count total
    const countQuery = query.replace(/SELECT r\.\*[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total) || 0;

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY r.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    res.json({
      message: "Reports retrieved",
      data: result.rows,
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

    const [reports, summary] = await Promise.all([
      Doctor.getDoctorStatement(doctor.id, start_date, end_date + ' 23:59:59'),
      Doctor.getDoctorStatementSummary(doctor.id, start_date, end_date + ' 23:59:59')
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
