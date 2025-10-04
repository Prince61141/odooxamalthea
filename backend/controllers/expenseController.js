const Expense = require('../models/Expense');
const User = require('../models/User');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { fileTypeFromBuffer } = require('file-type');

const currencyService = require('../util/currencyService');

// Improved OCR text parser: handles broken text, noisy OCR, and detached symbols
function parseOcrText(text, currencyRegex, symbolMap) {
  if (!text || typeof text !== 'string') return {};

  // 1️⃣ Normalize OCR text
  let clean = text
    .replace(/\r/g, '\n')
    .replace(/[^\S\n]+/g, ' ')          // collapse extra spaces
    .replace(/([A-Z])\s+([A-Z])/g, '$1$2') // merge split caps: "T O T A L" -> "TOTAL"
    .replace(/([0-9])\s+([0-9])/g, '$1$2') // merge split digits: "2 3 . 5 0" -> "23.50"
    .replace(/[^\x20-\x7E\n]/g, '')     // remove weird OCR chars
    .trim();

  const lines = clean.split(/\n/).map(l => l.trim()).filter(Boolean);
  let amount = null, currency = null, date = null, merchant = null;

  // 2️⃣ Define regex patterns
  const totalRegex = /(total|amount|balance|grand\s*total)/i;
  const moneyRegex = /([$€£₹]?\s?\d{1,3}(?:[,\d]{0,})?(?:[.,]\d{2})?)/;
  const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/;
  const currencyNameRegex = /(usd|inr|eur|gbp|jpy|cad|aud|dollar|rupee|euro|pound|yen)/i;

  // 3️⃣ Try to find "total" line first
  const candidateLines = lines.filter(l => totalRegex.test(l)).concat(lines);

  // STRICT PASS: only capture amount immediately after (or before) a currency symbol/code
  const symbolTokens = Object.keys(symbolMap);
  const codeTokens = (currencyRegex ? currencyRegex.source : '').replace(/[()]/g,'').split('|').filter(t=> t.length===3 && /^[A-Za-z]{3}$/.test(t));
  const currencyWordTokens = ['USD','INR','EUR','GBP','JPY','CAD','AUD'];
  const allCurrencyIndicators = new Set([...symbolTokens, ...codeTokens, ...currencyWordTokens]);

  const normalizeAmountRaw = (raw) => {
    if (!raw) return null;
    let r = raw.replace(/[^0-9.,]/g,'');
    if (/[,]\d{2}$/.test(r) && !r.includes('.')) r = r.replace(',', '.');
    r = r.replace(/,(?=\d{3}(?:[.,]|$))/g,'');
    r = r.replace(/,/g,'');
    const v = parseFloat(r);
    return (!isNaN(v) && v>0 && v<1e7) ? v : null;
  };

  let strictFound = false;
  for (const line of candidateLines) {
    if (!line) continue;
    // Tokenize by spaces to inspect adjacency
    const rawTokens = line.split(/\s+/).filter(Boolean);
    for (let i=0;i<rawTokens.length;i++) {
      const tok = rawTokens[i];
      // Resolve currency for this token (symbol or code or name)
      let tokCurrency = null;
      if (symbolMap[tok]) tokCurrency = symbolMap[tok];
      else if (/^[A-Za-z]{3}$/.test(tok) && allCurrencyIndicators.has(tok.toUpperCase())) tokCurrency = tok.toUpperCase();
      else if (/dollar/i.test(tok)) tokCurrency = 'USD';
      else if (/rupee/i.test(tok)) tokCurrency = 'INR';
      else if (/euro/i.test(tok)) tokCurrency = 'EUR';
      else if (/pound/i.test(tok)) tokCurrency = 'GBP';
      else if (/yen/i.test(tok)) tokCurrency = 'JPY';

      if (tokCurrency) {
        // Look right then left for amount pattern
        const right = rawTokens[i+1];
        const left = rawTokens[i-1];
        const amountCandidate = [right, left].find(t => t && /^(?:[$€£₹]?\d[0-9.,]*)$/.test(t));
        if (amountCandidate && !strictFound) {
          const val = normalizeAmountRaw(amountCandidate);
            if (val !== null) {
              amount = val;
              currency = currency || tokCurrency;
              strictFound = true;
              if (process.env.OCR_DEBUG === 'true') console.log('[ocr.debug] strict currency-adjacent amount', { tokCurrency, amountCandidate, line });
              break;
            }
        }
        // Special case: combined like $23.50 or EUR23.50
        if (!strictFound && /^(?:[$€£₹][0-9]|[A-Za-z]{3}\d)/.test(tok)) {
          const m = tok.match(/([$€£₹A-Za-z]{0,3})([0-9][0-9.,]*)/);
          if (m) {
            const val = normalizeAmountRaw(m[2]);
            if (val !== null) {
              amount = val;
              currency = currency || tokCurrency;
              strictFound = true;
              if (process.env.OCR_DEBUG === 'true') console.log('[ocr.debug] strict inline token', { tokCurrency, token: tok, amount: val });
            }
          }
        }
      }
    }
    // Merchant inference (outside strict amount capture but still early)
    if (!merchant && /[A-Za-z]/.test(line) && !/order\s*#?/i.test(line) && !/invoice\s*#?/i.test(line)) {
      if (!/(total|amount|balance|grand\s*total)/i.test(line)) {
        merchant = line.slice(0,50);
      }
    }
    if (strictFound && currency && merchant) break; // date can be later
  }

  // If strict pass failed to find amount, fall back to previous simpler logic (but excluding obvious order/invoice numbers)
  if (!amount) {
    for (const line of candidateLines) {
      if (/order\s*#?|invoice\s*#?/i.test(line)) continue; // skip order/invoice lines
      if (!currency) {
        const sym = Object.keys(symbolMap).find(s => line.includes(s));
        if (sym) currency = symbolMap[sym];
        const iso = line.match(currencyRegex) || line.match(currencyNameRegex);
        if (iso) {
          const codeToken = iso[1].toUpperCase();
          const base = codeToken.slice(0,3);
          if (/^[A-Z]{3}$/.test(base)) currency = base;
          if (/DOLLAR/i.test(codeToken)) currency = 'USD';
          if (/RUPEE/i.test(codeToken)) currency = 'INR';
          if (/EURO/i.test(codeToken)) currency = 'EUR';
          if (/POUND/i.test(codeToken)) currency = 'GBP';
          if (/YEN/i.test(codeToken)) currency = 'JPY';
        }
      }
      const m = line.match(moneyRegex);
      if (m) {
        let raw = m[1].replace(/[^0-9.,]/g, '');
        if (/[,]\d{2}$/.test(raw) && !raw.includes('.')) raw = raw.replace(',', '.');
        raw = raw.replace(/,(?=\d{3}(?:[.,]|$))/g,'');
        raw = raw.replace(/,/g,'');
        const val = parseFloat(raw);
        if (!isNaN(val) && val > 0 && val < 1e7) { amount = val; break; }
      }
    }
  }

  // Date detection after amount logic
  if (!date) {
    for (const line of candidateLines) {
      const dMatch = line.match(dateRegex);
      if (dMatch) { const parsed = new Date(dMatch[1]); if (!isNaN(parsed)) { date = parsed; break; } }
    }
  }

  // If still no merchant, pick first reasonable alpha line
  if (!merchant) {
    merchant = lines.find(l => /[A-Za-z]{3}/.test(l) && !/(total|amount|balance|grand\s*total|order\s*#?|invoice\s*#?)/i.test(l)) || 'Unknown Merchant';
    merchant = merchant.slice(0,50);
  }

  // 4️⃣ Fallbacks
  if (!amount) {
    const allNums = clean.match(/\d+[.,]\d{2}/g);
    if (allNums) {
      const vals = allNums.map(v => parseFloat(v.replace(',', '.'))).filter(v => !isNaN(v));
      if (vals.length) amount = Math.max(...vals.filter(v => v < 1e7));
    }
  }

  if (!currency) currency = 'USD'; // fallback
  if (!date) date = new Date();
  if (!merchant) merchant = 'Unknown Merchant';

  return { amount, currency, date, merchant };
}

// POST /api/expenses/receipt (multipart/form-data: file)
exports.uploadReceipt = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const buffer = req.file.buffer;
    if (buffer.length > 5 * 1024 * 1024) return res.status(400).json({ error: 'File too large (max 5MB)' });
    const type = await fileTypeFromBuffer(buffer);
    if (!type || !['image/png','image/jpeg','application/pdf'].includes(type.mime)) {
      return res.status(400).json({ error: 'Unsupported file type' });
    }
    // IMPORTANT: Must mirror the directory served in server.js (path.join(__dirname, '..', 'uploads'))
    const uploadDir = process.env.UPLOAD_DIR
      ? path.isAbsolute(process.env.UPLOAD_DIR)
        ? process.env.UPLOAD_DIR
        : path.join(__dirname, '..', process.env.UPLOAD_DIR)
      : path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const userDir = path.join(uploadDir, String(req.user.id));
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
    const ext = type.ext === 'jpeg' ? 'jpg' : type.ext;
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = path.join(userDir, filename);
    fs.writeFileSync(filePath, buffer);
    // Public URL (served statically) relative path
    const receiptUrl = `/uploads/${req.user.id}/${filename}`;

  let ocrText = '';
  let parsed = {};
    if (process.env.OCR_API_URL && process.env.OCR_API_KEY) {
      try {
        const base64 = buffer.toString('base64');
        const lang = process.env.OCR_LANGUAGE || 'eng';
        // OCR.space expects multipart/form-data or application/x-www-form-urlencoded with specific params.
        // We'll send form-data style using axios FormData polyfill approach.
        const form = new URLSearchParams();
        form.append('language', lang);
        form.append('isOverlayRequired', 'false');
        form.append('base64Image', `data:${type.mime};base64,${base64}`);
        // scale & OCREngine can be tuned; using defaults.
        const ocrResp = await axios.post(process.env.OCR_API_URL, form.toString(), {
          headers: {
            'apikey': process.env.OCR_API_KEY,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          maxBodyLength: 15 * 1024 * 1024
        });
        const parsedResult = ocrResp.data?.ParsedResults?.[0];
        ocrText = parsedResult?.ParsedText || '';
        await currencyService.ensureCurrencyDataLoaded();
        const currencyRegex = currencyService.getCurrencyRegex();
        const symbolMap = currencyService.getSymbolMap();
        parsed = parseOcrText(ocrText, currencyRegex, symbolMap);
        if (process.env.OCR_DEBUG === 'true') {
          console.log('[ocr.debug] raw length:', ocrText.length, 'parsed:', parsed);
        }
      } catch (err) {
        console.warn('[ocr] failed', err.message);
      }
    }
    // Fallback: filename heuristic if OCR absent or missing amount/date
    if (!parsed.amount || !parsed.date) {
      const base = req.file.originalname.toLowerCase();
      const amtMatch = base.match(/(\d+)(?:[\.-](\d{2}))?/); // e.g., 45 or 45-67
      if (!parsed.amount && amtMatch) {
        const whole = amtMatch[1];
        const dec = amtMatch[2];
        const comb = dec ? `${whole}.${dec}` : whole;
        const val = parseFloat(comb);
        if (!isNaN(val)) parsed.amount = val;
      }
      if (!parsed.date) {
        const dateMatch = base.match(/(20\d{2})[-_](0?[1-9]|1[0-2])[-_](0?[1-9]|[12]\d|3[01])/); // 2025-10-04 patterns
        if (dateMatch) {
          const dstr = `${dateMatch[1]}-${dateMatch[2].padStart(2,'0')}-${dateMatch[3].padStart(2,'0')}`;
          const d = new Date(dstr); if (!isNaN(d.getTime())) parsed.date = d; }
      }
      if (!parsed.currency) {
        if (/usd|dollar/.test(base)) parsed.currency = 'USD';
        else if (/inr|rupee/.test(base)) parsed.currency = 'INR';
        else if (/eur|euro/.test(base)) parsed.currency = 'EUR';
      }
      if (!parsed.merchant) {
        const merchantGuess = base.replace(/\.(png|jpe?g|pdf)$/,'').replace(/[\d_-]+/g,' ').trim();
        if (merchantGuess) parsed.merchant = merchantGuess.split(' ').slice(0,3).join(' ');
      }
    }
    res.json({ receiptUrl, ocrText, ocrData: parsed });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Receipt processing failed' });
  }
};

exports.createExpense = async (req, res) => {
  try {
    let { amount, currency, category, description, date, receiptUrl, ocrText, ocrData } = req.body;
    // Accept JSON string for ocrData if sent that way
    if (typeof ocrData === 'string') {
      try { ocrData = JSON.parse(ocrData); } catch { ocrData = undefined; }
    }
    // If OCR provided fields but client omitted some required manual fields, attempt autopopulate
    if ((!amount || !currency || !date || !category) && ocrData) {
      amount = amount || ocrData.amount;
      currency = currency || ocrData.currency || 'USD';
      date = date || ocrData.date;
      if (!category && description) {
        // naive category inference
        const descLower = description.toLowerCase();
        if (/uber|taxi|flight|air|hotel/.test(descLower)) category = 'Travel';
        else if (/meal|food|restaurant|cafe/.test(descLower)) category = 'Meals';
        else category = 'Other';
      }
    }
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
      date: new Date(date),
      receiptUrl: receiptUrl || undefined,
      ocrText: ocrText || undefined,
      ocrData: ocrData ? {
        amount: ocrData.amount,
        currency: ocrData.currency,
        date: ocrData.date ? new Date(ocrData.date) : undefined,
        merchant: ocrData.merchant
      } : undefined
    });
    await expense.save();
    res.json({ message: 'Expense submitted', expense });
  } catch (e) {
    console.error(e);
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

    // Average approval time (approved expenses): difference between createdAt and approvedAt (or updatedAt) in hours
    const approvalAgg = await Expense.aggregate([
      { $match: { company, status: 'approved', approvedAt: { $ne: null } } },
      { $project: { diffHours: { $divide: [ { $subtract: ['$approvedAt', '$createdAt'] }, 1000 * 60 * 60 ] } } },
      { $group: { _id: null, avgHours: { $avg: '$diffHours' } } }
    ]);
    const averageApprovalHours = approvalAgg[0]?.avgHours || 0;

    // Expense velocity: compare count of expenses last 7 days vs previous 7 days
    const now = new Date();
    const startCurrent = new Date(now); startCurrent.setDate(startCurrent.getDate()-6); // inclusive 7 day window
    const startPrev = new Date(startCurrent); startPrev.setDate(startPrev.getDate()-7);
    const velocityAgg = await Expense.aggregate([
      { $match: { company, date: { $gte: startPrev } } },
      { $project: { period: { $cond: [ { $gte: ['$date', startCurrent] }, 'current', 'previous' ] } } },
      { $group: { _id: '$period', count: { $sum: 1 } } }
    ]);
    let currentCount = 0, previousCount = 0;
    velocityAgg.forEach(r=> { if (r._id === 'current') currentCount = r.count; else if (r._id === 'previous') previousCount = r.count; });
    let velocityChangePct = null;
    if (previousCount === 0 && currentCount > 0) velocityChangePct = 100;
    else if (previousCount > 0) velocityChangePct = ((currentCount - previousCount) / previousCount) * 100;

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
      pendingCount,
      averageApprovalHours,
      expenseVelocity: {
        current7d: currentCount,
        previous7d: previousCount,
        changePct: velocityChangePct
      }
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load summary' });
  }
};
