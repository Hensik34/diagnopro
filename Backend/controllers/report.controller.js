const jwt = require("jsonwebtoken");
const Report = require("../models/Report");
const reportService = require("../services/report.service");
const sampleService = require("../services/sample.service");
const Sample = require("../models/Sample");
const Branch = require("../models/Branch");
const Doctor = require("../models/Doctor");
const aiService = require("../services/ai.service");
const workflowNotificationService = require("../services/workflowNotification.service");
const { Patient, UserTest, Test } = require("../models");
const pdfGenerator = require("../services/pdfGenerator.service");
const whatsappService = require("../services/whatsapp.service");
const reportDeliveryService = require("../services/reportDelivery.service");
const mailService = require("../services/mail.service");
const fs = require("fs");
const path = require("path");

function logWhatsAppDebug(message, data = null) {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` | Data: ${JSON.stringify(data, null, 2)}` : "";
  const logLine = `[${timestamp}] [WhatsApp Auto-Send] ${message}${dataStr}\n`;
  console.log(`[WhatsApp Auto-Send] ${message}`, data || "");
  try {
    const logFilePath = path.join(__dirname, "..", "whatsapp-debug.log");
    fs.appendFileSync(logFilePath, logLine, "utf8");
  } catch (e) {
    console.error("Failed to write to whatsapp-debug.log:", e.message);
  }
}

// Use the new status from service
const { REPORT_STATUS, STATUS_TRANSITIONS, isEditable } = reportService;

// Legacy status mapping for backward compatibility
const REPORT_STATUSES = {
  CREATED: "created",
  COLLECTED: "collected",
  PROCESSING: "processing",
  COMPLETED: "completed",
  APPROVED: "approved",
  // New statuses
  DRAFT: "draft",
  UNDER_REVIEW: "under_review",
  REJECTED: "rejected",
};

const LEGACY_STATUS_TRANSITIONS = {
  [REPORT_STATUSES.CREATED]: [REPORT_STATUSES.COLLECTED],
  [REPORT_STATUSES.COLLECTED]: [REPORT_STATUSES.PROCESSING],
  [REPORT_STATUSES.PROCESSING]: [REPORT_STATUSES.COMPLETED],
  [REPORT_STATUSES.COMPLETED]: [REPORT_STATUSES.APPROVED],
  [REPORT_STATUSES.APPROVED]: [],
  // New workflow
  [REPORT_STATUSES.DRAFT]: [REPORT_STATUSES.UNDER_REVIEW],
  [REPORT_STATUSES.UNDER_REVIEW]: [
    REPORT_STATUSES.APPROVED,
    REPORT_STATUSES.REJECTED,
  ],
  [REPORT_STATUSES.REJECTED]: [REPORT_STATUSES.DRAFT],
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
    testIds = updatedTestData.tests
      .map((t) => t.id || t.testId)
      .filter(Boolean);
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
        raw: true,
      });
      const test = await Test.findByPk(testId, { raw: true });
      const clinicalSignificance =
        userTest?.clinical_significance || test?.clinical_significance || "";

      const config = userTest?.layout_config || { parameterSettings: [] };
      layoutSnapshots[testId] = {
        ...config,
        clinical_significance: clinicalSignificance,
      };
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
        filters.branch_ids = userBranches.map((b) => b.id);
      }
    }

    const reports = await Report.getAllReports(filters);

    res.json({
      message: "Reports retrieved successfully",
      count: reports.length,
      data: reports,
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

    const downloadToken = jwt.sign(
      { reportId: report.id },
      process.env.JWT_SECRET,
    );
    const reportTestPrices =
      await require("../models/ReportTestPrice").getPricesForReport(id);

    res.json({
      message: "Report retrieved successfully",
      data: {
        ...report,
        download_token: downloadToken,
        pricing_snapshot: reportTestPrices || [],
      },
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
      referring_doctor_name,
      report_type,
      sample_id,
      clinical_notes,
      technician_id,
      staff_id,
      report_amount,
      is_self_report,
      test_data,
      findings,
      recommendations,
      branch_id,
      delivery_preferences,
      b2b_lab_id,
      b2b_charge,
      price_list_id,
      base_amount,
      lab_discount_type,
      lab_discount_value,
      doctor_discount,
      final_amount,
      pricing_items,
    } = req.body;

    // Validation
    if (!patient_id) {
      return res.status(400).json({ error: "patient_id is required" });
    }

    // Determine if it's a self-report (no referring doctor)
    const selfReport =
      is_self_report === true || (!doctor_id && !referring_doctor_name);

    // Get branch_id from patient if not provided
    let resolvedBranchId = branch_id;
    if (!resolvedBranchId) {
      try {
        const patientObj = await Patient.findByPk(patient_id, { raw: true });
        if (patientObj) {
          resolvedBranchId = patientObj.branch_id;
        }
      } catch (e) {
        console.error("Error fetching patient branch during creation:", e);
      }
    }
    if (!resolvedBranchId) {
      resolvedBranchId = req.user.branch_id;
    }

    // If still no branch_id (should not happen), fallback to first branch
    if (!resolvedBranchId) {
      const { Branch } = require("../models");
      const firstBranch = await Branch.findOne({ raw: true });
      resolvedBranchId = firstBranch?.id;
    }

    // Attempt to link a sample if sample_id is provided
    let linkedSampleId = sample_id || null;
    if (!linkedSampleId) {
      // Find a pending/collected sample for this patient
      const latestSample = await Sample.findOne({
        where: { patient_id },
        order: [["created_at", "DESC"]],
        raw: true,
      });
      if (latestSample) {
        linkedSampleId = latestSample.id;
      }
    }

    // Inject layout snapshots
    let enrichedTestData = test_data || {};
    if (resolvedBranchId) {
      enrichedTestData = await injectLayoutSnapshots(
        enrichedTestData,
        resolvedBranchId,
      );
    }

    const report = await Report.createReport({
      patient_id,
      doctor_id: selfReport ? null : doctor_id,
      referring_doctor_name: selfReport ? null : referring_doctor_name,
      report_type,
      sample_id: linkedSampleId,
      clinical_notes,
      technician_id: technician_id || req.user.id,
      staff_id,
      status: REPORT_STATUSES.DRAFT,
      report_amount: report_amount || 0,
      is_self_report: selfReport,
      test_data: enrichedTestData,
      findings: findings || "",
      recommendations: recommendations || "",
      delivery_preferences: delivery_preferences || {},
      b2b_lab_id: b2b_lab_id || null,
      b2b_charge: b2b_charge || 0,
      branch_id: resolvedBranchId,
      // Multi-tier pricing fields
      price_list_id: price_list_id || null,
      base_amount:
        base_amount !== undefined
          ? Number(base_amount)
          : Number(report_amount || 0),
      lab_discount_type: lab_discount_type || "percent",
      lab_discount_value: lab_discount_value || 0,
      doctor_discount: doctor_discount || 0,
      final_amount:
        final_amount !== undefined
          ? Number(final_amount)
          : Number(report_amount || 0),
    });

    const reportJson =
      report && typeof report.toJSON === "function" ? report.toJSON() : report;

    // Snapshot pricing items if provided
    if (pricing_items && Array.isArray(pricing_items)) {
      const pricingService = require("../services/pricing.service");
      await pricingService.snapshotPrices(report.id, pricing_items);

      // Audit log overrides
      for (const item of pricing_items) {
        if (item.is_manual_override) {
          await pricingService.logPriceChange({
            reportId: report.id,
            testId: item.test_id || null,
            oldPrice: Number(item.default_price),
            newPrice: Number(item.applied_price),
            source: "manual",
            changedBy: req.user.id,
            reason: `Manual price override at report creation (source: ${item.source || "default"})`,
          });
        }
      }
    }

    // Trigger registration confirmation notification here with tests!
    try {
      const patientObj = await Patient.findByPk(patient_id, { raw: true });
      if (patientObj) {
        const resolvedBranchId =
          branch_id || patientObj.branch_id || req.user.branch_id;
        const branchObj = resolvedBranchId
          ? await Branch.getBranchById(resolvedBranchId)
          : null;

        workflowNotificationService.onPatientRegistered({
          patient: patientObj,
          branchName: branchObj?.name,
          tests: report_type,
        });
      }
    } catch (notificationError) {
      console.error(
        "Failed to send patient registration notification from report creation:",
        notificationError.message,
      );
    }

    res.status(201).json({
      message: "Report created successfully as draft",
      data: {
        ...reportJson,
        sample_id_code: sampleIdCode || reportJson.sample_id_code,
      },
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
      referring_doctor_name,
      report_type,
      report_amount,
      is_self_report,
      b2b_lab_id,
      b2b_charge,
      price_list_id,
      base_amount,
      lab_discount_type,
      lab_discount_value,
      doctor_discount,
      final_amount,
      pricing_items,
    } = req.body;

    // Get current report to check status
    const currentReport = await Report.getReportById(id);
    if (!currentReport) {
      return res.status(404).json({ error: "Report not found" });
    }

    // Check if report is editable based on status
    if (!isEditable(currentReport.status)) {
      return res.status(400).json({
        error: `Cannot edit report with status '${currentReport.status}'. Only draft, rejected, or approved reports can be edited.`,
        currentStatus: currentReport.status,
      });
    }

    // Get branch_id from current report or patient
    let resolvedBranchId =
      req.body.branch_id || req.query.branch_id || currentReport.branch_id;
    if (!resolvedBranchId && currentReport.patient_id) {
      try {
        const patientObj = await Patient.findByPk(currentReport.patient_id, {
          raw: true,
        });
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
      enrichedTestData = await injectLayoutSnapshots(
        test_data,
        resolvedBranchId,
      );
    }

    const report = await Report.updateReport(id, {
      findings,
      recommendations,
      clinical_notes,
      technician_id,
      test_data: enrichedTestData,
      doctor_id,
      referring_doctor_name,
      report_type,
      report_amount,
      is_self_report,
      b2b_lab_id,
      b2b_charge,
      price_list_id,
      base_amount,
      lab_discount_type,
      lab_discount_value,
      doctor_discount,
      final_amount,
    });

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    // Snapshot pricing items if provided
    if (pricing_items && Array.isArray(pricing_items)) {
      const pricingService = require("../services/pricing.service");

      // Get old snapshots to compare
      const oldSnapshots =
        await require("../models/ReportTestPrice").getPricesForReport(id);
      const oldSnapshotMap = new Map(
        oldSnapshots.map((s) => [s.test_id || s.package_id, s]),
      );

      await pricingService.snapshotPrices(id, pricing_items);

      // Audit log overrides and auto-recalculation pricing changes
      for (const item of pricing_items) {
        const key = item.test_id || item.package_id;
        const oldVal = oldSnapshotMap.get(key);
        if (
          !oldVal ||
          Number(oldVal.applied_price) !== Number(item.applied_price)
        ) {
          await pricingService.logPriceChange({
            reportId: id,
            testId: item.test_id || null,
            oldPrice: oldVal
              ? Number(oldVal.applied_price)
              : Number(item.default_price),
            newPrice: Number(item.applied_price),
            source: item.is_manual_override
              ? "manual"
              : item.source || "default",
            changedBy: req.user.id,
            reason: item.is_manual_override
              ? `Manual price override from ${oldVal ? oldVal.applied_price : item.default_price} to ${item.applied_price}`
              : `Price recalculated automatically (source: ${item.source || "default"})`,
          });
        }
      }
    }

    // Fetch refreshed report to ensure all nested/flattened details are up-to-date
    const refreshedReport = await Report.getReportById(id);

    res.json({
      message: "Report updated successfully",
      data: refreshedReport || report,
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
        validStatuses: Object.values(REPORT_STATUSES),
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
        allowedTransitions: LEGACY_STATUS_TRANSITIONS[currentReport.status],
      });
    }

    const report = await Report.updateReportStatus(id, status, userId);

    res.json({
      message: `Report status updated to '${status}'`,
      data: report,
    });
  } catch (err) {
    console.error("Update report status error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// NEW WORKFLOW METHODS
// ==========================================

async function triggerWhatsAppDelivery(id) {
  try {
    const fullReport = await Report.getReportById(id);
    if (!fullReport) {
      logWhatsAppDebug("triggerWhatsAppDelivery: Report not found", { id });
      return null;
    }

    const reportBranch = fullReport.branch_id
      ? await Branch.getBranchById(fullReport.branch_id)
      : null;

    logWhatsAppDebug("triggerWhatsAppDelivery started", {
      id: fullReport.id,
      patient_name: fullReport.patient_name,
      patient_phone: fullReport.patient_phone,
      branch_id: fullReport.branch_id,
      delivery_preferences: fullReport.delivery_preferences,
    });

    const prefs = fullReport.delivery_preferences || {};
    let whatsappDelivery = {
      patient: { sent: false, skipped: true, reason: "Not requested" },
      doctor: { sent: false, skipped: true, reason: "Not requested" },
    };

    logWhatsAppDebug("Evaluating WhatsApp delivery preferences", { prefs });

    if (fullReport.patient_phone && !prefs.patient_whatsapp) {
      const reportLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/reports/preview/${id}`;
      logWhatsAppDebug("Triggering template workflow notification (text only)");
      workflowNotificationService
        .onReportApproved({
          report: fullReport,
          patientName: fullReport.patient_name,
          patientPhone: fullReport.patient_phone,
          branchName: reportBranch?.name,
          testName: fullReport.report_type,
          reportLink,
        })
        .catch((err) => {
          logWhatsAppDebug(
            "Workflow notification promise rejected:",
            err.message,
          );
        });
    }

    if (prefs.patient_whatsapp || prefs.doctor_whatsapp) {
      const branchId = fullReport.branch_id;
      let pdfBuffer = null;
      let pdfError = null;

      logWhatsAppDebug("Checking WhatsApp connection status for branch", {
        branchId,
      });
      const status = await whatsappService.getBranchStatus(branchId);
      const isConnected = status?.session?.status === "connected";
      logWhatsAppDebug("WhatsApp connection check result", {
        isConnected,
        status,
      });

      if (!isConnected) {
        if (prefs.patient_whatsapp) {
          const d = await reportDeliveryService.markPending({ reportId: fullReport.id, branchId, recipientType: "patient", recipientPhone: fullReport.patient_phone });
          await reportDeliveryService.updateStatus(d, "failed", { reason: "WhatsApp is not connected for this branch" });
          whatsappDelivery.patient = { sent: false, reason: "WhatsApp is not connected for this branch" };
        }
        if (prefs.doctor_whatsapp) {
          const d = await reportDeliveryService.markPending({ reportId: fullReport.id, branchId, recipientType: "doctor" });
          await reportDeliveryService.updateStatus(d, "failed", { reason: "WhatsApp is not connected for this branch" });
          whatsappDelivery.doctor = { sent: false, reason: "WhatsApp is not connected for this branch" };
        }
      } else {
        // Generate PDF buffer (once)
        try {
          const downloadToken = jwt.sign(
            { reportId: fullReport.id },
            process.env.JWT_SECRET,
          );
          logWhatsAppDebug("Generating report PDF...", {
            reportId: fullReport.id,
          });
          pdfBuffer = await pdfGenerator.generateReportPdf(
            fullReport.id,
            downloadToken,
          );
          logWhatsAppDebug("PDF successfully generated", {
            size: pdfBuffer ? pdfBuffer.length : 0,
          });
        } catch (err) {
          logWhatsAppDebug(
            "PDF generation failed during approval:",
            err.message,
          );
          console.error("Auto-PDF generation failed during approval:", err);
          pdfError = err.message || "Failed to generate PDF";
        }

        // Process Patient WhatsApp
        if (prefs.patient_whatsapp) {
          const delivery = await reportDeliveryService.markPending({
            reportId: fullReport.id,
            branchId,
            recipientType: "patient",
            recipientPhone: fullReport.patient_phone,
          });
          if (!fullReport.patient_phone) {
            await reportDeliveryService.updateStatus(delivery, "skipped", {
              reason: "No phone number registered",
            });
            whatsappDelivery.patient = {
              sent: false,
              reason: "No phone number registered",
            };
          } else if (pdfError) {
            await reportDeliveryService.updateStatus(delivery, "failed", {
              reason: `PDF Error: ${pdfError}`,
            });
            whatsappDelivery.patient = {
              sent: false,
              reason: `PDF Error: ${pdfError}`,
            };
          } else {
            try {
              await reportDeliveryService.updateStatus(delivery, "sending");
              const sampleId = fullReport.sample_id_code || "N/A";
              const message = `Hello ${fullReport.patient_name || "Patient"},\n\nYour laboratory test report (${sampleId}) is ready. Please find the report PDF attached.\n\nBest regards,\nDiagnoPro`;
              const fileName = `Report-${(fullReport.patient_name || "Patient").replace(/\s+/g, "_")}-${fullReport.id}.pdf`;
              const result = await whatsappService.sendMessage({
                branchId,
                to: fullReport.patient_phone,
                message,
                fileBuffer: pdfBuffer,
                fileName,
                mimeType: "application/pdf",
                metadata: {
                  source: "auto_approve_patient",
                  report_id: fullReport.id,
                },
              });
              await reportDeliveryService.updateStatus(delivery, "sent", {
                waMessageId: result?.wa_message_id,
              });
              whatsappDelivery.patient = { sent: true };
            } catch (err) {
              await reportDeliveryService.updateStatus(delivery, "failed", {
                reason: err.message,
              });
              whatsappDelivery.patient = { sent: false, reason: err.message };
            }
          }
        }

        // Process Doctor WhatsApp
        if (prefs.doctor_whatsapp) {
          logWhatsAppDebug("Processing doctor auto-WhatsApp PDF delivery");
          const delivery = await reportDeliveryService.markPending({
            reportId: fullReport.id,
            branchId,
            recipientType: "doctor",
          });
          if (fullReport.is_self_report || !fullReport.doctor_id) {
            logWhatsAppDebug(
              "Report is self-reported or has no doctor. Skipping doctor delivery.",
            );
            await reportDeliveryService.updateStatus(delivery, "skipped", {
              reason: "Self-report (No doctor referenced)",
            });
            whatsappDelivery.doctor = {
              sent: false,
              reason: "Self-report (No doctor referenced)",
            };
          } else {
            const doctor = await Doctor.getDoctorById(fullReport.doctor_id);
            if (!doctor || !doctor.phone) {
              logWhatsAppDebug(
                "Referring doctor has no registered phone number.",
              );
              await reportDeliveryService.updateStatus(delivery, "skipped", {
                reason: "Referring doctor has no registered phone number",
              });
              whatsappDelivery.doctor = {
                sent: false,
                reason: "Referring doctor has no registered phone number",
              };
            } else if (pdfError) {
              logWhatsAppDebug("Skipping doctor WhatsApp due to PDF error.");
              await reportDeliveryService.updateStatus(delivery, "failed", {
                reason: `PDF Error: ${pdfError}`,
              });
              whatsappDelivery.doctor = {
                sent: false,
                reason: `PDF Error: ${pdfError}`,
              };
            } else {
              try {
                await reportDeliveryService.updateStatus(delivery, "sending");
                const sampleId = fullReport.sample_id_code || "N/A";
                const docTitle = doctor.title || "Dr";
                const docName = `${docTitle}. ${doctor.name}`;
                const message = `Hello ${docName},\n\nLaboratory test report (${sampleId}) for patient ${fullReport.patient_name || "Patient"} is ready. Please find the report PDF attached.\n\nBest regards,\nDiagnoPro`;
                const fileName = `Report-${(fullReport.patient_name || "Patient").replace(/\s+/g, "_")}-${fullReport.id}.pdf`;

                logWhatsAppDebug("Sending PDF message to referring doctor", {
                  to: doctor.phone,
                });
                const result = await whatsappService.sendMessage({
                  branchId,
                  to: doctor.phone,
                  message,
                  fileBuffer: pdfBuffer,
                  fileName,
                  mimeType: "application/pdf",
                  metadata: {
                    source: "auto_approve_doctor",
                    report_id: fullReport.id,
                  },
                });
                await reportDeliveryService.updateStatus(delivery, "sent", {
                  waMessageId: result?.wa_message_id,
                });

                whatsappDelivery.doctor = { sent: true };
                logWhatsAppDebug(
                  "Doctor PDF WhatsApp message sent successfully!",
                );
              } catch (err) {
                await reportDeliveryService.updateStatus(delivery, "failed", {
                  reason: err.message,
                });
                logWhatsAppDebug(
                  "Auto WhatsApp doctor send error:",
                  err.message,
                );
                console.error("Auto WhatsApp doctor send error:", err);
                whatsappDelivery.doctor = { sent: false, reason: err.message };
              }
            }
          }
        }
      }
    }
    return whatsappDelivery;
  } catch (err) {
    logWhatsAppDebug("triggerWhatsAppDelivery exception:", err.message);
    console.error("triggerWhatsAppDelivery failed:", err);
    return null;
  }
}

// SUBMIT REPORT FOR REVIEW (draft/rejected → under_review)
exports.submitReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    logWhatsAppDebug("submitReport controller started", {
      reportId: id,
      userId,
      userRole,
    });

    const report = await reportService.submitForReview(id, userId, userRole);

    let whatsappDelivery = undefined;
    if (report && report.status === "approved") {
      logWhatsAppDebug(
        "Report was auto-approved upon submission. Triggering WhatsApp auto-delivery.",
      );
      whatsappDelivery = { queued: true };
      setImmediate(() => {
        triggerWhatsAppDelivery(id).catch((err) =>
          logWhatsAppDebug("Background delivery failed after submit auto-approve", {
            id,
            error: err.message,
          }),
        );
      });
    }

    res.json({
      message:
        report.status === "approved"
          ? "Report approved successfully"
          : "Report submitted for review successfully",
      data: report,
      whatsapp_delivery: whatsappDelivery,
    });
  } catch (err) {
    logWhatsAppDebug("submitReport controller threw error", {
      error: err.message,
    });
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

    const report = await reportService.rejectReport(
      id,
      userId,
      userRole,
      reason,
    );

    res.json({
      message: "Report rejected",
      data: report,
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
      data: report,
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
        filters.branch_ids = userBranches.map((b) => b.id);
      }
    }

    const { reports, summary } =
      await reportService.getReportsWithSummary(filters);

    res.json({
      message: "Reports summary retrieved successfully",
      summary,
      totalReports: reports.length,
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
      data: report,
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

    logWhatsAppDebug("approveReport controller started", {
      reportId: id,
      userId,
      userRole,
    });

    const report = await reportService.approveReport(id, userId, userRole);

    // Respond immediately — report is already approved in DB
    res.json({
      message: "Report approved successfully",
      data: report,
      whatsapp_delivery: { queued: true },
    });

    // Run PDF generation + WhatsApp send in the background (do NOT await)
    setImmediate(() => {
      triggerWhatsAppDelivery(id).catch((err) =>
        logWhatsAppDebug("Background delivery failed", {
          id,
          error: err.message,
        }),
      );
    });
  } catch (err) {
    logWhatsAppDebug("approveReport controller threw error", {
      error: err.message,
    });
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
      data: reports,
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
      data: result,
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
    const { channel, recipient_type, recipient_phone, recipient_email } = req.body;
    // channel: 'whatsapp' | 'email'
    // recipient_type: 'patient' | 'doctor'

    if (!channel || !recipient_type) {
      return res
        .status(400)
        .json({ error: "channel and recipient_type are required" });
    }

    if (!["whatsapp", "email"].includes(channel)) {
      return res
        .status(400)
        .json({ error: "channel must be 'whatsapp' or 'email'" });
    }

    if (!["patient", "doctor"].includes(recipient_type)) {
      return res
        .status(400)
        .json({ error: "recipient_type must be 'patient' or 'doctor'" });
    }

    const report = await Report.getReportById(id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    // Build recipient info
    let recipientName, recipientPhone, recipientEmail;
    if (recipient_type === "patient") {
      recipientName = report.patient_name;
      recipientPhone = report.patient_phone;
      recipientEmail = report.patient_email;
    } else {
      recipientName =
        report.doctor_name ||
        `Dr. ${report.doctor_firstname || ""} ${report.doctor_lastname || ""}`.trim();
      recipientPhone = report.doctor_phone;
      recipientEmail = report.doctor_email;
    }

    // Allow caller to override destination number/email
    if (typeof recipient_phone === "string" && recipient_phone.trim().length > 0) {
      recipientPhone = recipient_phone.trim();
    }
    if (typeof recipient_email === "string" && recipient_email.trim().length > 0) {
      recipientEmail = recipient_email.trim();
    }

    if (channel === "whatsapp") {
      if (!recipientPhone) {
        return res
          .status(400)
          .json({ error: `No phone number found for ${recipient_type}` });
      }

      const branchId = report.branch_id;
      if (!branchId) {
        return res.status(400).json({ error: "Report branch is missing" });
      }

      const status = await whatsappService.getBranchStatus(branchId);
      const isConnected = status?.session?.status === "connected";
      if (!isConnected) {
        return res
          .status(400)
          .json({ error: "WhatsApp is not connected for this branch" });
      }

      const delivery = await reportDeliveryService.markPending({
        reportId: report.id,
        branchId,
        recipientType: recipient_type,
        recipientPhone,
      });

      const sampleId = report.sample_id_code || "N/A";
      const message =
        recipient_type === "patient"
          ? `Hello ${recipientName},\n\nYour laboratory test report (${sampleId}) is ready. Please find the report attached.\n\nFor any questions, please contact us.\n\nBest regards,\nDiagnoPro`
          : `Hello ${recipientName},\n\nLaboratory test report (${sampleId}) for patient ${report.patient_name} is ready. Please find the report attached.\n\nBest regards,\nDiagnoPro`;

      try {
        await reportDeliveryService.updateStatus(delivery, "sending");
        const downloadToken = jwt.sign(
          { reportId: report.id },
          process.env.JWT_SECRET,
        );
        const pdfBuffer = await pdfGenerator.generateReportPdf(
          report.id,
          downloadToken,
        );

        const fileName = `Report-${(report.patient_name || "Patient").replace(/\s+/g, "_")}-${report.id}.pdf`;
        const result = await whatsappService.sendMessage({
          branchId,
          to: recipientPhone,
          message,
          fileBuffer: pdfBuffer,
          fileName,
          mimeType: "application/pdf",
          metadata: {
            source: "manual_report_share",
            report_id: report.id,
            recipient_type,
            actor_user_id: req.user.id,
          },
        });

        await reportDeliveryService.updateStatus(delivery, "sent", {
          waMessageId: result?.wa_message_id,
        });

        return res.json({
          message: "Report sent successfully via WhatsApp",
          data: {
            channel: "whatsapp",
            recipient_type,
            recipient_name: recipientName,
            recipient_phone: recipientPhone,
            delivery_status: "sent",
          },
        });
      } catch (sendErr) {
        await reportDeliveryService.updateStatus(delivery, "failed", {
          reason: sendErr.message,
        });
        throw sendErr;
      }
    }

    if (channel === "email") {
      if (!recipientEmail) {
        return res.status(400).json({ error: "Recipient email is required for email delivery" });
      }

      // Create a pending delivery record
      const delivery = await reportDeliveryService.markPending({
        reportId: report.id,
        branchId,
        recipientType: recipient_type,
        recipientEmail,
        channel: "email",
      });

      try {
        await reportDeliveryService.updateStatus(delivery, "sending");

        // Generate download token
        const downloadToken = jwt.sign(
          { reportId: report.id },
          process.env.JWT_SECRET
        );

        // Generate PDF
        const pdfBuffer = await pdfGenerator.generateReportPdf(
          report.id,
          downloadToken
        );

        const safePatient = (report.patient_name || "Patient").replace(/\s+/g, "_");
        const fileName = `Report-${safePatient}-${report.id}.pdf`;

        // Fetch branch name
        let branchName = "DiagnoPro Lab";
        if (branchId) {
          const branchRecord = await Branch.getBranchById(branchId);
          if (branchRecord) {
            branchName = branchRecord.name;
          }
        }

        // Send Email
        await mailService.sendReportEmail({
          email: recipientEmail,
          pdfBuffer,
          fileName,
          recipientName,
          patientName: report.patient_name || "Patient",
          sampleId: report.sample_id_code || "N/A",
          branchName,
        });

        await reportDeliveryService.updateStatus(delivery, "sent");

        return res.json({
          message: "Report email sent successfully",
          delivery_status: "sent",
        });
      } catch (sendErr) {
        await reportDeliveryService.updateStatus(delivery, "failed", {
          reason: sendErr.message,
        });
        throw sendErr;
      }
    }
  } catch (err) {
    console.error("Send report error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.downloadReportPdf = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.getReportById(id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    const downloadToken = jwt.sign(
      { reportId: report.id },
      process.env.JWT_SECRET,
    );
    const pdfBuffer = await pdfGenerator.generateReportPdf(
      report.id,
      downloadToken,
    );

    const safePatient = (report.patient_name || "Patient").replace(/\s+/g, "_");
    const fileName = `Report-${safePatient}-${report.id}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=\"${fileName}\"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Download report PDF error:", err);
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
      return res
        .status(400)
        .json({
          error:
            "No test data found in report. Please enter test values first.",
        });
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
    const filledParams = allParameters.filter(
      (p) => p.value != null && p.value !== "",
    );
    if (filledParams.length === 0) {
      return res
        .status(400)
        .json({
          error:
            "No test values entered yet. Please fill in test results first.",
        });
    }

    const testName =
      testData.testName || report.report_type || "Laboratory Test";

    const result = await aiService.generateInterpretation(
      testName,
      filledParams,
    );

    res.json({
      message: "Interpretation generated successfully",
      data: result,
    });
  } catch (err) {
    console.error("Generate interpretation error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET PUBLIC REPORT BY TOKEN
exports.getPublicReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(401).json({ error: "Access token is missing" });
    }

    // Verify and decode token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired access token" });
    }

    if (decoded.reportId !== id) {
      return res.status(403).json({ error: "Token mismatch for this report" });
    }

    const report = await Report.getReportById(id);

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    // Security check: Only allow viewing/downloading approved reports publicly
    if (report.status !== "approved") {
      return res.status(403).json({ error: "Report is not approved yet" });
    }

    res.json({
      message: "Public report retrieved successfully",
      data: report,
    });
  } catch (err) {
    console.error("Get public report error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getDeliveryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await reportDeliveryService.getForReport(id);
    res.json({ message: "Delivery status retrieved", data: rows });
  } catch (err) {
    console.error("Get delivery status error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getDeliveryNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { branch_id, limit } = req.query;

    let branchIds = [];
    if (branch_id) {
      branchIds = [branch_id];
    } else {
      const userBranches =
        req.user.source === "doctor"
          ? await Doctor.getDoctorBranches(userId)
          : await Branch.getUserBranches(userId);
      branchIds = userBranches.map((b) => b.id);
    }

    const rows = await reportDeliveryService.getNotifications({
      userId,
      role,
      branchIds,
      branchId: branch_id,
      limit,
    });

    res.json({
      message: "Delivery notifications retrieved",
      count: rows.length,
      data: rows,
    });
  } catch (err) {
    console.error("Get delivery notifications error:", err);
    res.status(500).json({ error: err.message });
  }
};