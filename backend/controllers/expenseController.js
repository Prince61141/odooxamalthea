const Expense = require('../models/Expense');
const User = require('../models/User');

exports.createExpense = async (req, res) => {
  try {
    const { amount, currency, category, description, date } = req.body;
    if (!amount || !currency || !category || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const expense = new Expense({
      user: req.user.id,
      company: req.user.company,
      amount,
      currency,
      category,
      description: description || '',
      date: new Date(date)
    });
    await expense.save();
    res.json({ message: 'Expense submitted', expense });
  } catch (e) {
    res.status(500).json({ error: 'Failed to submit expense' });
  }
};

exports.myExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(expenses);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load expenses' });
  }
};

// Manager: list team expenses (same company)
exports.teamExpenses = async (req, res) => {
  try {
    const { status } = req.query; // optional filter
    const filter = { company: req.user.company };
    if (status) filter.status = status;
    const expenses = await Expense.find(filter)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });
    res.json(expenses);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load team expenses' });
  }
};

// Manager: approve / reject
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body; // status = approved | rejected
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const expense = await Expense.findOne({ _id: id, company: req.user.company });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    expense.status = status;
    expense.managerComment = comment || '';
    expense.approvedAt = status === 'approved' ? new Date() : null;
    await expense.save();
    res.json({ message: 'Status updated', expense });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update status' });
  }
};

// Manager: summary analytics
exports.teamSummary = async (req, res) => {
  try {
    const company = req.user.company;
    // Aggregate totals per category
    const categoryAgg = await Expense.aggregate([
      { $match: { company } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);

    // Monthly trend (last 12 months)
    const since = new Date();
    since.setMonth(since.getMonth() - 11); // include current month
    const monthlyAgg = await Expense.aggregate([
      { $match: { company, date: { $gte: since } } },
      { $group: { _id: { y: { $year: '$date' }, m: { $month: '$date' } }, total: { $sum: '$amount' } } },
      { $sort: { '_id.y': 1, '_id.m': 1 } }
    ]);

    // Top employees
    const topEmployees = await Expense.aggregate([
      { $match: { company } },
      { $group: { _id: '$user', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      { $limit: 5 }
    ]);

    // Pending count
    const pendingCount = await Expense.countDocuments({ company, status: 'pending' });

    // Resolve employee names for topEmployees
    const userMap = {};
    if (topEmployees.length) {
      const ids = topEmployees.map(t => t._id);
      const users = await User.find({ _id: { $in: ids } }).select('name');
      users.forEach(u => { userMap[u._id.toString()] = u.name; });
    }

    res.json({
      categories: categoryAgg.map(c => ({ category: c._id, total: c.total })),
      monthly: monthlyAgg.map(m => ({ month: `${m._id.y}-${String(m._id.m).padStart(2,'0')}`, total: m.total })),
      topEmployees: topEmployees.map(t => ({ userId: t._id, name: userMap[t._id.toString()] || 'Unknown', total: t.total })),
      pendingCount
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load summary' });
  }
};
