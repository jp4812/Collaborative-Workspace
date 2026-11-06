const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

// Helper to extract email from body or pendingToken if present
function extractEmailFromRequest(req) {
  if (req.body?.email) return req.body.email.toLowerCase().trim();
  if (req.body?.admin_email) return req.body.admin_email.toLowerCase().trim();
  if (req.body?.pendingToken) {
    try {
      const decoded = jwt.decode(req.body.pendingToken);
      if (decoded?.email) return decoded.email.toLowerCase().trim();
    } catch (_) {}
  }
  return '';
}

// 3 sends per 15 minutes per email AND per IP for send/resend routes
const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = extractEmailFromRequest(req);
    return `${req.ip}_${email}`;
  },
  handler: (req, res) => {
    return res.status(429).json({
      message: 'Too many attempts. Try again in a few minutes.'
    });
  }
});

// 10 requests per 15 minutes per IP on verify routes
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).json({
      message: 'Too many attempts. Try again in a few minutes.'
    });
  }
});

module.exports = {
  otpSendLimiter,
  otpVerifyLimiter
};

