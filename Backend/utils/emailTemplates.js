/**
 * ============================================
 * EMAIL TEMPLATES
 * ============================================
 * 
 * Professional HTML email templates used by the mail service.
 * All templates follow DiagnoPro branding with responsive design.
 */

/**
 * Base email wrapper with consistent branding
 * @param {string} content - Inner HTML content
 * @returns {string} Full HTML email
 */
function baseTemplate(content) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DiagnoPro</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f9; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 32px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                DiagnoPro
              </h1>
              <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px; font-weight: 400;">
                Lab Management System
              </p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center; line-height: 1.6;">
                This is an automated message from DiagnoPro.<br>
                Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Welcome email template — sent when a new user registers
 * @param {string} firstname - User's first name
 * @param {string} loginUrl - URL to the login page
 * @returns {string} Full HTML email
 */
function welcomeEmailTemplate(firstname, loginUrl) {
  const content = `
    <h2 style="color: #1e293b; margin: 0 0 16px; font-size: 22px; font-weight: 600;">
      Welcome aboard, ${firstname}! 🎉
    </h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
      Your DiagnoPro account has been created successfully. You now have access to a powerful lab management platform designed to streamline your diagnostic workflow.
    </p>
    <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 8px;">
      Here's what you can do next:
    </p>
    <ul style="color: #475569; font-size: 14px; line-height: 2; margin: 0 0 28px; padding-left: 20px;">
      <li>Set up your first branch and configure lab details</li>
      <li>Add your team members (staff, technicians)</li>
      <li>Configure your test catalog and report templates</li>
      <li>Start managing patients and generating reports</li>
    </ul>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 15px; font-weight: 600; letter-spacing: 0.3px;">
        Go to Dashboard
      </a>
    </div>
    <p style="color: #94a3b8; font-size: 13px; margin: 0; text-align: center;">
      If you didn't create this account, please ignore this email.
    </p>`;

  return baseTemplate(content);
}

/**
 * OTP email template — sent for password reset verification
 * @param {string} otp - 6-digit OTP code
 * @param {number} expiryMinutes - Minutes until OTP expires
 * @returns {string} Full HTML email
 */
function otpEmailTemplate(otp, expiryMinutes = 10) {
  const content = `
    <h2 style="color: #1e293b; margin: 0 0 16px; font-size: 22px; font-weight: 600;">
      Password Reset Request
    </h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
      We received a request to reset your password. Use the verification code below to proceed:
    </p>
    <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 28px; text-align: center; margin: 0 0 24px;">
      <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 10px; font-weight: 600;">
        Verification Code
      </p>
      <p style="color: #1e293b; font-size: 36px; font-weight: 700; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
        ${otp}
      </p>
    </div>
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 14px 18px; margin: 0 0 24px;">
      <p style="color: #92400e; font-size: 13px; margin: 0; font-weight: 500;">
        ⏰ This code expires in <strong>${expiryMinutes} minutes</strong>. Do not share it with anyone.
      </p>
    </div>
    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 8px;">
      If you didn't request a password reset, you can safely ignore this email. Your account remains secure.
    </p>`;

  return baseTemplate(content);
}

module.exports = {
  welcomeEmailTemplate,
  otpEmailTemplate,
};
