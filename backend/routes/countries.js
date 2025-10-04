const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,currencies');
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
});

module.exports = router;
