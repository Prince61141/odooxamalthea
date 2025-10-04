const express = require('express');
const axios = require('axios');
const currencyService = require('../util/currencyService');
const router = express.Router();

router.get('/convert', async (req, res) => {
  const { from, to } = req.query;
  try {
    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${from}`);
    const rate = response.data.rates[to];
    if (!rate) return res.status(400).json({ error: 'Invalid target currency' });
    res.json({ rate });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversion rate' });
  }
});

module.exports = router;

// Additional endpoints
router.get('/codes', async (req, res) => {
  try {
    await currencyService.ensureCurrencyDataLoaded();
    res.json({ codes: currencyService.getCurrencyCodes() });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load currency codes' });
  }
});

