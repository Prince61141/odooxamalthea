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
    return res.json({ message: 'User created', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to create user' });
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
