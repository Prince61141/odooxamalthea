import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../components/AuthContext.jsx';
import api from '../api';
import ExpenseTable from '../components/ExpenseTable.jsx';
import NotificationBell from '../components/NotificationBell.jsx';
import ExpenseDetailModal from '../components/ExpenseDetailModal.jsx';
import AnalyticsCharts from '../components/AnalyticsCharts.jsx';
import TeamSummary from '../components/TeamSummary.jsx';
// PDF export libs
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'pending', label: 'Pending' },
  { id: 'team', label: 'Team' },
  { id: 'reports', label: 'Reports' }
];

export default function ManagerDashboard() {
  const { role, logout } = useAuth();
  const [active, setActive] = useState('dashboard');
  const [teamExpenses, setTeamExpenses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [expRes, summaryRes] = await Promise.all([
        api.get('/expenses/team'),
        api.get('/expenses/team/summary')
      ]);
      setTeamExpenses(expRes.data);
      setSummary(summaryRes.data);
      setPendingCount(summaryRes.data.pendingCount || 0);
    } catch (e) {
      console.error(e);
      setToast({ type: 'error', msg: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    let list = [...teamExpenses];
    if (statusFilter !== 'all') list = list.filter(e => e.status === statusFilter);
    if (active === 'pending') list = list.filter(e => e.status === 'pending');
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e => (e.user?.name || '').toLowerCase().includes(q) || e.category.toLowerCase().includes(q));
    }
    setFiltered(list);
  }, [teamExpenses, statusFilter, active, search]);

  const updateStatus = async ({ status, comment }) => {
    if (!selected) return;
    try {
      setActionLoading(true);
      await api.put(`/expenses/${selected._id}/status`, { status, comment });
      setToast({ type: 'success', msg: `Expense ${status}` });
      setSelected(null);
      loadData();
    } catch (e) {
      setToast({ type: 'error', msg: 'Update failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const exportCSV = () => {
    const rows = [ ['Employee','Category','Amount','Currency','Date','Status'], ...filtered.map(e => [e.user?.name||'', e.category, e.amount, e.currency, new Date(e.date).toISOString(), e.status]) ];
    const csv = rows.map(r => r.map(v => '"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'expenses.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (!filtered.length) return;
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('Team Expenses Report', 14, 14);
    const generated = new Date().toLocaleString();
    doc.setFontSize(10);
    doc.text(`Generated: ${generated}`, 14, 20);

    const headers = ['Employee','Category','Amount','Currency','Date','Status'];
    const body = filtered.map(e => [
      e.user?.name || '',
      e.category,
      Number(e.amount || 0).toFixed(2),
      e.currency,
      new Date(e.date).toLocaleDateString(),
      e.status
    ]);

    doc.autoTable({
      head: [headers],
      body,
      startY: 26,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15,23,42] },
      didDrawPage: (data) => {
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height || pageSize.getHeight();
        doc.setFontSize(9);
        doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageSize.width - 30, pageHeight - 10);
      }
    });

    // Summary section if available
    if (summary) {
      let y = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text('Summary', 14, y);
      y += 6;
      doc.setFontSize(10);
      if (summary.categories) {
        Object.entries(summary.categories).forEach(([cat, amt]) => {
          doc.text(`${cat}: ${Number(amt).toFixed(2)}`, 14, y);
          y += 5;
        });
      }
    }

    doc.save('expenses.pdf');
  };

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-64 hidden md:flex flex-col bg-white border-r border-slate-200 p-5 gap-8">
        <div className="font-bold text-xl tracking-tight">Manager</div>
        <nav className="flex flex-col gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={()=>setActive(t.id)} className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition ${active===t.id ? 'bg-primary text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}>{t.label}</button>
          ))}
        </nav>
        <div className="mt-auto">
          <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-700">Logout</button>
        </div>
      </aside>

      <main className="flex-1 p-5 md:p-8 space-y-6">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <select value={active} onChange={e=>setActive(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
                {tabs.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{active === 'dashboard' ? 'Dashboard Overview' : active === 'pending' ? 'Pending Approvals' : active === 'team' ? 'Team Expenses' : 'Reports & Analytics'}</h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell count={pendingCount} onClick={()=>setActive('pending')} />
            <div className="text-xs font-medium px-2 py-1 rounded bg-slate-200">Role: {role}</div>
          </div>
        </header>

        {/* Filters */}
        {(active === 'team' || active === 'pending' || active === 'dashboard') && (
          <div className="flex flex-wrap items-center gap-3">
            <input placeholder="Search employee/category" value={search} onChange={e=>setSearch(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button onClick={exportCSV} className="px-3 py-2 text-sm rounded-lg border bg-white hover:bg-slate-50">Export CSV</button>
            <button onClick={exportPDF} disabled={!filtered.length} className="px-3 py-2 text-sm rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-40">Export PDF</button>
            <button onClick={loadData} className="px-3 py-2 text-sm rounded-lg border bg-white hover:bg-slate-50">Refresh</button>
          </div>
        )}

        {loading ? (
          <div className="text-sm text-slate-500">Loading data...</div>
        ) : (
          <>
            {active === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl p-5 shadow border border-slate-100">
                    <div className="text-sm text-slate-500">Pending</div>
                    <div className="text-3xl font-semibold mt-1">{pendingCount}</div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow border border-slate-100">
                    <div className="text-sm text-slate-500">Total Expenses (All)</div>
                    <div className="text-3xl font-semibold mt-1">{teamExpenses.reduce((a,b)=>a+Number(b.amount||0),0).toFixed(2)}</div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow border border-slate-100">
                    <div className="text-sm text-slate-500">Employees</div>
                    <div className="text-3xl font-semibold mt-1">{new Set(teamExpenses.map(e=>e.user?._id)).size}</div>
                  </div>
                </div>
                <AnalyticsCharts summary={summary} />
                <div className="grid lg:grid-cols-2 gap-6">
                  <div>
                    <h2 className="text-lg font-semibold mb-3">Recent Expenses</h2>
                    <ExpenseTable data={teamExpenses.slice(0,8)} onRowClick={setSelected} />
                  </div>
                  <TeamSummary expenses={teamExpenses} />
                </div>
              </div>
            )}
            {active === 'pending' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Pending Approvals</h2>
                <ExpenseTable data={filtered.filter(e=>e.status==='pending')} onRowClick={setSelected} />
              </div>
            )}
            {active === 'team' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">All Team Expenses</h2>
                <ExpenseTable data={filtered} onRowClick={setSelected} />
              </div>
            )}
            {active === 'reports' && (
              <div className="space-y-6">
                <AnalyticsCharts summary={summary} />
                <TeamSummary expenses={teamExpenses} />
              </div>
            )}
          </>
        )}
      </main>

      {selected && <ExpenseDetailModal expense={selected} onClose={()=>setSelected(null)} onUpdate={updateStatus} loading={actionLoading} />}

      {toast && (
        <div className="fixed bottom-4 right-4 bg-slate-900 text-white px-4 py-2 rounded-lg shadow z-50 text-sm flex items-center gap-3">
          <span>{toast.msg}</span>
          <button onClick={()=>setToast(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}
    </div>
  );
}
