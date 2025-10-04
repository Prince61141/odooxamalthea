const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../models/User');
const Company = require('../models/Company');
const { sendPasswordResetEmail } = require('../utils/emailService');

exports.signup = async (req, res) => {
  const { name, email, password, country } = req.body;
  if (!name || !email || !password || !country) return res.status(400).json({ error: 'All fields required' });
  try {
    let company = await Company.findOne({ country });
    if (!company) {
      const axios = require('axios');
      let currency = 'USD';
      try {
        const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,currencies');
        const countryData = response.data.find(c => c.name.common === country);
        if (countryData && countryData.currencies) {
          currency = Object.keys(countryData.currencies)[0];
        }
      } catch (e) {
      }
      company = new Company({ name, email, country, currency });
      await company.save();
    }
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: 'User already exists' });
    const hash = await bcrypt.hash(password, 10);
    user = new User({ name, email, password: hash, role: 'admin', company: company._id });
    await user.save();
    res.json({ message: 'Signup successful' });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed' });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).populate('company');
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
      companyId: user.company ? user.company._id : null,
      companyCurrency: user.company ? user.company.currency : null,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.json({
      message: 'Login successful',
      token,
      role: user.role,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      company: user.company
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Set token expiry to 1 hour from now
    user.resetToken = hashedToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    
    try {
      await sendPasswordResetEmail(user.email, user.name, resetUrl);
      res.json({ message: 'Reset link sent to your email!' });
    } catch (emailError) {
      // Clear reset token if email fails
      user.resetToken = undefined;
      user.resetTokenExpiry = undefined;
      await user.save();
      console.error('Email send error:', emailError);
      return res.status(500).json({ error: 'Failed to send reset email' });
    }
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process request' });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // Hash the token from URL to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    // Find user with valid token
    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hash = await bcrypt.hash(password, 10);
    
    // Update user password and clear reset token
    user.password = hash;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successful!' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};
