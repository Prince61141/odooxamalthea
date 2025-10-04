const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const expenseController = require('../controllers/expenseController');

// POST /api/expenses -> submit expense
router.post('/', auth, expenseController.createExpense);
// GET /api/expenses/mine -> list my expenses
router.get('/mine', auth, expenseController.myExpenses);

module.exports = router;
