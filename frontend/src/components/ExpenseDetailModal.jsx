import React, { useState } from 'react';

export default function ExpenseDetailModal({ expense, onClose, onUpdate }) {
  const [status, setStatus] = useState('approved');
  const [comment, setComment] = useState('');
  if (!expense) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 space-y-4">
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-semibold">Expense Detail</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 bg-white">✕</button>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Field label="Employee" value={expense.user?.name} />
          <Field label="Category" value={expense.category} />
          <Field label="Amount" value={`${expense.currency} ${Number(expense.amount).toFixed(2)}`} />
          <Field label="Date" value={new Date(expense.date).toLocaleDateString()} />
          <Field label="Status" value={expense.status} />
          {expense.managerComment && <Field label="Prev Comment" value={expense.managerComment} />}
        </div>
        {expense.description && <p className="text-sm text-slate-600"><span className="font-medium text-slate-700">Description:</span> {expense.description}</p>}
        <div className="border-t pt-4 space-y-3">
          <div className="flex gap-3">
            <select className="border rounded-lg px-3 py-2 text-sm text-white" value={status} onChange={e=>setStatus(e.target.value)}>
              <option value="approved">Approve</option>
              <option value="rejected">Reject</option>
            </select>
            <input className="flex-1 border rounded-lg px-3 py-2 text-sm text-white" placeholder="Manager comment (optional)" value={comment} onChange={e=>setComment(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 hover:bg-slate-200">Cancel</button>
            <button onClick={()=>onUpdate({status, comment})} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:brightness-110">Submit</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const Field = ({ label, value }) => (
  <div className="space-y-1">
    <div className="text-[10px] uppercase tracking-wide text-slate-500 font-medium">{label}</div>
    <div className="font-medium text-slate-800 break-all">{value || '—'}</div>
  </div>
);
