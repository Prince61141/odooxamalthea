const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');

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
