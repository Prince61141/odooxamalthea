const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  res.json({ message: 'Create user endpoint' });
});

router.patch('/:id/role', async (req, res) => {
  res.json({ message: 'Change user role endpoint' });
});

router.patch('/:id/manager', async (req, res) => {
  res.json({ message: 'Set manager endpoint' });
});

module.exports = router;
