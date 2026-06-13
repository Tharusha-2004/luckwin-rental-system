const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// ─── Helper: generate a signed JWT ───────────────────────────────────────────
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ─── POST /api/auth/register ──────────────────────────────────────────────────
// Creates a new user. Password is hashed automatically by the model's pre-save hook.
router.post('/register', async (req, res) => {
  try {
    const { name, username, password, role } = req.body;

    // Basic validation
    if (!name || !username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, username and password are required.',
      });
    }

    // Check for duplicate username
    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Username already taken. Please choose another.',
      });
    }

    const user = new User({ name, username, password, role });
    await user.save(); // pre-save hook hashes the password here

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    // Mongoose duplicate-key error (race condition safety net)
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Username already taken.',
      });
    }
    console.error('Register error:', err.message);
    return res.status(500).json({ success: false, error: 'Server error during registration.' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
// Authenticates a user and returns a JWT token + user details.
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required.',
      });
    }

    // Find user (case-insensitive via lowercase: true on schema)
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid username or password.' });
    }

    // Compare the supplied password against the stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid username or password.' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ success: false, error: 'Server error during login.' });
  }
});

module.exports = router;
