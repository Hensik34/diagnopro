const { ReportDelivery } = require("../models");
const { emitBranchWhatsAppEvent } = require("./realtime.service");

// Create (or reset) a pending delivery row for a recipient
async function markPending({ reportId, branchId, recipientType, recipientPhone }) {
  const row = await ReportDelivery.create({
    report_id: reportId,
    branch_id: branchId,
    channel: "whatsapp",
    recipient_type: recipientType,
    recipient_phone: recipientPhone || null,
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

module.exports = { markPending, updateStatus, getForReport };
