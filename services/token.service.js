const jwt = require('jsonwebtoken');

const DEFAULT_SECRET = 'nexus_super_secret_jwt_key_2026';

function getJwtSecret() {
  return process.env.JWT_SECRET || DEFAULT_SECRET;
}

/**
 * Creates a short-lived signed JWT with an explicit purpose claim.
 * @param {Object} payload - Data payload (e.g. { email } or { userId, email })
 * @param {('register-verify'|'reset-verify'|'login-verify')} purpose
 * @param {string} [expiresIn='15m']
 */
function createPurposeToken(payload, purpose, expiresIn = '15m') {
  if (!purpose) {
    throw new Error('A purpose claim is required to create a verification token.');
  }

  // Ensure plain passwords are never placed inside tokens
  const safePayload = { ...payload };
  delete safePayload.password;
  delete safePayload.passwordHash;
  delete safePayload.admin_password;

  return jwt.sign(
    {
      ...safePayload,
      purpose
    },
    getJwtSecret(),
    { expiresIn }
  );
}

/**
 * Verifies a token and confirms its purpose matches the expected purpose.
 * @param {string} token
 * @param {('register-verify'|'reset-verify'|'login-verify')} expectedPurpose
 * @returns {Object} decoded payload
 */
function verifyPurposeToken(token, expectedPurpose) {
  if (!token) {
    const err = new Error('Verification token is missing.');
    err.status = 401;
    throw err;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (decoded.purpose !== expectedPurpose) {
      const err = new Error(`Invalid token purpose. Expected ${expectedPurpose}, got ${decoded.purpose}`);
      err.status = 403;
      throw err;
    }
    return decoded;
  } catch (error) {
    if (error.status) throw error;
    const err = new Error('Verification token is invalid or has expired.');
    err.status = 401;
    throw err;
  }
}

module.exports = {
  createPurposeToken,
  verifyPurposeToken
};

