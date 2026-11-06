const nodemailer = require('nodemailer');
const { buildOtpEmail } = require('../emails/otpEmail');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined
  });

  return transporter;
}

/**
 * Send branded OTP email or print to console in dev mode
 * @param {Object} params
 * @param {string} params.to
 * @param {string} params.code
 * @param {('register'|'reset'|'login')} params.purpose
 */
async function sendOtpEmail({ to, code, purpose }) {
  const isProduction = process.env.NODE_ENV === 'production';
  const mailFrom = process.env.MAIL_FROM || 'Nexus <no-reply@yourdomain.com>';
  const ttlMinutes = parseInt(process.env.OTP_TTL_MINUTES || '10', 10);

  const { subject, html, text } = buildOtpEmail({
    to,
    code,
    purpose,
    ttlMinutes
  });

  const mailClient = getTransporter();

  // DEV MODE fallback: if not production and SMTP_HOST is not configured
  if (!isProduction && (!mailClient || !process.env.SMTP_HOST)) {
    console.log('[DEV OTP]', to, code);
    return { success: true, devMode: true };
  }

  if (!mailClient) {
    throw new Error('SMTP transport is not configured for production environment.');
  }

  const info = await mailClient.sendMail({
    from: mailFrom,
    to,
    subject,
    text,
    html
  });

  return { success: true, messageId: info.messageId };
}

module.exports = {
  sendOtpEmail
};

