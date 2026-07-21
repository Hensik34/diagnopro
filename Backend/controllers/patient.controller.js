const Patient = require("../models/Patient");

// GET ALL PATIENTS
exports.getPatients = async (req, res) => {
  try {
    const { branch_id, search, created_by, today_only } = req.query;
    const targetBranchId = req.headers['x-branch-id'] || branch_id;

    const patients = await Patient.getAllPatients({
      branch_id: targetBranchId,
      search,
      created_by,
      today_only: today_only === "true" || today_only === true,
    });

    const formatted = patients.map(p => {
      const pJson = p.toJSON ? p.toJSON() : p;
      return {
        ...pJson,
        created_by_name: pJson.creator ? `${pJson.creator.firstname} ${pJson.creator.lastname}` : 'System',
        creator_role: pJson.creator?.role || 'user',
        branch_name: pJson.branch ? pJson.branch.name : 'Unknown Branch',
      };
    });

    res.json({
      message: "Patients retrieved successfully",
      count: formatted.length,
      data: formatted
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
    const { name, email, phone, age, age_unit, gender, address, city, state, postal_code, blood_type, branch_id } = req.body;

    const targetBranchId = branch_id || req.user.branch_id;

    // Validation
    if (!name || age == null || !gender || !targetBranchId) {
      return res.status(400).json({ 
        error: "name, age, gender, and branch_id are required" 
      });
    }

    const patient = await Patient.createPatient({
      name,
      email,
      phone: phone || "",
      age,
      age_unit,
      gender,
      address,
      city,
      state,
      postal_code,
      blood_type,
      branch_id: targetBranchId,
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
    const { name, email, phone, age, age_unit, gender, address, city, state, postal_code, blood_type } = req.body;

    const patient = await Patient.updatePatient(id, {
      name,
      email,
      phone,
      age,
      age_unit,
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
