const whatsappService = require("./whatsapp.service");
const { WHATSAPP_EVENTS } = require("./whatsapp.constants");

async function safeSend(payload) {
  try {
    return await whatsappService.sendWorkflowNotification(payload);
  } catch (error) {
    console.error("Workflow WhatsApp notification failed", {
      eventKey: payload.eventKey,
      branchId: payload.branchId,
      error: error.message,
    });
    return { skipped: true, reason: error.message };
  }
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

async function onPatientRegistered({ patient, branchName, tests }) {
  if (!patient?.phone || !patient?.branch_id) return;

  return safeSend({
    branchId: patient.branch_id,
    eventKey: WHATSAPP_EVENTS.REGISTRATION_CONFIRMATION,
    to: patient.phone,
    recipientName: patient.name,
    variables: {
      patient_name: patient.name,
      patient_tests: tests || "N/A",
      branch_name: branchName || "Your Laboratory",
    },
    metadata: {
      source: "workflow",
      workflow: "registration_confirmation",
      patient_id: patient.id,
    },
  });
}

async function onReportApproved({ report, patientName, patientPhone, branchName, testName, reportLink }) {
  if (!patientPhone || !report?.branch_id) return;

  return safeSend({
    branchId: report.branch_id,
    eventKey: WHATSAPP_EVENTS.REPORT_APPROVED,
    to: patientPhone,
    recipientName: patientName,
    variables: {
      patient_name: patientName,
      test_name: testName || report.report_type || "Laboratory Test",
      report_link: reportLink || "",
      branch_name: branchName || "Your Laboratory",
    },
    metadata: {
      source: "workflow",
      workflow: "report_approved",
      report_id: report.id,
      patient_id: report.patient_id,
    },
  });
}

async function onPaymentConfirmed({
  branchId,
  patientName,
  patientPhone,
  branchName,
  testName,
  paymentAmount,
  reportId,
  patientId,
}) {
  if (!patientPhone || !branchId) return;

  return safeSend({
    branchId,
    eventKey: WHATSAPP_EVENTS.PAYMENT_CONFIRMATION,
    to: patientPhone,
    recipientName: patientName,
    variables: {
      patient_name: patientName,
      test_name: testName || "Laboratory Test",
      branch_name: branchName || "Your Laboratory",
      payment_amount: formatCurrency(paymentAmount),
    },
    metadata: {
      source: "workflow",
      workflow: "payment_confirmation",
      report_id: reportId,
      patient_id: patientId,
      payment_amount: paymentAmount,
    },
  });
}

module.exports = {
  onPatientRegistered,
  onReportApproved,
  onPaymentConfirmed,
};
