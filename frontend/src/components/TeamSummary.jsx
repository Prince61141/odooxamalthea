import React from 'react';

export default function TeamSummary({ expenses, currency }) {
  // Currency symbol helper
  const getCurrencySymbol = (curr) => {
    const symbols = {
      'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'INR': '₹',
      'CAD': 'C$', 'AUD': 'A$', 'CNY': '¥', 'CHF': 'Fr', 'SEK': 'kr',
      'NZD': 'NZ$', 'SGD': 'S$', 'HKD': 'HK$', 'NOK': 'kr', 'KRW': '₩',
      'TRY': '₺', 'RUB': '₽', 'BRL': 'R$', 'ZAR': 'R', 'MXN': '$'
    };
    return symbols[curr] || curr || '$';
  };
  
  const currencySymbol = getCurrencySymbol(currency);
  
  // Aggregate totals per user
  const totals = {};
  expenses.forEach(e => {
    if (!e.user) return;
    const id = e.user._id || e.user.id || e.user; // fallback
    if (!totals[id]) totals[id] = { name: e.user.name || 'Unknown', count:0, amount:0 };
    totals[id].count += 1;
    totals[id].amount += Number(e.amount) || 0;
  });
  const list = Object.entries(totals).map(([id, v]) => ({ id, ...v })).sort((a,b)=>b.amount-a.amount);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow border border-slate-200 dark:border-slate-700">
      <h3 className="font-semibold mb-4 text-slate-800 dark:text-white">Team Members</h3>
      <div className="space-y-2 max-h-[340px] overflow-auto pr-1">
        {list.map(m => (
          <div key={m.id} className="flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
            <div className="font-medium text-slate-700 dark:text-slate-200 truncate">{m.name}</div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500 dark:text-slate-400">{m.count} exp</span>
              <span className="font-semibold text-slate-900 dark:text-white">{currencySymbol}{m.amount.toFixed(2)}</span>
            </div>
          </div>
        ))}
        {list.length===0 && <div className="text-xs text-slate-500 dark:text-slate-400">No team expenses yet</div>}
      </div>
    </div>
  );
}
