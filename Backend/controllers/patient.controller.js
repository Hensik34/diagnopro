const Patient = require("../models/Patient");

// GET ALL PATIENTS
exports.getPatients = async (req, res) => {
  try {
    const { branch_id, search } = req.query;

    const patients = await Patient.getAllPatients({ branch_id, search });

    res.json({
      message: "Patients retrieved successfully",
      count: patients.length,
      data: patients
    });
  } catch (err) {
    console.error("Get patients error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET PATIENT BY ID
exports.getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await Patient.getPatientById(id);

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    res.json({
      message: "Patient retrieved successfully",
      data: patient
    });
  } catch (err) {
    console.error("Get patient error:", err);
    res.status(500).json({ error: err.message });
  }
};

// CREATE PATIENT
exports.createPatient = async (req, res) => {
  try {
    const { name, email, phone, age, gender, address, city, state, postal_code, blood_type, branch_id } = req.body;

    // Validation
    if (!name || !phone || !branch_id) {
      return res.status(400).json({ 
        error: "name, phone, and branch_id are required" 
      });
    }

    const patient = await Patient.createPatient({
      name,
      email,
      phone,
      age,
      gender,
      address,
      city,
      state,
      postal_code,
      blood_type,
      branch_id,
      created_by: req.user.id // From auth middleware
    });

    res.status(201).json({
      message: "Patient created successfully",
      data: patient
    });
  } catch (err) {
    console.error("Create patient error:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE PATIENT
exports.updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, age, gender, address, city, state, postal_code, blood_type } = req.body;

    const patient = await Patient.updatePatient(id, {
      name,
      email,
      phone,
      age,
      gender,
      address,
      city,
      state,
      postal_code,
      blood_type
    });

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    res.json({
      message: "Patient updated successfully",
      data: patient
    });
  } catch (err) {
    console.error("Update patient error:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE PATIENT
exports.deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Patient.deletePatient(id);

    if (!result) {
      return res.status(404).json({ error: "Patient not found" });
    }

    res.json({
      message: "Patient deleted successfully",
      data: result
    });
  } catch (err) {
    console.error("Delete patient error:", err);
    res.status(500).json({ error: err.message });
  }
};
