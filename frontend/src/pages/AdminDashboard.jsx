import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../components/AuthContext.jsx';
import ProfileDrawer from '../components/ProfileDrawer.jsx';
import api from '../api';
import ExpenseTable from '../components/ExpenseTable.jsx';
import ExpenseDetailModal from '../components/ExpenseDetailModal.jsx';
import AnalyticsCharts from '../components/AnalyticsCharts.jsx';
import TeamSummary from '../components/TeamSummary.jsx';

// Minimal inline icons for consistency
const Icon = {
  dashboard: (p)=> (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="15" width="7" height="6"/></svg>),
  users: (p)=> (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>),
  plus: (p)=> (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>),
  mail: (p)=> (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m4 4 8 8 8-8"/><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/></svg>),
  sun: (p)=> (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07 6.07-1.42-1.42M8.35 8.35 6.93 6.93m0 10.14 1.42-1.42m9.3-9.3-1.42 1.42"/></svg>),
  moon: (p)=> (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg>),
  menu:(p)=>(<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>),
  x:(p)=>(<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>),
  logout:(p)=>(<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3H5v18h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>),
  trash:(p)=>(<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>),
  settings:(p)=>(<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09c0 .69.4 1.31 1 1.51.61.21 1.28.05 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.69.21 1.51.4 1.51 1V10a2 2 0 0 1 0 4h-.09c-.69 0-1.31.4-1.51 1Z"/></svg>),
  user:(p)=>(<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>)
};

const tabs = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'users', label: 'Users', icon: 'users' },
  { id: 'expenses', label: 'Expenses', icon: 'dashboard' },
  { id: 'analytics', label: 'Analytics', icon: 'dashboard' },
  { id: 'create', label: 'Add User', icon: 'plus' },
  { id: 'invite', label: 'Invite', icon: 'mail' }
];

export default function AdminDashboard() {
  const { token, logout, role } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(()=>{
    if (typeof window !== 'undefined') { try { return localStorage.getItem('themeDark')==='true'; } catch(_){} }
    return false;
  });
  const [active, setActive] = useState('overview');
  const [form, setForm] = useState({ name: '', email: '', role: 'manager', managerId: '' });
  const [managers, setManagers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [status, setStatus] = useState('');
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [toast, setToast] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const profileRef = useRef(null);
  const mounted = useRef(false);
  // Global expenses (admin)
  const [allExpenses, setAllExpenses] = useState([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expenseFilter, setExpenseFilter] = useState('all');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseSelected, setExpenseSelected] = useState(null);
  const [expenseActionLoading, setExpenseActionLoading] = useState(false);
  const [globalSummary, setGlobalSummary] = useState(null);

  const fetchManagers = useCallback(()=>{
    if (!token) return;
    fetch('http://localhost:5000/api/users/managers', { headers: { Authorization: `Bearer ${token}` } })
      .then(r=>r.json())
      .then(data=> setManagers(Array.isArray(data)?data:[]))
      .catch(()=> setManagers([]));
  },[token]);

  const fetchSummary = useCallback(()=>{
    if (!token) return;
    setLoadingSummary(true);
    fetch('http://localhost:5000/api/users/summary', { headers: { Authorization: `Bearer ${token}` } })
      .then(r=>r.json())
      .then(data=> setSummary(data))
      .catch(()=> setSummary(null))
      .finally(()=> setLoadingSummary(false));
  },[token]);

  const fetchUsers = useCallback(()=>{
    if (!token) return;
    setLoadingUsers(true);
    fetch('http://localhost:5000/api/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(r=>r.json())
      .then(data=> setUsers(Array.isArray(data)? data : []))
      .catch(()=> setUsers([]))
      .finally(()=> setLoadingUsers(false));
  },[token]);

  useEffect(()=>{ fetchManagers(); fetchSummary(); fetchUsers(); }, [fetchManagers, fetchSummary, fetchUsers]);

  // Load global expenses / summary when relevant tab active
  useEffect(()=>{ if(active==='expenses' || active==='analytics'){ loadAllExpenses(); loadGlobalSummary(); } }, [active]);

  useEffect(()=>{ mounted.current = true; return ()=>{ mounted.current=false; }; },[]);

  const loadAllExpenses = async () => {
    if(!token) return; setExpensesLoading(true);
    try { const res = await api.get('/expenses/all'); setAllExpenses(res.data || []); }
    catch { setAllExpenses([]); }
    finally { setExpensesLoading(false); }
  };
  const loadGlobalSummary = async () => { if(!token) return; try { const res = await api.get('/expenses/all/summary'); setGlobalSummary(res.data); } catch { setGlobalSummary(null); } };
  const updateExpenseStatus = async ({ status, comment }) => {
    if(!expenseSelected) return; try { setExpenseActionLoading(true); await api.put(`/expenses/${expenseSelected._id}/status`, { status, comment }); setToast({ type:'success', msg:`Expense ${status}` }); setExpenseSelected(null); loadAllExpenses(); loadGlobalSummary(); }
    catch { setToast({ type:'error', msg:'Update failed'}); } finally { setExpenseActionLoading(false); }
  };
  const filteredExpenses = allExpenses.filter(e => (expenseFilter==='all' || e.status===expenseFilter) && (!expenseSearch || (e.user?.name||'').toLowerCase().includes(expenseSearch.toLowerCase()) || e.category.toLowerCase().includes(expenseSearch.toLowerCase())) );

  // Auto refresh summary every 60s
  useEffect(()=>{
    if(!token) return; const id = setInterval(fetchSummary, 60000); return ()=>clearInterval(id);
  },[token, fetchSummary]);

  // Toast auto dismiss
  useEffect(()=>{ if(toast){ const id=setTimeout(()=>setToast(null), 3000); return ()=>clearTimeout(id);} }, [toast]);
  useEffect(()=>{
    function handleDoc(e){ if(profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false); }
    function handleKey(e){ if(e.key==='Escape') setProfileOpen(false); }
    if(profileOpen){ document.addEventListener('mousedown', handleDoc); document.addEventListener('keydown', handleKey); }
    return ()=>{ document.removeEventListener('mousedown', handleDoc); document.removeEventListener('keydown', handleKey); };
  },[profileOpen]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    try {
      const res = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setStatus('User created');
      setToast({ type:'success', msg:'User created' });
      setForm({ name: '', email: '', role: 'manager', managerId: '' });
      fetchSummary();
      fetchUsers();
      if(form.role==='manager') fetchManagers();
    } catch (e) {
      setStatus(e.message);
      setToast({ type:'error', msg:e.message });
    }
  };

  const sendInvite = async () => {
    setStatus('');
    try {
      const res = await fetch('http://localhost:5000/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setStatus(data.message || 'Invite sent');
      setToast({ type:'success', msg:'Invite sent' });
    } catch (e) {
      setStatus(e.message);
      setToast({ type:'error', msg:e.message });
    }
  };

  const deleteUser = async (userId, userName) => {
    if (!confirm(`Delete user "${userName}"? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      setToast({ type:'success', msg:'User deleted' });
      fetchUsers();
      fetchSummary();
    } catch (e) {
      setToast({ type:'error', msg:e.message });
    }
  };

  const SummaryCard = ({ title, value, sub }) => (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex flex-col gap-1">
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-medium">{title}</div>
      <div className="text-3xl font-semibold text-slate-800 dark:text-white">{value ?? '—'}</div>
      {sub && <div className="text-[11px] text-slate-500 dark:text-slate-400">{sub}</div>}
    </div>
  );

  return (
    <div className={(dark? 'dark ' : '') + 'min-h-screen flex bg-slate-100 dark:bg-slate-900'}>
      {/* Sidebar */}
      <aside className={`relative z-30 w-72 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 fixed md:static inset-y-0 left-0 ${sidebarOpen? 'translate-x-0':'-translate-x-full md:translate-x-0'}`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 justify-between">
          <span className="font-bold tracking-tight text-slate-800 dark:text-white">Admin Panel</span>
          <button className="md:hidden p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800" onClick={()=>setSidebarOpen(false)}><Icon.x className="w-5 h-5"/></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-4 flex flex-col gap-1">
          {tabs.map(t => {
            const activeTab = active===t.id;
            return (
              <button key={t.id} onClick={()=>{ setActive(t.id); setSidebarOpen(false); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab? 'bg-indigo-600 text-white shadow':'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}> {Icon[t.icon]({ className:'w-4 h-4'})} <span>{t.label}</span></button>
            );
          })}
          <div className="mt-auto pt-4">
            <button onClick={logout} className="inline-flex justify-center items-center gap-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-medium px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"><Icon.mail className="w-4 h-4" /> Logout</button>
          </div>
        </nav>
      </aside>
      {/* Overlay */}
  {sidebarOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm md:hidden" onClick={()=>setSidebarOpen(false)} />}

  {/* Main */}
  <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 px-4 md:px-8 flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-30">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button className="md:hidden p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800" onClick={()=>setSidebarOpen(true)}><Icon.menu className="w-5 h-5" /></button>
            <h1 className="text-xl font-semibold tracking-tight text-slate-800 dark:text-white truncate">{
              active==='overview'? 'Admin Overview' :
              active==='users'? 'All Users' :
              active==='expenses'? 'All Expenses' :
              active==='analytics'? 'Global Analytics' :
              active==='create'? 'Add User' : 'Send Invite'
            }</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={()=>setDark(d=>{ const v=!d; try { localStorage.setItem('themeDark', String(v)); } catch(_){} return v; })} aria-label="Toggle theme" className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">{dark? <Icon.sun className="w-4 h-4"/> : <Icon.moon className="w-4 h-4"/>}</button>
            <div className="relative" ref={profileRef}>
              <button onClick={()=>setProfileOpen(o=>!o)} className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-2 pr-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-xs font-semibold shadow-inner">{(role||'A').slice(0,2).toUpperCase()}</span>
                <span className="hidden sm:inline-flex flex-col leading-tight text-left">
                  <span className="text-xs font-medium -mb-0.5 capitalize">{role || 'User'}</span>
                  <span className="text-[10px] uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Admin</span>
                </span>
                <svg className={`w-3 h-3 transition-transform ${profileOpen? 'rotate-180':''}`} viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"/></svg>
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                    <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Signed in as</div>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{role} user</div>
                  </div>
                  <ul className="py-1 text-sm">
                    <li>
                      <button onClick={()=>{ setProfileDrawerOpen(true); setProfileOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200">
                        <Icon.user className="w-4 h-4"/> <span>View Profile</span>
                      </button>
                    </li>
                    <li>
                      <button className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200">
                        <Icon.settings className="w-4 h-4"/> <span>Settings</span>
                      </button>
                    </li>
                  </ul>
                  <div className="py-1 border-t border-slate-100 dark:border-slate-700">
                    <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium">
                      <Icon.logout className="w-4 h-4"/> <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

  <main className="flex-1 w-full max-w-[1600px] mx-auto px-5 md:px-8 py-8 space-y-8">
          {active==='overview' && (
            <div className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <SummaryCard title="Total Users" value={summary?.totalUsers} sub={loadingSummary? 'Loading...' : 'All accounts'} />
                <SummaryCard title="Managers" value={summary?.managers} sub="Active managers" />
                <SummaryCard title="Employees" value={summary?.employees} sub="Active employees" />
                <SummaryCard title="Avg Employees/Manager" value={summary?.avgEmployeesPerManager} sub="Org ratio" />
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col gap-4">
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Recent Growth</h2>
                  <div className="text-3xl font-semibold text-slate-800 dark:text-white">{summary?.recentNewUsers30d ?? '—'}</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Users added in the last 30 days.</p>
                  <button onClick={fetchSummary} className="self-start text-xs px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-white">Refresh</button>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col gap-4">
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Latest User</h2>
                  <div className="text-sm text-slate-600 dark:text-slate-300">{summary?.latestUserCreatedAt ? new Date(summary.latestUserCreatedAt).toLocaleString(): '—'}</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Timestamp of most recently created account.</p>
                </div>
              </div>
            </div>
          )}

          {active==='users' && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight text-slate-800 dark:text-white">All Users</h2>
                <button onClick={fetchUsers} className="text-xs px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-white">Refresh</button>
              </div>
              {loadingUsers ? (
                <div className="text-sm text-slate-500 dark:text-slate-400">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="text-sm text-slate-500 dark:text-slate-400">No users found.</div>
              ) : (
                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Name</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Email</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Role</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Manager</th>
                        {/* <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Company</th> */}
                        <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Created</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u._id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="py-3 px-4 text-slate-900 dark:text-white font-medium">{u.name}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{u.email}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${u.role==='admin'?'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300': u.role==='manager'?'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300':'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'}`}>{u.role}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            {u.role === 'employee' && u.manager ? (
                              <div className="flex flex-col leading-tight">
                                <span className="text-sm font-medium">{u.manager.name || '—'}</span>
                                {u.manager.email && <span className="text-[11px] text-slate-500 dark:text-slate-400">{u.manager.email}</span>}
                              </div>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 text-xs">—</span>
                            )}
                          </td>
                          {/* <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{u.companyName || '—'}</td> */}
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{u.createdAt? new Date(u.createdAt).toLocaleDateString(): '—'}</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => deleteUser(u._id, u.name)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition"
                              title="Delete user"
                            >
                              <Icon.trash className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {active==='expenses' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex flex-wrap gap-3 items-center">
                <select value={expenseFilter} onChange={e=>setExpenseFilter(e.target.value)} className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200">
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <input value={expenseSearch} onChange={e=>setExpenseSearch(e.target.value)} placeholder="Search employee/category" className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 flex-1 min-w-[180px]" />
                <button onClick={loadAllExpenses} className="px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white">Refresh</button>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-4">
                <h2 className="text-lg font-semibold tracking-tight text-slate-800 dark:text-white">All Expenses</h2>
                {expensesLoading ? <div className="text-sm text-slate-500">Loading...</div> : <ExpenseTable data={filteredExpenses} onRowClick={setExpenseSelected} />}
              </div>
            </div>
          )}

          {active==='analytics' && (
            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
                <SummaryCard title="Pending" value={globalSummary?.pendingCount ?? '—'} />
                <SummaryCard title="Total Amount" value={allExpenses.reduce((a,b)=>a+Number(b.amount||0),0).toFixed(2)} sub="All expenses" />
                <SummaryCard title="Employees" value={new Set(allExpenses.map(e=>e.user?._id)).size} />
                <SummaryCard title="Avg Approval (h)" value={(globalSummary?.averageApprovalHours||0).toFixed(1)} sub="Avg hours" />
                <SummaryCard title="Velocity 7d" value={`${globalSummary?.expenseVelocity?.current7d||0}`} sub={(()=>{ const cp=globalSummary?.expenseVelocity?.changePct; if(cp==null) return 'No prior data'; const sign = cp>0? '+':''; return `${sign}${cp.toFixed(1)}% vs prev`; })()} />
              </div>
              <AnalyticsCharts summary={globalSummary} />
              <TeamSummary expenses={allExpenses} />
            </div>
          )}

          {active==='create' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
                <h2 className="text-lg font-semibold tracking-tight text-slate-800 dark:text-white mb-4">Add User</h2>
                <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-1">Name</label>
                    <input value={form.name} onChange={e=>setForm(v=>({...v,name:e.target.value}))} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-1">Email</label>
                    <input type="email" value={form.email} onChange={e=>setForm(v=>({...v,email:e.target.value}))} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-1">Role</label>
                    <select value={form.role} onChange={e=>setForm(v=>({...v,role:e.target.value}))} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white">
                      <option value="manager">Manager</option>
                      <option value="employee">Employee</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-1">Manager (for Employee)</label>
                    <select disabled={form.role!=='employee'} value={form.managerId} onChange={e=>setForm(v=>({...v,managerId:e.target.value}))} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                      <option value="">None</option>
                      {managers.map(m=> <option key={m._id} value={m._id}>{m.name} ({m.email})</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2 flex flex-col sm:flex-row gap-2">
                    <button type="submit" className="inline-flex justify-center items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 text-sm"><Icon.plus className="w-4 h-4"/>Add User</button>
                    <button type="button" onClick={()=>{ sendInvite(); }} className="inline-flex justify-center items-center gap-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-medium px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"><Icon.mail className="w-4 h-4"/>Send Invite</button>
                  </div>
                  {status && <div className="md:col-span-2 text-xs text-indigo-600 dark:text-indigo-400">{status}</div>}
                </form>
              </div>
            </div>
          )}

          {active==='invite' && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-semibold tracking-tight text-slate-800 dark:text-white">Send Quick Invite</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Enter an email to generate or reuse an account with a temporary password and send an invite email.</p>
              <div className="flex flex-col md:flex-row gap-3">
                <input value={form.email} onChange={e=>setForm(v=>({...v,email:e.target.value}))} placeholder="user@example.com" className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400" />
                <button onClick={sendInvite} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 text-sm"><Icon.mail className="w-4 h-4"/>Send Invite</button>
              </div>
              {status && <div className="text-xs text-indigo-600 dark:text-indigo-400">{status}</div>}
            </div>
          )}
        </main>
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 bg-slate-900 text-white px-4 py-2 rounded-lg shadow z-50 text-sm flex items-center gap-3">
          <span>{toast.msg}</span>
          <button onClick={()=>setToast(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}
      <ProfileDrawer open={profileDrawerOpen} onClose={()=>setProfileDrawerOpen(false)} width={420} />
      {expenseSelected && <ExpenseDetailModal expense={expenseSelected} onClose={()=>setExpenseSelected(null)} onUpdate={updateExpenseStatus} loading={expenseActionLoading} />}
    </div>
  );
}