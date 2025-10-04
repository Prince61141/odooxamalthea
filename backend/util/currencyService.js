const axios = require('axios');

// In-memory cache
let loadedAt = 0;
let currencyCodes = new Set(); // e.g. USD, EUR
let symbolToCode = {}; // e.g. { '$': 'USD', '€': 'EUR' }
let codePattern = /(USD|EUR)/; // default minimal pattern until loaded

const TTL = parseInt(process.env.CURRENCY_CACHE_TTL || (24 * 60 * 60 * 1000), 10); // 24h default

async function loadCurrencyData(force = false) {
  const now = Date.now();
  if (!force && loadedAt && (now - loadedAt) < TTL && currencyCodes.size) return; // still fresh
  try {
    const resp = await axios.get('https://restcountries.com/v3.1/all?fields=name,currencies');
    const codes = new Set();
    const symMap = {};
    resp.data.forEach(country => {
      const currs = country.currencies || {};
      Object.entries(currs).forEach(([code, meta]) => {
        codes.add(code.toUpperCase());
        if (meta && meta.symbol) {
          // Keep first mapping only to avoid overwriting with ambiguous ones
          if (!symMap[meta.symbol]) symMap[meta.symbol] = code.toUpperCase();
        }
      });
    });
    if (codes.size) {
      currencyCodes = codes;
      symbolToCode = symMap;
      // Build regex: longer codes first (just 3-letter mostly) + escape symbols
      const codeAlternation = Array.from(codes).sort().join('|');
      const symbolAlternation = Object.keys(symMap)
        .filter(s => /^[^A-Za-z0-9]$/.test(s)) // single non-alnum symbol
        .map(ch => `\\${ch}`) // escape
        .join('|');
      const patternStr = `(${codeAlternation}${symbolAlternation ? '|' + symbolAlternation : ''})`;
      codePattern = new RegExp(patternStr, 'i');
      loadedAt = now;
      if (process.env.OCR_DEBUG === 'true') {
        console.log('[currencyService] Loaded', codes.size, 'codes,', Object.keys(symMap).length, 'symbols');
      }
    }
  } catch (err) {
    console.warn('[currencyService] Failed to load currency data:', err.message);
  }
}

function getCurrencyRegex() { return codePattern; }
function getCurrencyCodes() { return Array.from(currencyCodes); }
function getSymbolMap() { return { ...symbolToCode }; }

function findCurrency(line) {
  const m = line.match(codePattern);
  if (!m) return null;
  const tok = m[1];
  if (tok.length === 3 && /[A-Za-z]{3}/.test(tok)) return tok.toUpperCase();
  if (symbolToCode[tok]) return symbolToCode[tok];
  return null;
}

module.exports = {
  ensureCurrencyDataLoaded: loadCurrencyData,
  getCurrencyRegex,
  getCurrencyCodes,
  getSymbolMap,
  findCurrency
};
