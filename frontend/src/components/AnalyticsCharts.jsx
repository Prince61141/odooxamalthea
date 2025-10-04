import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#4c56ff','#5a2bc8','#1d92ff','#10b981','#f59e0b','#ef4444'];

export default function AnalyticsCharts({ summary }) {
  // Track dark mode changes
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    // Check initially
    checkDarkMode();
    
    // Watch for changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);
  
  if (!summary) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 text-sm text-yellow-800 dark:text-yellow-200">
        ⚠️ No summary data available. Charts will appear after expenses are added.
      </div>
    );
  }
  
  // Detect dark mode colors
  const textColor = isDark ? '#f1f5f9' : '#334155';
  const gridColor = isDark ? '#475569' : '#e2e8f0';
  const bgColor = isDark ? '#1e293b' : '#fff';
  
  // Check if all arrays are empty
  const hasNoData = (!summary.categories || summary.categories.length === 0) && 
                    (!summary.monthly || summary.monthly.length === 0) && 
                    (!summary.topEmployees || summary.topEmployees.length === 0);
  
  if (hasNoData) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6 text-center">
        <div className="text-4xl mb-3">📊</div>
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">No Analytics Data Yet</h3>
        <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
          Charts will appear once team members submit and get their expenses approved.
        </p>
        <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 rounded px-3 py-2 inline-block">
          {summary.pendingCount > 0 
            ? `You have ${summary.pendingCount} pending expense${summary.pendingCount > 1 ? 's' : ''} waiting for approval`
            : 'No expenses submitted yet'}
        </div>
      </div>
    );
  }
  
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow border border-slate-200 dark:border-slate-700 flex flex-col">
        <h3 className="font-semibold mb-2 text-slate-800 dark:text-white">Spend by Category</h3>
        <div className="flex-1 min-h-[260px]">
          {summary.categories && summary.categories.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={summary.categories} 
                  dataKey="total" 
                  nameKey="category" 
                  innerRadius={50} 
                  outerRadius={90} 
                  paddingAngle={4}
                  label={({ category, total }) => `${category}: $${total.toFixed(2)}`}
                >
                  {summary.categories.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: bgColor, 
                    border: `1px solid ${gridColor}`, 
                    borderRadius: '8px',
                    color: textColor
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-slate-500 dark:text-slate-400">No category data</div>
          )}
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow border border-slate-200 dark:border-slate-700 flex flex-col">
        <h3 className="font-semibold mb-2 text-slate-800 dark:text-white">Monthly Trend</h3>
        <div className="flex-1 min-h-[260px]">
          {summary.monthly && summary.monthly.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: textColor, fontSize: 11 }} 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fill: textColor, fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: bgColor, 
                    border: `1px solid ${gridColor}`, 
                    borderRadius: '8px',
                    color: textColor
                  }} 
                />
                <Bar dataKey="total" fill="#4c56ff" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-slate-500 dark:text-slate-400">No monthly data</div>
          )}
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow border border-slate-200 dark:border-slate-700 flex flex-col">
        <h3 className="font-semibold mb-2 text-slate-800 dark:text-white">Top Employees</h3>
        <ul className="flex-1 space-y-3 overflow-auto pr-1">
          {summary.topEmployees && summary.topEmployees.length > 0 ? (
            summary.topEmployees.map(emp => (
              <li key={emp.userId} className="flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
                <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{emp.name}</span>
                <span className="text-slate-900 dark:text-white font-semibold">${emp.total.toFixed(2)}</span>
              </li>
            ))
          ) : (
            <li className="text-xs text-slate-500 dark:text-slate-400">No employee data</li>
          )}
        </ul>
      </div>
    </div>
  );
}
