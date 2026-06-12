const Report = require("../models/Report");
const reportService = require("../services/report.service");
const sampleService = require("../services/sample.service");
const Sample = require("../models/Sample");
const Branch = require("../models/Branch");
const Doctor = require("../models/Doctor");
const aiService = require("../services/ai.service");
const workflowNotificationService = require("../services/workflowNotification.service");
const { Patient, UserTest } = require("../models");

// Use the new status from service
const { REPORT_STATUS, STATUS_TRANSITIONS, isEditable } = reportService;

// Legacy status mapping for backward compatibility
const REPORT_STATUSES = {
  CREATED: 'created',
  COLLECTED: 'collected',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  APPROVED: 'approved',
  // New statuses
  DRAFT: 'draft',
  UNDER_REVIEW: 'under_review',
  REJECTED: 'rejected'
};

const LEGACY_STATUS_TRANSITIONS = {
  [REPORT_STATUSES.CREATED]: [REPORT_STATUSES.COLLECTED],
  [REPORT_STATUSES.COLLECTED]: [REPORT_STATUSES.PROCESSING],
  [REPORT_STATUSES.PROCESSING]: [REPORT_STATUSES.COMPLETED],
  [REPORT_STATUSES.COMPLETED]: [REPORT_STATUSES.APPROVED],
  [REPORT_STATUSES.APPROVED]: [],
  // New workflow
  [REPORT_STATUSES.DRAFT]: [REPORT_STATUSES.UNDER_REVIEW],
  [REPORT_STATUSES.UNDER_REVIEW]: [REPORT_STATUSES.APPROVED, REPORT_STATUSES.REJECTED],
  [REPORT_STATUSES.REJECTED]: [REPORT_STATUSES.DRAFT]
};

// Helper to inject layout config snapshots into test_data
const injectLayoutSnapshots = async (test_data, branchId) => {
  if (!test_data) return test_data;
  
  // Make a copy of test_data
  const updatedTestData = { ...test_data };
  
  let testIds = [];
  if (Array.isArray(updatedTestData.testIds)) {
    testIds = updatedTestData.testIds;
  } else if (Array.isArray(updatedTestData.tests)) {
    testIds = updatedTestData.tests.map(t => t.id || t.testId).filter(Boolean);
  }
  
  if (testIds.length === 0) {
    return updatedTestData;
  }
  
  const layoutSnapshots = {};
  for (const testId of testIds) {
    if (!testId) continue;
    try {
      const userTest = await UserTest.findOne({
        where: { test_id: testId, branch_id: branchId },
        raw: true
      });
      if (userTest && userTest.layout_config) {
        layoutSnapshots[testId] = userTest.layout_config;
      }
    } catch (err) {
      console.error(`Failed to load layout config for test ${testId}:`, err);
    }
  }
  
  updatedTestData.layout_snapshots = layoutSnapshots;
  return updatedTestData;
};

// Validate status transition
const isValidTransition = (currentStatus, newStatus) => {
  const allowedTransitions = LEGACY_STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
};

// GET ALL REPORTS
exports.getReports = async (req, res) => {
  try {
    const { patient_id, status, branch_id } = req.query;
    const userId = req.user.id;

    // Build filters
    const filters = { patient_id, status };

    if (branch_id) {
      // Explicit branch filter from query
      filters.branch_id = branch_id;
    } else {
      // Auto-filter by user's/doctor's branches to prevent cross-org data leakage
      let userBranches;
      if (req.user.source === "doctor") {
        userBranches = await Doctor.getDoctorBranches(userId);
      } else {
        userBranches = await Branch.getUserBranches(userId);
      }
      if (userBranches.length > 0) {
        filters.branch_ids = userBranches.map(b => b.id);
      }
    }

    const reports = await Report.getAllReports(filters);

    res.json({
      message: "Reports retrieved successfully",
      count: reports.length,
      data: reports
    });
  } catch (err) {
    console.error("Get reports error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET REPORT BY ID
exports.getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.getReportById(id);

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json({
      message: "Report retrieved successfully",
      data: report
    });
  } catch (err) {
    console.error("Get report error:", err);
    res.status(500).json({ error: err.message });
  }
};

// CREATE REPORT (status: draft)
exports.createReport = async (req, res) => {
  try {
    const { 
      patient_id, 
      doctor_id, 
      report_type, 
      sample_id, 
      clinical_notes, 
      technician_id, 
      report_amount, 
      is_self_report,
      test_data,
      findings,
      recommendations,
      branch_id,
      delivery_preferences,
      b2b_lab_id,
      b2b_charge,
    } = req.body;

    // Validation
    if (!patient_id) {
      return res.status(400).json({ error: "patient_id is required" });
    }

    // Determine if it's a self-report (no referring doctor)
    const selfReport = is_self_report === true || !doctor_id;

    // Auto-create sample with auto-generated ID if no sample_id provided
    let linkedSampleId = sample_id || null;
    let sampleIdCode = null;
    let resolvedBranchId = branch_id || req.user.branch_id;

    if (!resolvedBranchId && patient_id) {
      try {
        const patientObj = await Patient.findByPk(patient_id, { raw: true });
        if (patientObj) {
          resolvedBranchId = patientObj.branch_id;
        }
      } catch (e) {
        console.error("Error fetching patient branch:", e);
      }
    }

    if (!linkedSampleId) {
      const generatedSampleIdCode = await sampleService.generateSampleId(resolvedBranchId);
      const sample = await Sample.createSample({
        patient_id,
        sample_type: 'blood',
        sample_id_code: generatedSampleIdCode,
        collection_date: new Date(),
        collected_by: req.user.id,
        branch_id: resolvedBranchId,
        notes: ''
      });
      linkedSampleId = sample.id;
      sampleIdCode = generatedSampleIdCode;
    }

    // Inject layout snapshots
    let enrichedTestData = test_data || {};
    if (resolvedBranchId) {
      enrichedTestData = await injectLayoutSnapshots(enrichedTestData, resolvedBranchId);
    }

    const report = await Report.createReport({
      patient_id,
      doctor_id: selfReport ? null : doctor_id,
      report_type,
      sample_id: linkedSampleId,
      clinical_notes,
      technician_id: technician_id || req.user.id,
      status: REPORT_STATUSES.DRAFT,
      report_amount: report_amount || 0,
      is_self_report: selfReport,
      test_data: enrichedTestData,
      findings: findings || '',
      recommendations: recommendations || '',
      delivery_preferences: delivery_preferences || {},
      b2b_lab_id: b2b_lab_id || null,
      b2b_charge: b2b_charge || 0,
    });

    const reportJson = report && typeof report.toJSON === 'function' ? report.toJSON() : report;

    // Trigger registration confirmation notification here with tests!
    try {
      const patientObj = await Patient.findByPk(patient_id, { raw: true });
      if (patientObj) {
        const resolvedBranchId = branch_id || patientObj.branch_id || req.user.branch_id;
        const branchObj = resolvedBranchId ? await Branch.getBranchById(resolvedBranchId) : null;

        workflowNotificationService.onPatientRegistered({
          patient: patientObj,
          branchName: branchObj?.name,
          tests: report_type,
        });
      }
    } catch (notificationError) {
      console.error("Failed to send patient registration notification from report creation:", notificationError.message);
    }

    res.status(201).json({
      message: "Report created successfully as draft",
      data: { ...reportJson, sample_id_code: sampleIdCode || reportJson.sample_id_code }
    });
  } catch (err) {
    console.error("Create report error:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE REPORT
exports.updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      findings, 
      recommendations, 
      clinical_notes, 
      technician_id,
      test_data,
      doctor_id,
      report_type,
      report_amount,
      is_self_report,
      b2b_lab_id,
      b2b_charge,
    } = req.body;

    // Get current report to check status
    const currentReport = await Report.getReportById(id);
    if (!currentReport) {
      return res.status(404).json({ error: "Report not found" });
    }

    // Check if report is editable based on status
    if (!isEditable(currentReport.status)) {
      return res.status(400).json({ 
        error: `Cannot edit report with status '${currentReport.status}'. Only draft or rejected reports can be edited.`,
        currentStatus: currentReport.status
      });
    }

    // Get branch_id from current report or patient
    let resolvedBranchId = req.body.branch_id || req.query.branch_id || currentReport.branch_id;
    if (!resolvedBranchId && currentReport.patient_id) {
      try {
        const patientObj = await Patient.findByPk(currentReport.patient_id, { raw: true });
        if (patientObj) {
          resolvedBranchId = patientObj.branch_id;
        }
      } catch (e) {
        console.error("Error fetching patient branch:", e);
      }
    }
    if (!resolvedBranchId) {
      resolvedBranchId = req.user.branch_id;
    }

    // Inject layout snapshots if we have test_data
    let enrichedTestData = test_data;
    if (test_data && resolvedBranchId) {
      enrichedTestData = await injectLayoutSnapshots(test_data, resolvedBranchId);
    }

    const report = await Report.updateReport(id, {
      findings,
      recommendations,
      clinical_notes,
      technician_id,
      test_data: enrichedTestData,
      doctor_id,
      report_type,
      report_amount,
      is_self_report,
      b2b_lab_id,
      b2b_charge,
    });

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json({
      message: "Report updated successfully",
      data: report
    });
  } catch (err) {
    console.error("Update report error:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE REPORT STATUS (with workflow validation)
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    // Validate status value
    if (!Object.values(REPORT_STATUSES).includes(status)) {
      return res.status(400).json({ 
        error: "Invalid status",
        validStatuses: Object.values(REPORT_STATUSES)
      });
    }

    // Get current report
    const currentReport = await Report.getReportById(id);
    if (!currentReport) {
      return res.status(404).json({ error: "Report not found" });
    }

    // Validate status transition
    if (!isValidTransition(currentReport.status, status)) {
      return res.status(400).json({ 
        error: `Invalid status transition from '${currentReport.status}' to '${status}'`,
        allowedTransitions: LEGACY_STATUS_TRANSITIONS[currentReport.status]
      });
    }

    const report = await Report.updateReportStatus(id, status, userId);

    res.json({
      message: `Report status updated to '${status}'`,
      data: report
    });
  } catch (err) {
    console.error("Update report status error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// NEW WORKFLOW METHODS
// ==========================================

// SUBMIT REPORT FOR REVIEW (draft/rejected → under_review)
exports.submitReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const report = await reportService.submitForReview(id, userId, userRole);

    res.json({
      message: "Report submitted for review successfully",
      data: report
    });
  } catch (err) {
    console.error("Submit report error:", err);
    res.status(400).json({ error: err.message });
  }
};

// REJECT REPORT (under_review → rejected)
exports.rejectReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: "Rejection reason is required" });
    }

    const report = await reportService.rejectReport(id, userId, userRole, reason);

    res.json({
      message: "Report rejected",
      data: report
    });
  } catch (err) {
    console.error("Reject report error:", err);
    res.status(400).json({ error: err.message });
  }
};

// REVISE REJECTED REPORT (rejected → draft)
exports.reviseReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const report = await reportService.reviseReport(id, userId, userRole);

    res.json({
      message: "Report moved back to draft for revision",
      data: report
    });
  } catch (err) {
    console.error("Revise report error:", err);
    res.status(400).json({ error: err.message });
  }
};

// GET REPORTS SUMMARY (counts by status)
exports.getReportsSummary = async (req, res) => {
  try {
    const { branch_id } = req.query;
    const userId = req.user.id;

    // Build filters
    const filters = {};

    if (branch_id) {
      filters.branch_id = branch_id;
    } else {
      // Auto-filter by user's/doctor's branches
      let userBranches;
      if (req.user.source === "doctor") {
        userBranches = await Doctor.getDoctorBranches(userId);
      } else {
        userBranches = await Branch.getUserBranches(userId);
      }
      if (userBranches.length > 0) {
        filters.branch_ids = userBranches.map(b => b.id);
      }
    }
    
    const { reports, summary } = await reportService.getReportsWithSummary(filters);

    res.json({
      message: "Reports summary retrieved successfully",
      summary,
      totalReports: reports.length
    });
  } catch (err) {
    console.error("Get reports summary error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ASSIGN TECHNICIAN
exports.assignTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    const { technician_id } = req.body;

    if (!technician_id) {
      return res.status(400).json({ error: "technician_id is required" });
    }

    const report = await Report.assignTechnician(id, technician_id);

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json({
      message: "Technician assigned successfully",
      data: report
    });
  } catch (err) {
    console.error("Assign technician error:", err);
    res.status(500).json({ error: err.message });
  }
};

// APPROVE REPORT (under_review → approved)
exports.approveReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const report = await reportService.approveReport(id, userId, userRole);

    const fullReport = await Report.getReportById(id);
    const reportBranch = fullReport?.branch_id
      ? await Branch.getBranchById(fullReport.branch_id)
      : null;

    if (fullReport?.patient_phone) {
      const reportLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/reports/preview/${id}`;
      workflowNotificationService.onReportApproved({
        report: fullReport,
        patientName: fullReport.patient_name,
        patientPhone: fullReport.patient_phone,
        branchName: reportBranch?.name,
        testName: fullReport.report_type,
        reportLink,
      });
    }

    res.json({
      message: "Report approved successfully",
      data: report
    });
  } catch (err) {
    console.error("Approve report error:", err);
    res.status(400).json({ error: err.message });
  }
};

// GET REPORTS BY PATIENT
exports.getReportsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    const reports = await Report.getReportsByPatient(patientId);

    res.json({
      message: "Patient reports retrieved successfully",
      count: reports.length,
      data: reports
    });
  } catch (err) {
    console.error("Get patient reports error:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE REPORT
exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Report.deleteReport(id);

    if (!result) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json({
      message: "Report deleted successfully",
      data: result
    });
  } catch (err) {
    console.error("Delete report error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Export statuses for use in other modules
exports.REPORT_STATUSES = REPORT_STATUSES;
exports.STATUS_TRANSITIONS = STATUS_TRANSITIONS;

// SEND REPORT (via WhatsApp/Email)
exports.sendReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { channel, recipient_type } = req.body;
    // channel: 'whatsapp' | 'email'
    // recipient_type: 'patient' | 'doctor'

    if (!channel || !recipient_type) {
      return res.status(400).json({ error: "channel and recipient_type are required" });
    }

    if (!['whatsapp', 'email'].includes(channel)) {
      return res.status(400).json({ error: "channel must be 'whatsapp' or 'email'" });
    }

    if (!['patient', 'doctor'].includes(recipient_type)) {
      return res.status(400).json({ error: "recipient_type must be 'patient' or 'doctor'" });
    }

    const report = await Report.getReportById(id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    // Build recipient info
    let recipientName, recipientPhone, recipientEmail;
    if (recipient_type === 'patient') {
      recipientName = report.patient_name;
      recipientPhone = report.patient_phone;
    } else {
      recipientName = `Dr. ${report.doctor_firstname || ''} ${report.doctor_lastname || ''}`.trim();
      recipientPhone = report.doctor_phone;
      recipientEmail = report.doctor_email;
    }

    if (channel === 'whatsapp') {
      if (!recipientPhone) {
        return res.status(400).json({ error: `No phone number found for ${recipient_type}` });
      }
      // Return WhatsApp deep link for frontend to open
      const sampleId = report.sample_id_code || 'N/A';
      const message = recipient_type === 'patient'
        ? `Hello ${recipientName},\n\nYour laboratory test report (${sampleId}) is ready. Please find the report attached.\n\nFor any questions, please contact us.\n\nBest regards,\nDiagnoPro`
        : `Hello ${recipientName},\n\nLaboratory test report (${sampleId}) for patient ${report.patient_name} is ready. Please find the report attached.\n\nBest regards,\nDiagnoPro`;
      
      const cleanPhone = recipientPhone.replace(/[^0-9+]/g, '');
      const whatsappUrl = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(message)}`;

      return res.json({
        message: "WhatsApp link generated",
        data: {
          channel: 'whatsapp',
          recipient_type,
          recipient_name: recipientName,
          recipient_phone: recipientPhone,
          whatsapp_url: whatsappUrl,
          text_message: message,
        }
      });
    }

    if (channel === 'email') {
      // For now, return email data for frontend to handle via mailto
      const sampleId = report.sample_id_code || 'N/A';
      const subject = `Lab Report ${sampleId} - DiagnoPro`;
      const body = recipient_type === 'patient'
        ? `Dear ${recipientName},\n\nYour laboratory test report (${sampleId}) is ready.\n\nPlease find the report attached.\n\nFor any questions, please contact us.\n\nBest regards,\nDiagnoPro`
        : `Dear ${recipientName},\n\nLaboratory test report (${sampleId}) for patient ${report.patient_name} is ready.\n\nPlease find the report attached.\n\nBest regards,\nDiagnoPro`;

      return res.json({
        message: "Email data generated",
        data: {
          channel: 'email',
          recipient_type,
          recipient_name: recipientName,
          recipient_email: recipientEmail,
          subject,
          body,
        }
      });
    }
  } catch (err) {
    console.error("Send report error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GENERATE AI INTERPRETATION
exports.generateInterpretation = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the report
    const report = await Report.getReportById(id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    const testData = report.test_data;
    if (!testData) {
      return res.status(400).json({ error: "No test data found in report. Please enter test values first." });
    }

    // Collect all parameters
    let allParameters = [];
    if (testData.tests?.length) {
      for (const group of testData.tests) {
        for (const p of group.parameters) {
          allParameters.push(p);
        }
      }
    } else if (testData.parameters?.length) {
      allParameters = testData.parameters;
    }

    // Filter to only filled parameters
    const filledParams = allParameters.filter(p => p.value != null && p.value !== '');
    if (filledParams.length === 0) {
      return res.status(400).json({ error: "No test values entered yet. Please fill in test results first." });
    }

    const testName = testData.testName || report.report_type || 'Laboratory Test';

    const result = await aiService.generateInterpretation(testName, filledParams);

    res.json({
      message: "Interpretation generated successfully",
      data: result,
    });
  } catch (err) {
    console.error("Generate interpretation error:", err);
    res.status(500).json({ error: err.message });
  }
};
