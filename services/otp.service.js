const crypto = require('crypto');
const OtpCode = require('../models/OtpCode');
const { sendOtpEmail } = require('./mailer.service');

function getOtpSecret() {
  return process.env.OTP_SECRET || 'nexus-default-otp-secret-key-change-in-prod';
}

function hashCode(code) {
  return crypto.createHmac('sha256', getOtpSecret()).update(String(code).trim()).digest('hex');
}

function verifyHash(code, hash) {
  const candidateHash = hashCode(code);
  const a = Buffer.from(candidateHash, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Issues a new 6-digit OTP code, saves its HMAC hash, and sends an email.
 * @param {Object} params
 * @param {string} params.email
 * @param {('register'|'reset'|'login')} params.purpose
 * @param {string} [params.ip]
 */
async function issueOtp({ email, purpose, ip }) {
  if (!email || !purpose) {
    throw new Error('Email and purpose are required to issue an OTP.');
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Resend cooldown: refuse if the latest code for that email and purpose is under 60 seconds old
  const latestCode = await OtpCode.findOne({ email: normalizedEmail, purpose }).sort({ createdAt: -1 });
  if (latestCode) {
    const elapsedSeconds = Math.floor((Date.now() - latestCode.createdAt.getTime()) / 1000);
    if (elapsedSeconds < 60) {
      const retryAfterSeconds = 60 - elapsedSeconds;
      const err = new Error(`Please wait ${retryAfterSeconds} seconds before requesting a new code.`);
      err.retryAfterSeconds = retryAfterSeconds;
      err.status = 429;
      err.code = 'COOLDOWN';
      throw err;
    }
  }

  // Issuing a new code deletes/invalidates earlier unconsumed codes for the same email and purpose
  await OtpCode.deleteMany({ email: normalizedEmail, purpose, consumedAt: null });

  // Generate zero-padded 6-digit code
  const rawCode = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const codeHash = hashCode(rawCode);

  const ttlMinutes = parseInt(process.env.OTP_TTL_MINUTES || '10', 10);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await OtpCode.create({
    email: normalizedEmail,
    purpose,
    codeHash,
    ip: ip || null,
    expiresAt
  });

  // Send the email (or dev console fallback inside sendOtpEmail)
  await sendOtpEmail({
    to: normalizedEmail,
    code: rawCode,
    purpose
  });

  return {
    success: true,
    email: normalizedEmail
  };
}

/**
 * Verifies an OTP code against the latest unconsumed, unexpired code.
 * @param {Object} params
 * @param {string} params.email
 * @param {('register'|'reset'|'login')} params.purpose
 * @param {string} params.code
 * @returns {Promise<boolean>}
 */
async function verifyOtp({ email, purpose, code }) {
  if (!email || !purpose || !code) {
    const err = new Error('Email, purpose, and verification code are required.');
    err.status = 400;
    throw err;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const cleanCode = String(code).trim();

  if (!/^\d{6}$/.test(cleanCode)) {
    const err = new Error('Verification code must be exactly 6 digits.');
    err.status = 400;
    throw err;
  }

  // Find the latest unconsumed, unexpired code
  const record = await OtpCode.findOne({
    email: normalizedEmail,
    purpose,
    consumedAt: null,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (!record) {
    const err = new Error('Verification code is invalid or has expired.');
    err.status = 400;
    err.code = 'EXPIRED_OR_INVALID';
    throw err;
  }

  // Timing safe comparison of HMAC hashes
  const isMatch = verifyHash(cleanCode, record.codeHash);

  if (!isMatch) {
    record.attempts += 1;
    if (record.attempts >= record.maxAttempts) {
      await OtpCode.deleteOne({ _id: record._id });
      const err = new Error('Too many invalid attempts. Please request a new verification code.');
      err.status = 429;
      err.code = 'TOO_MANY_ATTEMPTS';
      throw err;
    }

    await record.save();
    const remaining = record.maxAttempts - record.attempts;
    const err = new Error(`Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
    err.status = 400;
    err.remainingAttempts = remaining;
    err.code = 'INVALID_CODE';
    throw err;
  }

  // Mark consumed on success
  record.consumedAt = new Date();
  await record.save();

  return true;
}

module.exports = {
  issueOtp,
  verifyOtp
};

