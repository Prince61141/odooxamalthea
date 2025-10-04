import React from 'react';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
};

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

export default function ExpenseTable({ data, onRowClick }) {
  return (
    <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wide">
          <tr>
            <th className="px-4 py-3 text-left">Employee</th>
            <th className="px-4 py-3 text-left">Category</th>
            <th className="px-4 py-3 text-left">Amount</th>
            <th className="px-4 py-3 text-left">Date</th>
            <th className="px-4 py-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map(exp => (
            <tr key={exp._id} onClick={() => onRowClick && onRowClick(exp)} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-0">
              <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-200">{exp.user?.name || '—'}</td>
              <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{exp.category}</td>
              <td className="px-4 py-2 text-slate-800 dark:text-slate-200">₹{Number(exp.amount).toFixed(2)}</td>
              <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{new Date(exp.date).toLocaleDateString()}</td>
              <td className="px-4 py-2"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[exp.status]}`}>{exp.status}</span></td>
            </tr>
          ))}
          {data.length===0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">No expenses</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
