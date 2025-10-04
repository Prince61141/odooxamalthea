const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const expenseController = require('../controllers/expenseController');
const multer = require('multer');
// memory storage: retain file in buffer then write to local filesystem in controller
const upload = multer({ storage: multer.memoryStorage() });

// Simple role guard
function requireManager(req, res, next) {
  if (req.user?.role !== 'manager' && req.user?.role !== 'admin') { // allow admin for oversight
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

// POST /api/expenses/receipt -> upload receipt & OCR (returns receiptUrl + ocr data)
router.post('/receipt', auth, upload.single('file'), expenseController.uploadReceipt);

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

// Admin: global expenses & summary
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
}
router.get('/all', auth, requireAdmin, expenseController.allExpenses);
router.get('/all/summary', auth, requireAdmin, expenseController.allSummary);

module.exports = router;
