const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { authenticate, authorizeRoles } = require('../middleware/auth');

// Helper: Extract domain from email (e.g., "name@company.com" -> "company.com")
function getEmailDomain(email) {
  if (!email || !email.includes('@')) return '';
  return email.trim().toLowerCase().split('@')[1];
}

// 1. Provision Corporate Account (Admin ONLY)
router.post('/provision', authenticate, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, corporate email, and temporary password are required.' });
    }

    const assignedRole = role === 'Admin' ? 'Admin' : 'Member';
    const normalizedEmail = email.trim().toLowerCase();
    const domain = getEmailDomain(normalizedEmail);

    if (!domain) {
      return res.status(400).json({ message: 'A valid corporate email is required.' });
    }

    // Check admin's organization
    const organizationId = req.user.organizationId;
    let organization = null;

    if (organizationId) {
      organization = await Organization.findById(organizationId);
    }

    // Validate that the email domain matches the organization's allowed domains
    if (organization && organization.allowedDomains && organization.allowedDomains.length > 0) {
      const isAllowed = organization.allowedDomains.some(
        (d) => domain === d || domain.endsWith('.' + d)
      );

      if (!isAllowed) {
        return res.status(400).json({
          message: `Email domain "@${domain}" is not authorized for ${organization.orgName}. Allowed domains: ${organization.allowedDomains.join(', ')}`
        });
      }
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'An employee account with this email already exists.' });
    }

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: assignedRole,
      organization: organizationId || null
    });

    return res.status(201).json({
      message: 'Account provisioned successfully.',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        organization: organization ? organization.orgName : null
      }
    });
  } catch (error) {
    console.error('Provisioning error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// 2. Corporate Sign In (Universal Entrypoint for admin and employee)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Corporate email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const domain = getEmailDomain(normalizedEmail);

    if (!domain) {
      return res.status(400).json({ message: 'Invalid corporate email format.' });
    }

    // 1. Find user by email and populate organization
    const user = await User.findOne({ email: normalizedEmail }).populate('organization');
    if (!user) {
      return res.status(401).json({ message: 'Invalid corporate credentials.' });
    }

    // 2. Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid corporate credentials.' });
    }

    // 3. Resolve organization: if user already has org, use it; otherwise match by domain
    let organization = user.organization;
    if (!organization) {
      organization = await Organization.findOne({
        allowedDomains: domain,
        status: 'Active'
      });

      // Auto-associate user with matched organization
      if (organization) {
        user.organization = organization._id;
        await user.save();
      }
    }

    // Check if organization is active
    if (organization && organization.status && organization.status !== 'Active') {
      return res.status(403).json({
        message: 'Your organization account is inactive or suspended. Contact your IT administrator.'
      });
    }

    // 4. Issue JWT token with organizationId and role
    const orgId = organization ? organization._id : null;
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        organizationId: orgId
      },
      process.env.JWT_SECRET || 'nexus_super_secret_key',
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
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// 3. Fetch users scoped to caller's organization
router.get('/users', authenticate, async (req, res) => {
  try {
    const filter = {};
    if (req.user.organizationId) {
      filter.organization = req.user.organizationId;
    }
    const users = await User.find(filter, '-password').sort({ createdAt: -1 });
    return res.json({ users });
  } catch (error) {
    console.error('Fetch users error:', error);
    return res.status(500).json({ message: 'Internal server error while retrieving users.' });
  }
});

module.exports = router;
