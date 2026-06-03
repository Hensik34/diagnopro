const WHATSAPP_EVENTS = {
  REPORT_READY: "report_ready",
  REPORT_APPROVED: "report_approved",
  APPOINTMENT_CONFIRMATION: "appointment_confirmation",
  APPOINTMENT_REMINDER: "appointment_reminder",
  PAYMENT_CONFIRMATION: "payment_confirmation",
  REGISTRATION_CONFIRMATION: "registration_confirmation",
};

const DELIVERY_STATUS = {
  PENDING: "Pending",
  SENT: "Sent",
  DELIVERED: "Delivered",
  FAILED: "Failed",
  READ: "Read",
};

const CONNECTION_STATUS = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  QR_READY: "qr_ready",
  CONNECTED: "connected",
  SESSION_EXPIRED: "session_expired",
  ERROR: "error",
};

const PLACEHOLDER_KEYS = [
  "patient_name",
  "test_name",
  "report_link",
  "branch_name",
  "appointment_date",
  "appointment_time",
  "payment_amount",
  "patient_tests",
  "doctor_name",
  "sample_id",
];

module.exports = {
  WHATSAPP_EVENTS,
  DELIVERY_STATUS,
  CONNECTION_STATUS,
  PLACEHOLDER_KEYS,
};
