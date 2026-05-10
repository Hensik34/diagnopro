const Doctor = require("../models/Doctor");
const Branch = require("../models/Branch");
const User = require("../models/User");
const pool = require("../config/db");

// GET ALL DOCTORS
exports.getDoctors = async (req, res) => {
  try {
    const { branch_id } = req.query;
    const userId = req.user.id;
    const source = req.user.source;

    let branchFilter = branch_id || null;

    // If no branch_id provided, auto-filter by user's/doctor's branches
    if (!branchFilter) {
      let userBranches;
      if (source === "doctor") {
        userBranches = await Doctor.getDoctorBranches(userId);
      } else {
        userBranches = await Branch.getUserBranches(userId);
      }

      if (userBranches.length === 1) {
        branchFilter = userBranches[0].id;
      } else if (userBranches.length > 1) {
        // For multi-branch users, get doctors from all their branches
        const allDoctors = [];
        const seenIds = new Set();
        for (const branch of userBranches) {
          const docs = await Doctor.getAllDoctors(branch.id);
          for (const doc of docs) {
            if (!seenIds.has(doc.id)) {
              seenIds.add(doc.id);
              allDoctors.push(doc);
            }
          }
        }
        return res.json({
          message: "Doctors retrieved successfully",
          count: allDoctors.length,
          data: allDoctors
        });
      }
    }

    const doctors = await Doctor.getAllDoctors(branchFilter);

    res.json({
      message: "Doctors retrieved successfully",
      count: doctors.length,
      data: doctors
    });
  } catch (err) {
    console.error("Get doctors error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET DOCTOR BY ID
exports.getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.getDoctorById(id);

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    // Also get doctor's branches
    const branches = await Doctor.getDoctorBranches(id);

    res.json({
      message: "Doctor retrieved successfully",
      data: { ...doctor, branches }
    });
  } catch (err) {
    console.error("Get doctor error:", err);
    res.status(500).json({ error: err.message });
  }
};

// CREATE DOCTOR
// Doctors are now created directly in the doctors table with optional password
// No longer creates a mirror user record
exports.createDoctor = async (req, res) => {
  try {
    const { title, name, firstname, lastname, email, phone, specialization, license_number, branch_id, commission_percentage, password } = req.body;

    // Support both old (firstname+lastname) and new (name) formats
    const doctorName = name || (firstname && lastname ? `${firstname} ${lastname}`.trim() : firstname || '');

    // Validation
    if (!doctorName || !phone || !branch_id) {
      return res.status(400).json({ 
        error: "name, phone, and branch_id are required" 
      });
    }

    // If email provided, check uniqueness across both users and doctors
    if (email) {
      const existingUser = await User.findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "This email is already registered as a user. Use a different email." });
      }

      const existingDoctor = await Doctor.findDoctorByEmail(email);
      if (existingDoctor) {
        return res.status(400).json({ error: "This email is already registered as a doctor. Use a different email." });
      }
    }

    const doctor = await Doctor.createDoctor({
      title: title || 'Dr',
      name: doctorName,
      email,
      phone,
      specialization,
      license_number,
      branch_id,
      commission_percentage: commission_percentage || 0,
      password  // Will be hashed inside the model if provided
    });

    res.status(201).json({
      message: "Doctor created successfully",
      data: doctor
    });
  } catch (err) {
    console.error("Create doctor error:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE DOCTOR
exports.updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, name, firstname, lastname, email, phone, specialization, license_number, branch_id, commission_percentage } = req.body;

    // Support both old and new formats
    const doctorName = name || (firstname && lastname ? `${firstname} ${lastname}`.trim() : undefined);

    // Get current doctor
    const currentDoctor = await Doctor.getDoctorById(id);
    if (!currentDoctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    // If email is changing, check uniqueness
    if (email && email !== currentDoctor.email) {
      const existingUser = await User.findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "This email is already registered as a user." });
      }

      const existingDoctor = await Doctor.findDoctorByEmail(email);
      if (existingDoctor && existingDoctor.id !== id) {
        return res.status(400).json({ error: "This email is already registered as another doctor." });
      }
    }

    const doctor = await Doctor.updateDoctor(id, {
      title,
      name: doctorName,
      email,
      phone,
      specialization,
      license_number,
      branch_id,
      commission_percentage,
    });

    res.json({
      message: "Doctor updated successfully",
      data: doctor
    });
  } catch (err) {
    console.error("Update doctor error:", err);
    res.status(500).json({ error: err.message });
  }
};

// SET DOCTOR PASSWORD - Create or update login credentials for a doctor
// Now updates doctors.password_hash directly instead of creating a user record
exports.setDoctorPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 4) {
      return res.status(400).json({ error: "Password must be at least 4 characters" });
    }

    const doctor = await Doctor.getDoctorById(id);
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    if (!doctor.email) {
      return res.status(400).json({ error: "Doctor must have an email before setting a password" });
    }

    // Update password directly on the doctor record
    await Doctor.updateDoctorPassword(id, password);

    res.json({ message: "Doctor login credentials updated successfully" });
  } catch (err) {
    console.error("Set doctor password error:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE DOCTOR
exports.deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Doctor.deleteDoctor(id);

    if (!result) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    res.json({
      message: "Doctor deleted successfully",
      data: result
    });
  } catch (err) {
    console.error("Delete doctor error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET DOCTOR STATEMENT (for settlement)
exports.getDoctorStatement = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    // Validate dates
    if (!start_date || !end_date) {
      return res.status(400).json({ 
        error: "start_date and end_date are required (YYYY-MM-DD format)" 
      });
    }

    // Check if doctor exists
    const doctor = await Doctor.getDoctorById(id);
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    // Get statement data and summary
    const [reports, summary] = await Promise.all([
      Doctor.getDoctorStatement(id, start_date, end_date + ' 23:59:59'),
      Doctor.getDoctorStatementSummary(id, start_date, end_date + ' 23:59:59')
    ]);

    res.json({
      message: "Doctor statement retrieved successfully",
      data: {
        doctor: {
          id: doctor.id,
          name: `${doctor.title || 'Dr'}. ${doctor.name}`,
          phone: doctor.phone,
          email: doctor.email,
          commission_percentage: doctor.commission_percentage
        },
        period: {
          start_date,
          end_date
        },
        summary: {
          total_reports: parseInt(summary.total_reports) || 0,
          total_amount: parseFloat(summary.total_amount) || 0,
          total_commission: parseFloat(summary.total_commission) || 0
        },
        reports
      }
    });
  } catch (err) {
    console.error("Get doctor statement error:", err);
    res.status(500).json({ error: err.message });
  }
};
