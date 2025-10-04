import React, { useState } from 'react';

// Currency symbol helper
const getCurrencySymbol = (currency) => {
  const symbols = {
    'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'INR': '₹',
    'CAD': 'C$', 'AUD': 'A$', 'CNY': '¥', 'CHF': 'Fr', 'SEK': 'kr',
    'NZD': 'NZ$', 'SGD': 'S$', 'HKD': 'HK$', 'NOK': 'kr', 'KRW': '₩',
    'TRY': '₺', 'RUB': '₽', 'BRL': 'R$', 'ZAR': 'R', 'MXN': '$'
  };
  return symbols[currency] || currency || '₹';
};

export default function ExpenseDetailModal({ expense, onClose, onUpdate }) {
  const [status, setStatus] = useState('approved');
  const [comment, setComment] = useState('');
  if (!expense) return null;
  
  const currencySymbol = getCurrencySymbol(expense.currency);
  
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 space-y-4">
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Expense Detail</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">✕</button>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Field label="Employee" value={expense.user?.name} />
          <Field label="Category" value={expense.category} />
          <Field label="Amount" value={`₹${Number(expense.amount).toFixed(2)}`} />
          <Field label="Date" value={new Date(expense.date).toLocaleDateString()} />
          <Field label="Status" value={expense.status} />
          {expense.managerComment && <Field label="Prev Comment" value={expense.managerComment} />}
        </div>
        {expense.description && <p className="text-sm text-slate-600 dark:text-slate-400"><span className="font-medium text-slate-700 dark:text-slate-300">Description:</span> {expense.description}</p>}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
          <div className="flex gap-3">
            <select className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900" value={status} onChange={e=>setStatus(e.target.value)}>
              <option value="approved">Approve</option>
              <option value="rejected">Reject</option>
            </select>
            <input className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 placeholder-slate-400 dark:placeholder-slate-500" placeholder="Manager comment (optional)" value={comment} onChange={e=>setComment(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200">Cancel</button>
            <button onClick={()=>onUpdate({status, comment})} className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Submit</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const Field = ({ label, value }) => (
  <div className="space-y-1">
    <div className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-medium">{label}</div>
    <div className="font-medium text-slate-800 dark:text-slate-200 break-all">{value || '—'}</div>
  </div>
);
