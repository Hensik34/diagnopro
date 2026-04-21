const Doctor = require("../models/Doctor");

// GET ALL DOCTORS
exports.getDoctors = async (req, res) => {
  try {
    const { branch_id } = req.query;

    // branch_id is now optional - if provided, filter by branch
    const doctors = await Doctor.getAllDoctors(branch_id || null);

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

    res.json({
      message: "Doctor retrieved successfully",
      data: doctor
    });
  } catch (err) {
    console.error("Get doctor error:", err);
    res.status(500).json({ error: err.message });
  }
};

// CREATE DOCTOR
exports.createDoctor = async (req, res) => {
  try {
    const { title, name, firstname, lastname, email, phone, specialization, license_number, branch_id, commission_percentage } = req.body;

    // Support both old (firstname+lastname) and new (name) formats
    const doctorName = name || (firstname && lastname ? `${firstname} ${lastname}`.trim() : firstname || '');

    // Validation
    if (!doctorName || !phone || !branch_id) {
      return res.status(400).json({ 
        error: "name, phone, and branch_id are required" 
      });
    }

    const doctor = await Doctor.createDoctor({
      title: title || 'Dr',
      name: doctorName,
      email,
      phone,
      specialization,
      license_number,
      branch_id,
      commission_percentage: commission_percentage || 0
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

    const doctor = await Doctor.updateDoctor(id, {
      title,
      name: doctorName,
      email,
      phone,
      specialization,
      license_number,
      branch_id,
      commission_percentage
    });
    

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    res.json({
      message: "Doctor updated successfully",
      data: doctor
    });
  } catch (err) {
    console.error("Update doctor error:", err);
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
