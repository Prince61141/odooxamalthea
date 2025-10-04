const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const expenseController = require('../controllers/expenseController');

// Simple role guard
function requireManager(req, res, next) {
  if (req.user?.role !== 'manager' && req.user?.role !== 'admin') { // allow admin for oversight
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

// POST /api/expenses -> submit expense
router.post('/', auth, expenseController.createExpense);
// GET /api/expenses/mine -> list my expenses
router.get('/mine', auth, expenseController.myExpenses);

// Manager: list team expenses
router.get('/team', auth, requireManager, expenseController.teamExpenses);
// Manager: update status
router.put('/:id/status', auth, requireManager, expenseController.updateStatus);
// Manager: summary analytics
router.get('/team/summary', auth, requireManager, expenseController.teamSummary);

module.exports = router;
