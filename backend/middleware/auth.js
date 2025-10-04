const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    // Prime req.user from JWT payload
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
      companyId: decoded.companyId || null,
      companyCurrency: decoded.companyCurrency || null,
    };
    // Ensure user still exists and sync role/company
    const user = await User.findById(decoded.id).select('_id role company');
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user.role = user.role;
    if (user.company) req.user.companyId = String(user.company);
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  return next();
};

const requireRoles = (roles = []) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (roles.length && !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return next();
};

module.exports = { auth, requireAdmin, requireRoles };
