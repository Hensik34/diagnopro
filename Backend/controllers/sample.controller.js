const Sample = require("../models/Sample");

// GET ALL SAMPLES
exports.getSamples = async (req, res) => {
  try {
    const { branch_id, status, patient_id } = req.query;

    const samples = await Sample.getAllSamples({ branch_id, status, patient_id });

    res.json({
      message: "Samples retrieved successfully",
      count: samples.length,
      data: samples
    });
  } catch (err) {
    console.error("Get samples error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET SAMPLE BY ID
exports.getSampleById = async (req, res) => {
  try {
    const { id } = req.params;

    const sample = await Sample.getSampleById(id);

    if (!sample) {
      return res.status(404).json({ error: "Sample not found" });
    }

    res.json({
      message: "Sample retrieved successfully",
      data: sample
    });
  } catch (err) {
    console.error("Get sample error:", err);
    res.status(500).json({ error: err.message });
  }
};

// CREATE SAMPLE
exports.createSample = async (req, res) => {
  try {
    const { patient_id, sample_type, collection_date, branch_id, notes } = req.body;
    const collected_by = req.user.id;

    // Validation
    if (!patient_id || !branch_id) {
      return res.status(400).json({ 
        error: "patient_id and branch_id are required" 
      });
    }

    // Auto-generate sample_id_code using monthly-reset counter
    const sampleService = require("../services/sample.service");
    const sample_id_code = await sampleService.generateSampleId(branch_id || req.user?.branch_id);

    const sample = await Sample.createSample({
      patient_id,
      sample_type,
      sample_id_code,
      collection_date: collection_date || new Date(),
      collected_by,
      branch_id,
      notes
    });

    res.status(201).json({
      message: "Sample created successfully",
      data: sample
    });
  } catch (err) {
    console.error("Create sample error:", err);
    if (err.code === '23505') { // Unique violation
      return res.status(400).json({ error: "Sample ID code already exists" });
    }
    res.status(500).json({ error: err.message });
  }
};

// UPDATE SAMPLE
exports.updateSample = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, sample_type } = req.body;

    const sample = await Sample.updateSample(id, {
      status,
      notes,
      sample_type
    });

    if (!sample) {
      return res.status(404).json({ error: "Sample not found" });
    }

    res.json({
      message: "Sample updated successfully",
      data: sample
    });
  } catch (err) {
    console.error("Update sample error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET NEXT SAMPLE ID (preview without incrementing counter)
exports.getNextSampleId = async (req, res) => {
  try {
    const sampleService = require("../services/sample.service");
    const branchId = req.query?.branch_id || req.user?.branch_id;
    const sampleId = await sampleService.peekNextSampleId(branchId);

    res.json({
      message: "Next sample ID preview",
      data: { sample_id: sampleId }
    });
  } catch (err) {
    console.error("Peek sample ID error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET SAMPLES BY PATIENT
exports.getSamplesByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    const samples = await Sample.getSamplesByPatient(patientId);

    res.json({
      message: "Patient samples retrieved successfully",
      count: samples.length,
      data: samples
    });
  } catch (err) {
    console.error("Get patient samples error:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE SAMPLE
exports.deleteSample = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Sample.deleteSample(id);

    if (!result) {
      return res.status(404).json({ error: "Sample not found" });
    }

    res.json({
      message: "Sample deleted successfully",
      data: result
    });
  } catch (err) {
    console.error("Delete sample error:", err);
    res.status(500).json({ error: err.message });
  }
};
