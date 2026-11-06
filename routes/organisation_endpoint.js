const express = require('express');
const router = express.Router();
const Organization = require('../models/Organization');
const User = require('../models/User');

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

// Handler function for registering organization + root administrator
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

    // Validate required fields
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
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    // Verify administrator email domain matches company domain
    const emailDomain = adminEmail.split('@')[1];
    if (!emailDomain || (emailDomain !== domain && !emailDomain.endsWith('.' + domain))) {
      return res.status(400).json({
        message: `Administrator email domain (@${emailDomain || 'invalid'}) must match the corporate domain (@${domain}).`
      });
    }

    // Check for existing Organization by OrgId
    const existingOrgId = await Organization.findOne({ orgId });
    if (existingOrgId) {
      return res.status(409).json({ message: `An organization with code "${orgId}" already exists.` });
    }

    // Check for existing Organization by Name
    const existingOrgName = await Organization.findOne({ orgName });
    if (existingOrgName) {
      return res.status(409).json({ message: `An organization with name "${orgName}" already exists.` });
    }

    // Check for existing Organization by Domain
    const existingOrgDomain = await Organization.findOne({ allowedDomains: domain });
    if (existingOrgDomain) {
      return res.status(409).json({ message: `An organization with domain "@${domain}" is already registered.` });
    }

    // Check for existing User by Email
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email address already exists.' });
    }

    // 1. Create the Organization
    const newOrg = await Organization.create({
      orgId,
      orgName,
      allowedDomains: [domain],
      website: website ? website.trim() : '',
      description: description ? description.trim() : '',
      status: 'Active',
      plan: 'Enterprise'
    });

    // 2. Create the Root Administrator User
    const newAdmin = await User.create({
      name: adminName,
      email: adminEmail,
      password: admin_password,
      role: 'Admin',
      organization: newOrg._id
    });

    // 3. Link Administrator as Owner and Member
    newOrg.owner = newAdmin._id;
    newOrg.members = [
      {
        user: newAdmin._id,
        role: 'Owner',
        joinedAt: new Date()
      }
    ];
    newOrg.createdBy = newAdmin._id;
    await newOrg.save();

    return res.status(201).json({
      message: 'Organization and administrator account registered successfully.',
      organization: {
        id: newOrg._id,
        orgId: newOrg.orgId,
        name: newOrg.orgName,
        domain: domain
      },
      admin: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });
  } catch (error) {
    console.error('Register organization error:', error);
    return res.status(500).json({
      message: 'Failed to register organization due to server error.',
      error: error.message
    });
  }
}

// Primary Route: POST /register-organization
router.post('/register-organization', handleRegisterOrganization);

// Aliases: POST /register and POST /
router.post('/register', handleRegisterOrganization);
router.post('/', handleRegisterOrganization);

module.exports = router;

