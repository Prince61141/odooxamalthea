const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true }, // currency of the amount submitted
  category: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  // Receipt attachment & OCR enrichment
  receiptUrl: { type: String }, // public URL to receipt in storage bucket
  ocrText: { type: String }, // raw extracted text
  ocrData: { // structured parsed data extracted from OCR heuristics
    amount: { type: Number },
    currency: { type: String },
    date: { type: Date },
    merchant: { type: String }
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  managerComment: { type: String },
  approvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Expense', expenseSchema);
