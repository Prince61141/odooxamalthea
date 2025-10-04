import React from 'react';
export default function NotificationBell({ count=0, onClick }) {
  return (
    <button onClick={onClick} className="relative inline-flex items-center justify-center w-11 h-11 rounded-full bg-white shadow ring-1 ring-slate-200 hover:shadow-md transition">
      <span className="text-xl">🔔</span>
      {count>0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">{count}</span>}
    </button>
  );
}
