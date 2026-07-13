/**
 * ============================================
 * MAIL SERVICE
 * ============================================
 * 
 * Nodemailer-based email service.
 * Reads SMTP config from environment variables.
 * Falls back to console logging when SMTP is not configured.
 * 
 * Environment Variables:
 *   SMTP_HOST - SMTP server hostname (e.g., smtp.gmail.com)
 *   SMTP_PORT - SMTP server port (e.g., 587)
 *   SMTP_USER - SMTP username / email
 *   SMTP_PASS - SMTP password / Google App Password
 *   SMTP_FROM - From address (e.g., DiagnoPro <noreply@diagnopro.com>)
 */

const nodemailer = require("nodemailer");
const { 
  welcomeEmailTemplate, 
  otpEmailTemplate, 
  loginOtpEmailTemplate, 
  reportEmailTemplate 
} = require("../utils/emailTemplates");

// ==========================================
// Transporter Setup
// ==========================================

let transporter = null;
let isConfigured = false;

function maskIdentifier(value) {
  if (!value || typeof value !== "string") return "not-set";
  if (value.length <= 4) return "****";
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

function initTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  console.log("🔍 [SMTP_DIAG] Initiating mail service configuration check...");
  console.log(`🔍 [SMTP_DIAG] Host: ${SMTP_HOST || "MISSING"}`);
  console.log(`🔍 [SMTP_DIAG] Port: ${SMTP_PORT || "MISSING"} (parsed: ${parseInt(SMTP_PORT)})`);
  console.log(`🔍 [SMTP_DIAG] User: ${SMTP_USER || "MISSING"}`);
  console.log(`🔍 [SMTP_DIAG] Pass: ${SMTP_PASS ? "PRESENT (length: " + SMTP_PASS.length + ")" : "MISSING"}`);
  console.log(`🔍 [SMTP_DIAG] From: ${SMTP_FROM || "MISSING"}`);

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn("⚠️  SMTP not configured — emails will be logged to console instead of sent.");
    return;
  }

  const port = parseInt(SMTP_PORT) || 587;
  const secure = port === 465;
  console.log(`🔍 [SMTP_DIAG] Security match check: port=${port} secure=${secure}`);

  console.log("🔍 [SMTP_DIAG] Creating Nodemailer transporter...");
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: port,
    secure: secure,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    },
    family: 4, // Force IPv4 to prevent IPv6 hangs on Render
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    logger: true, // Output SMTP conversation details to console
    debug: true   // Output SMTP debug details
  });

  isConfigured = true;
  console.log("🔍 [SMTP_DIAG] Transporter created. Running connection verification...");

  transporter.verify((error) => {
    if (error) {
      console.error("❌ [SMTP_DIAG] Verification failed:", {
        message: error.message,
        code: error.code,
        responseCode: error.responseCode,
        command: error.command,
        stack: error.stack
      });
      return;
    }
    console.log("✅ [SMTP_DIAG] SMTP verification success: Connection is active and ready.");
  });
}

// Initialize on first import
initTransporter();

// ==========================================
// Core Send Method
// ==========================================

/**
 * Send an email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML body
 * @param {Array} attachments - Optional Nodemailer attachments array
 * @returns {Promise<Object|null>} Nodemailer info object, or null if not configured
 */
async function sendMail(to, subject, html, attachments = null) {
  const fromAddress = process.env.SMTP_FROM || `DiagnoPro <${process.env.SMTP_USER || "noreply@diagnopro.com"}>`;

  if (!isConfigured) {
    // Fallback: log to console for development
    console.log("\n📧 ═══════════════════════════════════════");
    console.log("   EMAIL (console fallback — SMTP not configured)");
    console.log("═══════════════════════════════════════════");
    console.log(`   To:      ${to}`);
    console.log(`   From:    ${fromAddress}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Has Attachment: ${attachments && attachments.length > 0 ? "Yes" : "No"}`);
    console.log("   Body:    [HTML email — see template]");
    console.log("═══════════════════════════════════════════\n");
    return null;
  }

  try {
    console.log(`📧 [SMTP_DIAG] Attempting email send to=${to} subject=${subject}`);

    const mailOptions = {
      from: fromAddress,
      to,
      subject,
      html,
    };

    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    console.log(`📧 [SMTP_DIAG] Calling transporter.sendMail to=${to}...`);
    const info = await transporter.sendMail(mailOptions);

    console.log(`📧 [SMTP_DIAG] Send success to ${to} — Message ID: ${info.messageId}`);
    console.log("📧 [SMTP_DIAG] Accepted:", info.accepted);
    console.log("📧 [SMTP_DIAG] Rejected:", info.rejected);
    
    if (info.rejected && info.rejected.length > 0) {
      console.error(`❌ [SMTP_DIAG] SMTP rejected recipients: ${info.rejected.join(", ")}`);
    }
    return info;
  } catch (error) {
    console.error(`❌ [SMTP_DIAG] Failed to send email to ${to}:`, {
      message: error.message,
      code: error.code,
      response: error.response,
      responseCode: error.responseCode,
      command: error.command,
      stack: error.stack
    });
    // Don't throw — email failures shouldn't break the app flow
    return null;
  }
}

// ==========================================
// Feature-Specific Methods
// ==========================================

/**
 * Send welcome email to a newly registered user
 * @param {Object} user - User object with { firstname, email }
 */
async function sendWelcomeEmail(user) {
  const loginUrl = process.env.CLIENT_URL
    ? `${process.env.CLIENT_URL}/login`
    : "http://localhost:5173/login";

  const html = welcomeEmailTemplate(user.firstname, loginUrl);

  return sendMail(
    user.email,
    "Welcome to DiagnoPro — Your Lab Management Platform",
    html
  );
}

/**
 * Send OTP email for password reset
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP code
 * @param {number} expiryMinutes - OTP validity in minutes
 */
async function sendOtpEmail(email, otp, expiryMinutes = 10) {
  const html = otpEmailTemplate(otp, expiryMinutes);

  return sendMail(
    email,
    "DiagnoPro — Password Reset Verification Code",
    html
  );
}

/**
 * Send OTP email for login 2FA verification
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP code
 * @param {number} expiryMinutes - OTP validity in minutes
 */
async function sendLoginOtpEmail(email, otp, expiryMinutes = 10) {
  const html = loginOtpEmailTemplate(otp, expiryMinutes);

  return sendMail(
    email,
    "DiagnoPro — Secure Login Verification Code",
    html
  );
}

/**
 * Send finalized PDF report via email
 * @param {Object} params - { email, pdfBuffer, fileName, recipientName, patientName, sampleId, branchName }
 */
async function sendReportEmail({ 
  email, 
  pdfBuffer, 
  fileName, 
  recipientName, 
  patientName, 
  sampleId, 
  branchName 
}) {
  const html = reportEmailTemplate(recipientName, patientName, sampleId, branchName);
  const attachments = [
    {
      filename: fileName,
      content: pdfBuffer,
      contentType: "application/pdf",
    },
  ];

  return sendMail(
    email,
    `Laboratory Test Report (${sampleId}) — ${patientName}`,
    html,
    attachments
  );
}

module.exports = {
  sendMail,
  sendWelcomeEmail,
  sendOtpEmail,
  sendLoginOtpEmail,
  sendReportEmail,
};
