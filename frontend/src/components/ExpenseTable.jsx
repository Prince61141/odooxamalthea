import React from 'react';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700'
};

export default function ExpenseTable({ data, onRowClick }) {
  return (
    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
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
            <tr key={exp._id} onClick={() => onRowClick && onRowClick(exp)} className="hover:bg-slate-50 cursor-pointer">
              <td className="px-4 py-2 font-medium text-slate-800">{exp.user?.name || '—'}</td>
              <td className="px-4 py-2">{exp.category}</td>
              <td className="px-4 py-2">{exp.currency} {Number(exp.amount).toFixed(2)}</td>
              <td className="px-4 py-2 text-slate-500">{new Date(exp.date).toLocaleDateString()}</td>
              <td className="px-4 py-2"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[exp.status]}`}>{exp.status}</span></td>
            </tr>
          ))}
          {data.length===0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No expenses</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
