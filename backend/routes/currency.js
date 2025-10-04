const express = require('express');
const axios = require('axios');
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
