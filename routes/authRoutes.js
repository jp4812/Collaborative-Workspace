const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate, authorizeRoles } = require('../middleware/auth');

// Strict Corporate Subdomain Validators
const ADMIN_DOMAIN_REGEX = /^[a-zA-Z0-9._%+-]+@admin\.nexus\.in$/i;
const EMP_DOMAIN_REGEX = /^[a-zA-Z0-9._%+-]+@emp\.nexus\.in$/i;

// 1. Provision Corporate Account (Admin ONLY)
router.post('/provision', authenticate, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, corporate email, and temporary password are required.' });
    }

    const assignedRole = role === 'Admin' ? 'Admin' : 'Member';
    const normalizedEmail = email.trim().toLowerCase();

    // Domain Policy Enforcement
    if (assignedRole === 'Admin' && !ADMIN_DOMAIN_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        message: 'Admin accounts must use the @admin.nexus.in domain (e.g., username@admin.nexus.in).'
      });
    }

    if (assignedRole === 'Member' && !EMP_DOMAIN_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        message: 'Employee accounts must use the @emp.nexus.in domain (e.g., username@emp.nexus.in).'
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'An employee account with this email already exists.' });
    }

    const newUser = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: assignedRole
    });

    return res.status(201).json({
      message: 'Account provisioned successfully.',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Provisioning error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// 2. Corporate Sign In (Universal Entrypoint)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Corporate email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Basic Domain Structure Verification
    if (!ADMIN_DOMAIN_REGEX.test(normalizedEmail) && !EMP_DOMAIN_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        message: 'Invalid domain. Email must end with @admin.nexus.in or @emp.nexus.in.'
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid corporate credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid corporate credentials.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'nexus_super_secret_key',
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;