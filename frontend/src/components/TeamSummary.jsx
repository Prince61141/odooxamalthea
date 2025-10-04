import React from 'react';

export default function TeamSummary({ expenses }) {
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
    <div className="bg-white rounded-2xl p-5 shadow border border-slate-100">
      <h3 className="font-semibold mb-4">Team Members</h3>
      <div className="space-y-2 max-h-[340px] overflow-auto pr-1">
        {list.map(m => (
          <div key={m.id} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
            <div className="font-medium text-slate-700 truncate">{m.name}</div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500">{m.count} exp</span>
              <span className="font-semibold text-slate-900">{m.amount.toFixed(2)}</span>
            </div>
          </div>
        ))}
        {list.length===0 && <div className="text-xs text-slate-500">No team expenses yet</div>}
      </div>
    </div>
  );
}
