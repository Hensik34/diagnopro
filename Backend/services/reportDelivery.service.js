const { ReportDelivery, Report, Patient, Doctor, User } = require("../models");
const { Op } = require("sequelize");
const { emitBranchWhatsAppEvent } = require("./realtime.service");

// Create (or reset) a pending delivery row for a recipient
async function markPending({ reportId, branchId, recipientType, recipientPhone, recipientEmail = null, channel = "whatsapp" }) {
  const row = await ReportDelivery.create({
    report_id: reportId,
    branch_id: branchId,
    channel,
    recipient_type: recipientType,
    recipient_phone: channel === "whatsapp" ? (recipientPhone || null) : null,
    recipient_email: channel === "email" ? (recipientEmail || null) : null,
    status: "pending",
  });
  emit(branchId, reportId, recipientType, "pending");
  return row;
}

async function updateStatus(rowOrId, status, { reason = null, waMessageId = null } = {}) {
  const row = typeof rowOrId === "string"
    ? await ReportDelivery.findByPk(rowOrId)
    : rowOrId;
  if (!row) return null;
  await row.update({ status, reason, wa_message_id: waMessageId });
  emit(row.branch_id, row.report_id, row.recipient_type, status, reason);
  return row;
}

function emit(branchId, reportId, recipientType, status, reason = null) {
  emitBranchWhatsAppEvent(branchId, "report:delivery", {
    report_id: reportId,
    recipient_type: recipientType,
    status,
    reason,
  });
}

// For the frontend to load current delivery state of a report
async function getForReport(reportId) {
  return ReportDelivery.findAll({
    where: { report_id: reportId },
    order: [["created_at", "DESC"]],
    raw: true,
  });
}

async function getNotifications({
  userId,
  role,
  branchIds = [],
  branchId,
  limit = 30,
}) {
  const where = {};
  if (branchId) {
    where.branch_id = branchId;
  } else if (Array.isArray(branchIds) && branchIds.length > 0) {
    where.branch_id = { [Op.in]: branchIds };
  }

  const reportInclude = {
    model: Report,
    as: "report",
    attributes: ["id", "technician_id", "report_type", "sample_id"],
    required: false,
    include: [
      { model: Patient, as: "patient", attributes: ["name"], required: false },
      { model: Doctor, as: "doctor", attributes: ["title", "name"], required: false },
      { model: User, as: "technician", attributes: ["firstname", "lastname"], required: false },
    ],
  };

  // Technician sees their own report deliveries.
  // Admin can see all deliveries in allowed branches.
  if (role === "lab_technician") {
    reportInclude.where = { technician_id: userId };
    reportInclude.required = true;
  }

  const rows = await ReportDelivery.findAll({
    where,
    include: [reportInclude],
    order: [["created_at", "DESC"]],
    limit: Math.max(1, Math.min(Number(limit) || 30, 100)),
    raw: true,
    nest: true,
  });

  return rows.map((row) => {
    const patientName = row.report?.patient?.name || null;
    const doctorTitle = row.report?.doctor?.title || "Dr";
    const doctorName = row.report?.doctor?.name || null;
    const technicianName = row.report?.technician
      ? `${row.report.technician.firstname || ""} ${row.report.technician.lastname || ""}`.trim()
      : null;

    let recipientName = "Unknown recipient";
    if (row.recipient_type === "patient") {
      recipientName = patientName || "Patient";
    } else if (row.recipient_type === "doctor") {
      recipientName = doctorName ? `${doctorTitle}. ${doctorName}` : "Doctor";
    } else if (row.recipient_type === "technician") {
      recipientName = technicianName || "Technician";
    }

    return {
      ...row,
      recipient_name: recipientName,
      document_name: row.report?.report_type
        ? `Lab Report - ${row.report.report_type}`
        : "Lab Report",
      report_type: row.report?.report_type || null,
      patient_name: patientName,
      technician_name: technicianName,
    };
  });
}

module.exports = { markPending, updateStatus, getForReport, getNotifications };
