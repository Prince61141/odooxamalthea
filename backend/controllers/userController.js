const User = require('../models/User');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// Simple cached mail client (transporter + metadata)
let mailClient = null;

async function getMailClient() {
  if (mailClient) return mailClient;
  if (process.env.SMTP_HOST && process.env.EMAIL_USER) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: (process.env.SMTP_SECURE || 'false') === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    mailClient = { transporter, ethereal: false };
    return mailClient;
  }

  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  mailClient = { transporter, ethereal: true, testAccount };
  return mailClient;
}

exports.createUser = async (req, res) => {
  try {
    const { name, email, role, managerId } = req.body;
    if (!name || !email || !role) return res.status(400).json({ error: 'Missing fields' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already in use' });

    const tempPassword = '123456';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    const payload = { name, email, role, company: req.user.companyId || null, password: hashedPassword };
    if (role === 'employee' && managerId) payload.manager = managerId;
    const user = new User(payload);
    await user.save();
    try {
    const { email, name, role = 'employee', managerId } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    // Find or create user with a temporary password
    let user = await User.findOne({ email });
    const tempPassword = process.env.INVITE_TEMP_PASSWORD || 'ChangeMe123!';
    if (!user) {
      const hashed = await bcrypt.hash(tempPassword, 10);
      const payload = { name: name || 'New User', email, role, company: req.user.companyId || null, password: hashed };
      if (role === 'employee' && managerId) payload.manager = managerId;
      user = new User(payload);
      await user.save();
    }

    const mail = await getMailClient();
    const transporter = mail.transporter;

    const from = process.env.FROM_EMAIL || `${process.env.APP_NAME || 'ExpenseApp'} <no-reply@example.com>`;
    const appName = process.env.APP_NAME || 'Expense Manager';
    const inviteBase = process.env.INVITE_URL_BASE || 'http://localhost:5173/login';
    const loginUrl = `${inviteBase}?email=${encodeURIComponent(email)}`;

    const text = `Hello ${name || ''}\n\nYou have been invited to join ${appName}.\n\nEmail: ${email}\nTemporary password: ${tempPassword}\n\nSign in: ${loginUrl}\n\nPlease change your password after first login.`;
    const html = `<p>Hello ${name || ''},</p><p>You have been invited to join <strong>${appName}</strong>.</p><p><b>Email:</b> ${email}<br/><b>Temporary password:</b> ${tempPassword}</p><p><a href="${loginUrl}">Sign in</a></p><p>Please change your password after first login.</p>`;

    const info = await transporter.sendMail({ from, to: email, subject: `${appName} - You're invited`, text, html });

    const response = { message: `Invite sent to ${email}`, user: { id: user._id, email: user.email } };
    if (mail.ethereal) {
      response.previewUrl = nodemailer.getTestMessageUrl(info) || null;
    }
    return res.json(response);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to send invite' });
  }
    return res.json({ message: 'User created', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to create user' });
  }
};

// Get current authenticated user profile
exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('_id name email role company manager createdAt');
    if(!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ id: user._id, name: user.name, email: user.email, role: user.role, company: user.company, manager: user.manager, createdAt: user.createdAt });
  } catch (e){
    return res.status(500).json({ error: 'Failed to load profile' });
  }
};

// Update current user (name and/or password)
exports.updateMe = async (req, res) => {
  try {
    const { name, password } = req.body;
    if(!name && !password) return res.status(400).json({ error: 'Nothing to update' });
    const user = await User.findById(req.user.id);
    if(!user) return res.status(404).json({ error: 'User not found' });
    if(name){ user.name = name; }
    if(password){
      if(String(password).length < 6) return res.status(400).json({ error: 'Password too short' });
      user.password = await bcrypt.hash(password, 10);
    }
    await user.save();
    return res.json({ id:user._id, name:user.name, email:user.email, role:user.role, company:user.company, manager:user.manager, createdAt:user.createdAt });
  } catch(e){
    return res.status(500).json({ error: 'Failed to update profile' });
  }
};

exports.listManagers = async (req, res) => {
  try {
    const filter = { role: 'manager' };
    if (req.user?.companyId) filter.company = req.user.companyId;
    const managers = await User.find(filter).select('_id name email');
    return res.json(managers);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load managers' });
  }
};

exports.sendInvite = async (req, res) => {
  try {
    const { email, name, role = 'employee', managerId } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    // Find or create user with a temporary password
    let user = await User.findOne({ email });
    const tempPassword = process.env.INVITE_TEMP_PASSWORD || 'ChangeMe123!';
    if (!user) {
      const hashed = await bcrypt.hash(tempPassword, 10);
      const payload = { name: name || 'New User', email, role, company: req.user.companyId || null, password: hashed };
      if (role === 'employee' && managerId) payload.manager = managerId;
      user = new User(payload);
      await user.save();
    }

    const mail = await getMailClient();
    const transporter = mail.transporter;

    const from = process.env.FROM_EMAIL || `${process.env.APP_NAME || 'ExpenseApp'} <no-reply@example.com>`;
    const appName = process.env.APP_NAME || 'Expense Manager';
    const inviteBase = process.env.INVITE_URL_BASE || 'http://localhost:5173/login';
    const loginUrl = `${inviteBase}?email=${encodeURIComponent(email)}`;

    const text = `Hello ${name || ''}\n\nYou have been invited to join ${appName}.\n\nEmail: ${email}\nTemporary password: ${tempPassword}\n\nSign in: ${loginUrl}\n\nPlease change your password after first login.`;
    const html = `<p>Hello ${name || ''},</p><p>You have been invited to join <strong>${appName}</strong>.</p><p><b>Email:</b> ${email}<br/><b>Temporary password:</b> ${tempPassword}</p><p><a href="${loginUrl}">Sign in</a></p><p>Please change your password after first login.</p>`;

    const info = await transporter.sendMail({ from, to: email, subject: `${appName} - You're invited`, text, html });

    const response = { message: `Invite sent to ${email}`, user: { id: user._id, email: user.email } };
    if (mail.ethereal) {
      // Provide preview URL for dev
      response.previewUrl = nodemailer.getTestMessageUrl(info) || null;
    }
    return res.json(response);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to send invite' });
  }
};

// Admin: summary metrics for dashboard
exports.summary = async (req, res) => {
  try {
    const company = req.user.companyId || req.user.company;
    const filter = company ? { company } : {};
    const [totalUsers, managers, employees, latestUser] = await Promise.all([
      User.countDocuments(filter),
      User.countDocuments({ ...filter, role: 'manager' }),
      User.countDocuments({ ...filter, role: 'employee' }),
      User.findOne(filter).sort({ createdAt: -1 }).select('createdAt role')
    ]);

    let avgEmployeesPerManager = 0;
    if (managers > 0) {
      const employeeCounts = await User.aggregate([
        { $match: { ...filter, role: 'employee' } },
        { $group: { _id: '$manager', count: { $sum: 1 } } }
      ]);
      if (employeeCounts.length) {
        const totalEmp = employeeCounts.reduce((a, b) => a + b.count, 0);
        avgEmployeesPerManager = totalEmp / managers;
      }
    }

    const since = new Date();
    since.setDate(since.getDate() - 30);
    const recent = await User.countDocuments({ ...filter, createdAt: { $gte: since } });

    return res.json({
      totalUsers,
      managers,
      employees,
      avgEmployeesPerManager: Number(avgEmployeesPerManager.toFixed(2)),
      recentNewUsers30d: recent,
      latestUserCreatedAt: latestUser?.createdAt || null
    });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load summary' });
  }
};

// Admin: list all users
exports.listAll = async (req, res) => {
  try {
    const company = req.user.companyId || req.user.company;
    const filter = company ? { company } : {};
    const users = await User.find(filter)
      .select('name email role createdAt manager')
      .populate('manager', 'name email')
      .sort({ createdAt: -1 });
    return res.json(users);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load users' });
  }
};

// Admin: delete a user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'User ID required' });
    
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Prevent deleting yourself
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // Optional: Check if user belongs to same company
    const company = req.user.companyId || req.user.company;
    if (company && user.company && user.company.toString() !== company.toString()) {
      return res.status(403).json({ error: 'Cannot delete users from other companies' });
    }
    
    await User.findByIdAndDelete(id);
    return res.json({ message: 'User deleted successfully' });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to delete user' });
  }
};
