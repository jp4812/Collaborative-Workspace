var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var User = require('../models/User');

var router = express.Router();

// SIGNUP
router.post('/register', async function (req, res) {
  try {
    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;
    var role = req.body.role;

    // 1. Presence and length checks
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // 2. Normalize email
    var normalizedEmail = email.trim().toLowerCase();

    var existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // 3. Hash password
    var hashedPassword = await bcrypt.hash(password, 10);

    // 4. Validate role against schema enum ['Admin', 'Member']
    var userRole = (role === 'Admin') ? 'Admin' : 'Member';

    var user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: userRole
    });

    return res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// LOGIN
router.post('/login', async function (req, res) {
  try {
    var email = req.body.email;
    var password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    var normalizedEmail = email.trim().toLowerCase();

    var user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    var passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    var secret = process.env.JWT_SECRET || 'workspace_jwt_secret_key';

    var token = jwt.sign(
      { id: user._id, role: user.role },
      secret,
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;