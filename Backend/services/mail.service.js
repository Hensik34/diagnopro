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
const { welcomeEmailTemplate, otpEmailTemplate } = require("../utils/emailTemplates");

// ==========================================
// Transporter Setup
// ==========================================

let transporter = null;
let isConfigured = false;

function initTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn("⚠️  SMTP not configured — emails will be logged to console instead of sent.");
    console.warn("   Set SMTP_HOST, SMTP_USER, SMTP_PASS in your .env to enable email delivery.\n");
    return;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT) || 587,
    secure: parseInt(SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  isConfigured = true;
  console.log("📧  Mail service initialized (SMTP configured)\n");
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
 * @returns {Promise<Object|null>} Nodemailer info object, or null if not configured
 */
async function sendMail(to, subject, html) {
  const fromAddress = process.env.SMTP_FROM || `DiagnoPro <${process.env.SMTP_USER || "noreply@diagnopro.com"}>`;

  if (!isConfigured) {
    // Fallback: log to console for development
    console.log("\n📧 ═══════════════════════════════════════");
    console.log("   EMAIL (console fallback — SMTP not configured)");
    console.log("═══════════════════════════════════════════");
    console.log(`   To:      ${to}`);
    console.log(`   From:    ${fromAddress}`);
    console.log(`   Subject: ${subject}`);
    console.log("   Body:    [HTML email — see template]");
    console.log("═══════════════════════════════════════════\n");
    return null;
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
    });

    console.log(`📧  Email sent to ${to} — Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌  Failed to send email to ${to}:`, error.message);
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

module.exports = {
  sendMail,
  sendWelcomeEmail,
  sendOtpEmail,
};
