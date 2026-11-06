const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const Organization = require('../models/Organization');
const PendingRegistration = require('../models/PendingRegistration');

const { issueOtp, verifyOtp } = require('../services/otp.service');
const { createPurposeToken, verifyPurposeToken } = require('../services/token.service');
const { otpSendLimiter, otpVerifyLimiter } = require('../middleware/otpRateLimit');

// Helper: Clean company domain string
function cleanDomain(domain) {
  if (!domain) return '';
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/^@/, '')
    .replace(/\/.*$/, '');
}

// Helper: Mask email for privacy (e.g. s***@acme.com)
function maskEmail(email) {
  if (!email || !email.includes('@')) return email || '';
  const [userPart, domainPart] = email.split('@');
  if (userPart.length <= 1) {
    return `${userPart}***@${domainPart}`;
  }
  return `${userPart[0]}***@${domainPart}`;
}

// ============================================================================
// 1. ORGANIZATION REGISTRATION WITH EMAIL OTP
// ============================================================================

/**
 * Step 1: Validate payload, hash password, save PendingRegistration, issue OTP
 * POST /api/auth/register-organization (and aliases)
 */
async function handleRegisterOrganization(req, res) {
  try {
    const {
      org_name,
      org_id,
      allowed_domains,
      website,
      description,
      admin_name,
      admin_email,
      admin_password
    } = req.body;

    if (!org_name || !org_id || !allowed_domains || !admin_name || !admin_email || !admin_password) {
      return res.status(400).json({
        message: 'All required fields must be provided (Organization Name, Code, Domain, Admin Name, Email, Password).'
      });
    }

    const orgName = org_name.trim();
    const orgId = org_id.trim().toUpperCase();
    const domain = cleanDomain(allowed_domains);
    const adminEmail = admin_email.trim().toLowerCase();
    const adminName = admin_name.trim();

    if (admin_password.length < 8) {
      return res.status(400).json({
        field: 'admin_password',
        message: 'Password must be at least 8 characters long.'
      });
    }

    // Verify administrator email domain matches company domain
    const emailDomain = adminEmail.split('@')[1];
    if (!emailDomain || (emailDomain !== domain && !emailDomain.endsWith('.' + domain))) {
      return res.status(400).json({
        field: 'admin_email',
        message: `Administrator email domain (@${emailDomain || 'invalid'}) must match corporate domain (@${domain}).`
      });
    }

    // Check for existing Organization by OrgId
    const existingOrgId = await Organization.findOne({ orgId });
    if (existingOrgId) {
      return res.status(409).json({
        field: 'org_id',
        message: `An organization with code "${orgId}" already exists.`
      });
    }

    // Check for existing Organization by Name
    const existingOrgName = await Organization.findOne({ orgName });
    if (existingOrgName) {
      return res.status(409).json({
        field: 'org_name',
        message: `An organization with name "${orgName}" already exists.`
      });
    }

    // Check for existing Organization by Domain
    const existingOrgDomain = await Organization.findOne({ allowedDomains: domain });
    if (existingOrgDomain) {
      return res.status(409).json({
        field: 'allowed_domains',
        message: `An organization with domain "@${domain}" is already registered.`
      });
    }

    // Check for existing User by Email
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      return res.status(409).json({
        field: 'admin_email',
        message: 'An account with this email address already exists.'
      });
    }

    // Hash the password before storing in pending record. Never store plain text.
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(admin_password, salt);

    const ttlMinutes = parseInt(process.env.OTP_TTL_MINUTES || '10', 10);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    // Upsert pending registration
    await PendingRegistration.findOneAndUpdate(
      { email: adminEmail },
      {
        email: adminEmail,
        payload: {
          org_name: orgName,
          org_id: orgId,
          allowed_domains: [domain],
          website: website ? website.trim() : '',
          description: description ? description.trim() : '',
          admin_name: adminName,
          passwordHash
        },
        expiresAt
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Issue OTP to admin_email (purpose 'register')
    await issueOtp({
      email: adminEmail,
      purpose: 'register',
      ip: req.ip
    });

    // Create 15-minute pending token
    const pendingToken = createPurposeToken({ email: adminEmail }, 'register-verify', '15m');

    return res.status(200).json({
      message: 'Verification code sent',
      otpRequired: true,
      pendingToken,
      email: maskEmail(adminEmail)
    });
  } catch (error) {
    console.error('Register organization init error:', error);
    if (error.status === 429) {
      return res.status(429).json({ message: error.message, retryAfterSeconds: error.retryAfterSeconds });
    }
    return res.status(500).json({
      message: error.message || 'Failed to initiate organization registration.'
    });
  }
}

router.post('/register-organization', otpSendLimiter, handleRegisterOrganization);
router.post('/register', otpSendLimiter, handleRegisterOrganization);

/**
 * Step 2: Verify OTP and create Organization + User
 * POST /api/auth/register-organization/verify
 */
router.post('/register-organization/verify', otpVerifyLimiter, async (req, res) => {
  try {
    const { pendingToken, code } = req.body;

    if (!pendingToken || !code) {
      return res.status(400).json({ message: 'Verification token and 6-digit code are required.' });
    }

    // 1. Verify purpose token
    const decoded = verifyPurposeToken(pendingToken, 'register-verify');

    // 2. Verify OTP code
    await verifyOtp({
      email: decoded.email,
      purpose: 'register',
      code
    });

    // 3. Retrieve Pending Registration
    const pending = await PendingRegistration.findOne({ email: decoded.email });
    if (!pending || !pending.payload) {
      return res.status(400).json({
        message: 'Registration session expired or not found. Please register again.'
      });
    }

    const {
      org_name,
      org_id,
      allowed_domains,
      website,
      description,
      admin_name,
      passwordHash
    } = pending.payload;

    // Double-check no conflicting record was created in the meantime
    const conflictOrg = await Organization.findOne({
      $or: [{ orgId: org_id }, { orgName: org_name }, { allowedDomains: allowed_domains[0] }]
    });
    if (conflictOrg) {
      return res.status(409).json({ message: 'Organization already exists or domain has been registered.' });
    }

    const conflictUser = await User.findOne({ email: decoded.email });
    if (conflictUser) {
      return res.status(409).json({ message: 'User account with this email already exists.' });
    }

    let newOrg = null;
    let newAdmin = null;

    // Attempt creation inside a transaction if replica set/Atlas supports it
    let useTransaction = true;
    let session = null;

    try {
      session = await mongoose.startSession();
      session.startTransaction();

      const createdOrgs = await Organization.create(
        [
          {
            orgId: org_id,
            orgName: org_name,
            allowedDomains: allowed_domains,
            website: website || '',
            description: description || '',
            status: 'Active',
            plan: 'Enterprise'
          }
        ],
        { session }
      );
      newOrg = createdOrgs[0];

      const createdAdmins = await User.create(
        [
          {
            name: admin_name,
            email: decoded.email,
            password: passwordHash,
            role: 'Admin',
            organization: newOrg._id
          }
        ],
        { session }
      );
      newAdmin = createdAdmins[0];

      newOrg.owner = newAdmin._id;
      newOrg.createdBy = newAdmin._id;
      newOrg.members = [
        {
          user: newAdmin._id,
          role: 'Owner',
          joinedAt: new Date()
        }
      ];
      await newOrg.save({ session });

      await PendingRegistration.deleteOne({ email: decoded.email }, { session });
      await session.commitTransaction();
    } catch (txError) {
      if (session) await session.abortTransaction();
      // If transactions are not supported on this deployment (e.g. standalone Mongo), fallback to sequential creation with rollback
      useTransaction = false;
    } finally {
      if (session) session.endSession();
    }

    // Fallback if transaction was not used
    if (!useTransaction) {
      try {
        newOrg = await Organization.create({
          orgId: org_id,
          orgName: org_name,
          allowedDomains: allowed_domains,
          website: website || '',
          description: description || '',
          status: 'Active',
          plan: 'Enterprise'
        });

        newAdmin = await User.create({
          name: admin_name,
          email: decoded.email,
          password: passwordHash,
          role: 'Admin',
          organization: newOrg._id
        });

        newOrg.owner = newAdmin._id;
        newOrg.createdBy = newAdmin._id;
        newOrg.members = [
          {
            user: newAdmin._id,
            role: 'Owner',
            joinedAt: new Date()
          }
        ];
        await newOrg.save();

        await PendingRegistration.deleteOne({ email: decoded.email });
      } catch (err) {
        // Cleanup on failure
        if (newAdmin?._id) await User.deleteOne({ _id: newAdmin._id });
        if (newOrg?._id) await Organization.deleteOne({ _id: newOrg._id });
        throw err;
      }
    }

    return res.status(201).json({
      message: 'Organization created',
      organization: {
        id: newOrg._id,
        orgId: newOrg.orgId,
        name: newOrg.orgName
      },
      admin: {
        id: newAdmin._id,
        email: newAdmin.email,
        name: newAdmin.name
      }
    });
  } catch (error) {
    console.error('Register organization verify error:', error);
    const status = error.status || 400;
    return res.status(status).json({
      message: error.message || 'Verification failed. Please try again.'
    });
  }
});

/**
 * Resend Registration OTP
 * POST /api/auth/register-organization/resend
 */
router.post('/register-organization/resend', otpSendLimiter, async (req, res) => {
  try {
    const { pendingToken } = req.body;
    if (!pendingToken) {
      return res.status(400).json({ message: 'Pending verification token is required.' });
    }

    const decoded = verifyPurposeToken(pendingToken, 'register-verify');

    // Confirm pending record still exists
    const pending = await PendingRegistration.findOne({ email: decoded.email });
    if (!pending) {
      return res.status(400).json({
        message: 'Registration session expired. Please start registration again.'
      });
    }

    await issueOtp({
      email: decoded.email,
      purpose: 'register',
      ip: req.ip
    });

    return res.status(200).json({
      message: 'Verification code resent',
      email: maskEmail(decoded.email)
    });
  } catch (error) {
    console.error('Resend registration OTP error:', error);
    const status = error.status || 500;
    return res.status(status).json({
      message: error.message || 'Failed to resend verification code.',
      retryAfterSeconds: error.retryAfterSeconds
    });
  }
});

// ============================================================================
// 2. PASSWORD RESET WITH EMAIL OTP
// ============================================================================

/**
 * Request Password Reset
 * POST /api/auth/password-reset/request
 * ALWAYS returns 200 to prevent email enumeration attacks.
 */
router.post('/password-reset/request', otpSendLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      // Return 200 anyway for consistency
      return res.status(200).json({ message: 'If that account exists, a code has been sent' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (user) {
      try {
        await issueOtp({
          email: normalizedEmail,
          purpose: 'reset',
          ip: req.ip
        });
      } catch (issueErr) {
        if (issueErr.code === 'COOLDOWN') {
          return res.status(429).json({
            message: issueErr.message,
            retryAfterSeconds: issueErr.retryAfterSeconds
          });
        }
        console.error('Issue reset OTP error:', issueErr);
      }
    }

    return res.status(200).json({
      message: 'If that account exists, a code has been sent',
      email: maskEmail(normalizedEmail)
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return res.status(200).json({ message: 'If that account exists, a code has been sent' });
  }
});

/**
 * Verify Password Reset Code
 * POST /api/auth/password-reset/verify
 * Returns resetToken on success.
 */
router.post('/password-reset/verify', otpVerifyLimiter, async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    await verifyOtp({
      email: normalizedEmail,
      purpose: 'reset',
      code
    });

    const resetToken = createPurposeToken({ email: normalizedEmail }, 'reset-verify', '15m');

    return res.status(200).json({
      message: 'Code verified successfully',
      resetToken
    });
  } catch (error) {
    console.error('Password reset verify error:', error);
    const status = error.status || 400;
    return res.status(status).json({
      message: error.message || 'Verification failed.'
    });
  }
});

/**
 * Confirm Password Reset
 * POST /api/auth/password-reset/confirm
 */
router.post('/password-reset/confirm', otpVerifyLimiter, async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Reset token and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    const decoded = verifyPurposeToken(resetToken, 'reset-verify');
    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      return res.status(404).json({ message: 'User account not found.' });
    }

    // Set new password (user pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      message: 'Password updated successfully. You can now sign in with your new password.'
    });
  } catch (error) {
    console.error('Password reset confirm error:', error);
    const status = error.status || 400;
    return res.status(status).json({
      message: error.message || 'Failed to update password.'
    });
  }
});

// ============================================================================
// 3. OPTIONAL LOGIN 2FA VERIFY
// ============================================================================

/**
 * Verify Login OTP (when OTP_LOGIN_ENABLED is true)
 * POST /api/auth/login/verify
 */
router.post('/login/verify', otpVerifyLimiter, async (req, res) => {
  try {
    const { loginToken, code } = req.body;

    if (!loginToken || !code) {
      return res.status(400).json({ message: 'Login token and verification code are required.' });
    }

    const decoded = verifyPurposeToken(loginToken, 'login-verify');

    await verifyOtp({
      email: decoded.email,
      purpose: 'login',
      code
    });

    const user = await User.findById(decoded.userId).populate('organization');
    if (!user) {
      return res.status(404).json({ message: 'User account not found.' });
    }

    const organization = user.organization;
    if (organization && organization.status && organization.status !== 'Active') {
      return res.status(403).json({
        message: 'Your organization account is inactive or suspended. Contact your IT administrator.'
      });
    }

    const orgId = organization ? organization._id : null;
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        organizationId: orgId
      },
      process.env.JWT_SECRET || 'nexus_super_secret_jwt_key_2026',
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: organization
          ? {
              id: organization._id,
              orgId: organization.orgId,
              name: organization.orgName
            }
          : null
      }
    });
  } catch (error) {
    console.error('Login verify error:', error);
    const status = error.status || 400;
    return res.status(status).json({
      message: error.message || 'Login verification failed.'
    });
  }
});

module.exports = router;

