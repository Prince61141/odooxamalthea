const Expense = require('../models/Expense');

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
