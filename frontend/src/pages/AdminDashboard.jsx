import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../components/AuthContext.jsx';

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
  logout:(p)=>(<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3H5v18h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>)
};

const tabs = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
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
  const [status, setStatus] = useState('');
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [toast, setToast] = useState(null);
  const mounted = useRef(false);

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

  useEffect(()=>{ fetchManagers(); fetchSummary(); }, [fetchManagers, fetchSummary]);

  useEffect(()=>{ mounted.current = true; return ()=>{ mounted.current=false; }; },[]);

  // Auto refresh summary every 60s
  useEffect(()=>{
    if(!token) return; const id = setInterval(fetchSummary, 60000); return ()=>clearInterval(id);
  },[token, fetchSummary]);

  // Toast auto dismiss
  useEffect(()=>{ if(toast){ const id=setTimeout(()=>setToast(null), 3000); return ()=>clearTimeout(id);} }, [toast]);

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
            <button onClick={logout} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><Icon.logout className="w-4 h-4" /> Logout</button>
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
            <h1 className="text-xl font-semibold tracking-tight text-slate-800 dark:text-white truncate">{active==='overview'?'Admin Overview': active==='create'?'Add User':'Send Invite'}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={()=>setDark(d=>{ const v=!d; try { localStorage.setItem('themeDark', String(v)); } catch(_){} return v; })} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">{dark? <Icon.sun className="w-4 h-4"/> : <Icon.moon className="w-4 h-4"/>}</button>
            <div className="text-[11px] font-medium px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">Role: {role}</div>
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
                  <button onClick={fetchSummary} className="self-start text-xs px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">Refresh</button>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col gap-4">
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Latest User</h2>
                  <div className="text-sm text-slate-600 dark:text-slate-300">{summary?.latestUserCreatedAt ? new Date(summary.latestUserCreatedAt).toLocaleString(): '—'}</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Timestamp of most recently created account.</p>
                </div>
              </div>
            </div>
          )}

          {active==='create' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
                <h2 className="text-lg font-semibold tracking-tight text-slate-800 dark:text-white mb-4">Add User</h2>
                <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Name</label>
                    <input value={form.name} onChange={e=>setForm(v=>({...v,name:e.target.value}))} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Email</label>
                    <input type="email" value={form.email} onChange={e=>setForm(v=>({...v,email:e.target.value}))} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Role</label>
                    <select value={form.role} onChange={e=>setForm(v=>({...v,role:e.target.value}))} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm">
                      <option value="manager">Manager</option>
                      <option value="employee">Employee</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Manager (for Employee)</label>
                    <select disabled={form.role!=='employee'} value={form.managerId} onChange={e=>setForm(v=>({...v,managerId:e.target.value}))} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm">
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
                <input value={form.email} onChange={e=>setForm(v=>({...v,email:e.target.value}))} placeholder="user@example.com" className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm" />
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
    </div>
  );
}