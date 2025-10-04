import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#4c56ff','#5a2bc8','#1d92ff','#10b981','#f59e0b','#ef4444'];

export default function AnalyticsCharts({ summary }) {
  if (!summary) return null;
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-2xl p-5 shadow border border-slate-100 flex flex-col">
        <h3 className="font-semibold mb-2">Spend by Category</h3>
        <div className="flex-1 min-h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={summary.categories} dataKey="total" nameKey="category" innerRadius={50} outerRadius={90} paddingAngle={4}>
                {summary.categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-5 shadow border border-slate-100 flex flex-col">
        <h3 className="font-semibold mb-2">Monthly Trend</h3>
        <div className="flex-1 min-h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#4c56ff" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-5 shadow border border-slate-100 flex flex-col">
        <h3 className="font-semibold mb-2">Top Employees</h3>
        <ul className="flex-1 space-y-3 overflow-auto pr-1">
          {summary.topEmployees.map(emp => (
            <li key={emp.userId} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
              <span className="font-medium text-slate-700 truncate">{emp.name}</span>
              <span className="text-slate-900 font-semibold">{emp.total.toFixed(2)}</span>
            </li>
          ))}
          {summary.topEmployees.length===0 && <li className="text-xs text-slate-500">No data</li>}
        </ul>
      </div>
    </div>
  );
}
