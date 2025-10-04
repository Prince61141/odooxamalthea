const Expense = require('../models/Expense');
const User = require('../models/User');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { fileTypeFromBuffer } = require('file-type');

const currencyService = require('../util/currencyService');

function normalizeAmountString(raw) {
  if (!raw) return null;
  let r = String(raw).replace(/[^0-9.,]/g, '');
  if (/[,]\d{2}$/.test(r) && !r.includes('.')) r = r.replace(',', '.');
  r = r.replace(/(\d)[\s,](?=\d{3}(?:[\s.,]|$))/g, '$1');
  r = r.replace(/,(?=\d{3}(?:[\.,]|$))/g, '');
  r = r.replace(/\s+/g, '');
  const v = parseFloat(r);
  return (!isNaN(v) && v > 0 && v < 1e7) ? v : null;
}

function parseOcrText(text, currencyRegex, symbolMap) {
  if (!text || typeof text !== 'string') return {};

  // 1️⃣ Normalize OCR text
  let clean = text
    .replace(/\r/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/([A-Z])\s+([A-Z])/g, '$1$2') // merge split caps: "T O T A L" -> "TOTAL"
    .replace(/([0-9])\s+([0-9])/g, '$1$2') // merge split digits: "2 3 . 5 0" -> "23.50"
    .replace(/[^\x20-\x7E\n]/g, '')     // remove weird OCR chars
    .trim();

  const lines = clean.split(/\n/).map(l => l.trim()).filter(Boolean);
  let amount = null, currency = null, date = null, merchant = null;

  // 2️⃣ Define regex patterns
  const totalRegex = /(grand\s*total|total\s*due|amount\s*due|total|balance)/i;
  const moneyRegex = /([$€£₹]?\s?\d{1,3}(?:[\.,\s]?\d{3})*(?:[\.,]\d{2})?|[A-Za-z]{3}\s?\d+(?:[\.,]\d{2})?)/;
  const dateRegex = /(\b\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4}\b|\b\d{4}[\/\.\-]\d{1,2}[\/\.\-]\d{1,2}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{2,4}\b|\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{2,4}\b)/i;
  const currencyNameRegex = /(usd|inr|eur|gbp|jpy|cad|aud|dollar|rupee|euro|pound|yen)/i;

  const normalizeAmountRaw = (raw) => {
    if (!raw) return null;
    let r = raw.replace(/[^0-9.,]/g, '');
    // Convert European decimal comma if no dot present
    if (/[,]\d{2}$/.test(r) && !r.includes('.')) r = r.replace(',', '.');
    // Remove thousand separators (commas or spaces when clearly thousands)
    r = r.replace(/(\d)[\s,](?=\d{3}(?:[\s.,]|$))/g, '$1');
    r = r.replace(/,(?=\d{3}(?:[\.,]|$))/g, '');
    // Remove remaining spaces
    r = r.replace(/\s+/g, '');
    const v = parseFloat(r);
    return (!isNaN(v) && v > 0 && v < 1e7) ? v : null;
  };

  const parseDateSmart = (str, inferredCurrency) => {
    if (!str) return null;
    // Month name formats — let Date parse handle
    if (/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)/i.test(str)) {
      const d = new Date(str.replace(/(\d{1,2})(st|nd|rd|th)/i, '$1'));
      return isNaN(d) ? null : d;
    }
    // Numeric formats
    const m1 = str.match(/^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})$/);
    if (m1) {
      let a = parseInt(m1[1], 10), b = parseInt(m1[2], 10), y = parseInt(m1[3], 10);
      if (y < 100) y += 2000;
      // Disambiguate dd/mm vs mm/dd using simple rules and currency
      const isUsdStyle = ['USD','CAD','AUD'].includes((inferredCurrency || '').toUpperCase());
      let day, month;
      if (a > 12 && b <= 12) { day = a; month = b; }
      else if (b > 12 && a <= 12) { month = a; day = b; }
      else if (isUsdStyle) { month = a; day = b; }
      else { day = a; month = b; }
      const d = new Date(y, (month||1)-1, day||1);
      return isNaN(d) ? null : d;
    }
    const m2 = str.match(/^(\d{4})[\/\.\-](\d{1,2})[\/\.\-](\d{1,2})$/);
    if (m2) {
      const y = parseInt(m2[1], 10), m = parseInt(m2[2], 10), d = parseInt(m2[3], 10);
      const dt = new Date(y, m-1, d);
      return isNaN(dt) ? null : dt;
    }
    const d = new Date(str);
    return isNaN(d) ? null : d;
  };

  // 3️⃣ Try to find "total" line first
  // Build candidate lines, prioritize bottom-most totals
  const candidateLines = lines.filter(l => totalRegex.test(l)).concat(lines);

  // STRICT PASS: only capture amount immediately after (or before) a currency symbol/code
  const symbolTokens = Object.keys(symbolMap);
  const codeTokens = (currencyRegex ? currencyRegex.source : '').replace(/[()]/g,'').split('|').filter(t=> t.length===3 && /^[A-Za-z]{3}$/.test(t));
  const currencyWordTokens = ['USD','INR','EUR','GBP','JPY','CAD','AUD'];
  const allCurrencyIndicators = new Set([...symbolTokens, ...codeTokens, ...currencyWordTokens]);

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
    // Score lines for totals preference, scanning bottom-up
    const scoreLine = (l) => {
      if (/subtotal/i.test(l)) return -2;
      if (/(tax|tip|vat|service)/i.test(l)) return -3;
      if (/grand\s*total/i.test(l)) return 5;
      if (/total\s*due|amount\s*due/i.test(l)) return 4;
      if (/total/i.test(l)) return 3;
      if (/balance/i.test(l)) return 1;
      return 0;
    };
    let best = { score: -Infinity, idx: -1, val: null };
    for (let idx = lines.length - 1; idx >= 0; idx--) {
      const line = lines[idx];
      if (/order\s*#?|invoice\s*#?/i.test(line)) continue;
      // Detect currency if unknown
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
      if (!m) continue;
      // Support values like 'INR 1,234.00' or '$12.34'
      const raw = m[0];
      const val = normalizeAmountRaw(raw);
      if (val == null) continue;
      const score = scoreLine(line);
      const candidate = { score, idx, val };
      if (candidate.score > best.score || (candidate.score === best.score && candidate.idx > best.idx)) {
        best = candidate;
      }
      // Early exit if very strong signal found near bottom
      if (best.score >= 5 && best.idx >= lines.length - 5) break;
    }
    if (best.val != null) amount = best.val;
  }

  // Date detection after amount logic
  if (!date) {
    // Search from top and then bottom for a valid date, using currency to disambiguate
    for (const line of lines) {
      const dMatch = line.match(dateRegex);
      if (dMatch) {
        const parsed = parseDateSmart(dMatch[0], currency);
        if (parsed) { date = parsed; break; }
      }
    }
    if (!date) {
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        const dMatch = line.match(dateRegex);
        if (dMatch) {
          const parsed = parseDateSmart(dMatch[0], currency);
          if (parsed) { date = parsed; break; }
        }
      }
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
        const legacyParsed = parseOcrText(ocrText, currencyRegex, symbolMap);
        // Merge: prefer Gemini confident fields first
        parsed = { ...legacyParsed, ...parsed };
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
      company: req.user.companyId || req.user.company,
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

// Manager: list team expenses (only direct reports + self). Admin still sees company-wide when using this endpoint.
exports.teamExpenses = async (req, res) => {
  try {
    const { status } = req.query; // optional filter
    const baseCompany = req.user.companyId || req.user.company;
    const filter = { company: baseCompany };
    if (status) filter.status = status;

    if (req.user.role === 'manager') {
      const subs = await User.find({ manager: req.user.id }).select('_id');
      const ids = subs.map(u => u._id.toString());
      ids.push(req.user.id); // include manager's own expenses
      filter.user = { $in: ids };
    }
    // Admin: leave filter as whole company
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
    // Admin can update ANY expense; managers restricted to their company
    let expense;
    if (req.user.role === 'admin') {
      expense = await Expense.findById(id);
    } else {
      expense = await Expense.findOne({ _id: id, company: req.user.companyId || req.user.company });
    }
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

// Manager: summary analytics (scoped to direct reports + self for managers)
exports.teamSummary = async (req, res) => {
  try {
    const company = req.user.companyId || req.user.company;
    const mongoose = require('mongoose');
    const companyId = typeof company === 'string' ? new mongoose.Types.ObjectId(company) : company;

    let userScopeIds = null;
    if (req.user.role === 'manager') {
      const subs = await User.find({ manager: req.user.id }).select('_id');
      userScopeIds = subs.map(u => u._id.toString());
      userScopeIds.push(req.user.id);
    }
    const userIdObjs = userScopeIds ? userScopeIds.map(id => new mongoose.Types.ObjectId(id)) : null;
    const baseMatch = userIdObjs ? { company: companyId, user: { $in: userIdObjs } } : { company: companyId };

    // Category aggregation
    const categoryAgg = await Expense.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);

    // Monthly trend (12 months)
    const since = new Date();
    since.setMonth(since.getMonth() - 11);
    const monthlyAgg = await Expense.aggregate([
      { $match: { ...baseMatch, date: { $gte: since } } },
      { $group: { _id: { y: { $year: '$date' }, m: { $month: '$date' } }, total: { $sum: '$amount' } } },
      { $sort: { '_id.y': 1, '_id.m': 1 } }
    ]);

    // Top employees in scope
    const topEmployees = await Expense.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$user', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      { $limit: 5 }
    ]);

    // Pending count in scope
    const pendingCount = await Expense.countDocuments({ ...baseMatch, status: 'pending' });

    // Approval time
    const approvalAgg = await Expense.aggregate([
      { $match: { ...baseMatch, status: 'approved', approvedAt: { $ne: null } } },
      { $project: { diffHours: { $divide: [ { $subtract: ['$approvedAt', '$createdAt'] }, 1000 * 60 * 60 ] } } },
      { $group: { _id: null, avgHours: { $avg: '$diffHours' } } }
    ]);
    const averageApprovalHours = approvalAgg[0]?.avgHours || 0;

    // Velocity
    const now = new Date();
    const startCurrent = new Date(now); startCurrent.setDate(startCurrent.getDate()-6);
    const startPrev = new Date(startCurrent); startPrev.setDate(startPrev.getDate()-7);
    const velocityAgg = await Expense.aggregate([
      { $match: { ...baseMatch, date: { $gte: startPrev } } },
      { $project: { period: { $cond: [ { $gte: ['$date', startCurrent] }, 'current', 'previous' ] } } },
      { $group: { _id: '$period', count: { $sum: 1 } } }
    ]);
    let currentCount = 0, previousCount = 0;
    velocityAgg.forEach(r=> { if (r._id === 'current') currentCount = r.count; else if (r._id === 'previous') previousCount = r.count; });
    let velocityChangePct = null;
    if (previousCount === 0 && currentCount > 0) velocityChangePct = 100; else if (previousCount > 0) velocityChangePct = ((currentCount - previousCount) / previousCount) * 100;

    // Resolve names
    const userMap = {};
    if (topEmployees.length) {
      const ids = topEmployees.map(t => t._id);
      const users = await User.find({ _id: { $in: ids } }).select('name');
      users.forEach(u => { userMap[u._id.toString()] = u.name; });
    }

    const Company = require('../models/Company');
    const companyDoc = await Company.findById(companyId).select('currency');
    const currency = companyDoc?.currency || req.user.companyCurrency || 'USD';

    res.json({
      categories: categoryAgg.map(c => ({ category: c._id, total: c.total })),
      monthly: monthlyAgg.map(m => ({ month: `${m._id.y}-${String(m._id.m).padStart(2,'0')}`, total: m.total })),
      topEmployees: topEmployees.map(t => ({ userId: t._id, name: userMap[t._id.toString()] || 'Unknown', total: t.total })),
      pendingCount,
      averageApprovalHours,
      expenseVelocity: { current7d: currentCount, previous7d: previousCount, changePct: velocityChangePct },
      currency
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load summary' });
  }
};

// Admin: list all expenses across companies (optionally filter by status or company)
exports.allExpenses = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { status, company } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (company) filter.company = company;
    const expenses = await Expense.find(filter)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });
    res.json(expenses);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load expenses' });
  }
};

// Admin: global summary analytics (optionally restricted to a company via ?company=ID)
exports.allSummary = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { company } = req.query;
    const matchBase = company ? { company } : {};

    const categoryAgg = await Expense.aggregate([
      { $match: matchBase },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);

    const since = new Date();
    since.setMonth(since.getMonth() - 11);
    const monthlyAgg = await Expense.aggregate([
      { $match: { ...matchBase, date: { $gte: since } } },
      { $group: { _id: { y: { $year: '$date' }, m: { $month: '$date' } }, total: { $sum: '$amount' } } },
      { $sort: { '_id.y': 1, '_id.m': 1 } }
    ]);

    const topEmployees = await Expense.aggregate([
      { $match: matchBase },
      { $group: { _id: '$user', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      { $limit: 5 }
    ]);

    const pendingCount = await Expense.countDocuments({ ...matchBase, status: 'pending' });

    const approvalAgg = await Expense.aggregate([
      { $match: { ...matchBase, status: 'approved', approvedAt: { $ne: null } } },
      { $project: { diffHours: { $divide: [ { $subtract: ['$approvedAt', '$createdAt'] }, 1000 * 60 * 60 ] } } },
      { $group: { _id: null, avgHours: { $avg: '$diffHours' } } }
    ]);
    const averageApprovalHours = approvalAgg[0]?.avgHours || 0;

    const now = new Date();
    const startCurrent = new Date(now); startCurrent.setDate(startCurrent.getDate()-6);
    const startPrev = new Date(startCurrent); startPrev.setDate(startPrev.getDate()-7);
    const velocityAgg = await Expense.aggregate([
      { $match: { ...matchBase, date: { $gte: startPrev } } },
      { $project: { period: { $cond: [ { $gte: ['$date', startCurrent] }, 'current', 'previous' ] } } },
      { $group: { _id: '$period', count: { $sum: 1 } } }
    ]);
    let currentCount = 0, previousCount = 0;
    velocityAgg.forEach(r=> { if (r._id === 'current') currentCount = r.count; else if (r._id === 'previous') previousCount = r.count; });
    let velocityChangePct = null;
    if (previousCount === 0 && currentCount > 0) velocityChangePct = 100; else if (previousCount > 0) velocityChangePct = ((currentCount - previousCount) / previousCount) * 100;

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
      expenseVelocity: { current7d: currentCount, previous7d: previousCount, changePct: velocityChangePct }
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load global summary' });
  }
};
