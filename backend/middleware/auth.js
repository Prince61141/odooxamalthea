const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded; // { id, role }
    // Optionally ensure user still exists
    const user = await User.findById(decoded.id).select('_id role company');
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user.role = user.role;
    req.user.company = user.company;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
