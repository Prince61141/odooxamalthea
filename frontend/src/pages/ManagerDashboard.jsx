import React, { useEffect, useState, useCallback, useRef } from 'react';
import ProfileDrawer from '../components/ProfileDrawer.jsx';
import { useAuth } from '../components/AuthContext.jsx';
import api from '../api';
import ExpenseTable from '../components/ExpenseTable.jsx';
import ExpenseDetailModal from '../components/ExpenseDetailModal.jsx';
import AnalyticsCharts from '../components/AnalyticsCharts.jsx';
import TeamSummary from '../components/TeamSummary.jsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Icons inline
const Icon = {
  dashboard:(p)=>(<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="15" width="7" height="6"/></svg>),
  pending:(p)=>(<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>),
  team:(p)=>(<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>),
  reports:(p)=>(<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v4H3z"/><path d="M13 7v14h-2V7"/><path d="M8 7v14H6V7"/><path d="M18 7v14h-2V7"/></svg>),
  menu:(p)=>(<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>),
  x:(p)=>(<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>),
  logout:(p)=>(<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3H5v18h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>),
  sun:(p)=>(<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07 6.07-1.42-1.42M8.35 8.35 6.93 6.93m0 10.14 1.42-1.42m9.3-9.3-1.42 1.42"/></svg>),
  moon:(p)=>(<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg>),
  bell:(p)=>(<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21h4"/></svg>),
  settings:(p)=>(<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09c0 .69.4 1.31 1 1.51.61.21 1.28.05 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.69.21 1.51.4 1.51 1V10a2 2 0 0 1 0 4h-.09c-.69 0-1.31.4-1.51 1Z"/></svg>),
  user:(p)=>(<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>)
};

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon:'dashboard' },
  { id: 'pending', label: 'Pending', icon:'pending' },
  { id: 'team', label: 'Team', icon:'team' },
  { id: 'reports', label: 'Reports', icon:'reports' }
];

export default function ManagerDashboard(){
  const { role, logout } = useAuth();
  const [sidebarOpen,setSidebarOpen] = useState(false);
  const [dark,setDark] = useState(()=>{ if (typeof window !== 'undefined'){ try { return localStorage.getItem('themeDark')==='true'; } catch(_){} } return false; });
  const [active,setActive] = useState('dashboard');
  const [teamExpenses,setTeamExpenses] = useState([]);
  const [filtered,setFiltered] = useState([]);
  const [summary,setSummary] = useState(null);
  const [loading,setLoading] = useState(true);
  const [pendingCount,setPendingCount] = useState(0);
  const [selected,setSelected] = useState(null);
  const [actionLoading,setActionLoading] = useState(false);
  const [statusFilter,setStatusFilter] = useState('all');
  const [search,setSearch] = useState('');
  const [toast,setToast] = useState(null);
  const [notificationsOpen,setNotificationsOpen] = useState(false);
  const [notifications,setNotifications] = useState([]); // {id,msg,read,ts,type}
  const [profileOpen,setProfileOpen] = useState(false);
  const [profileDrawerOpen,setProfileDrawerOpen] = useState(false);
  const profileRef = useRef(null);
  const prevMapRef = useRef(new Map());

  const loadData = useCallback(async()=>{
    try{
      setLoading(true);
      const [expRes, summaryRes] = await Promise.all([
        api.get('/expenses/team'),
        api.get('/expenses/team/summary')
      ]);
      setTeamExpenses(expRes.data);
      setSummary(summaryRes.data);
      setPendingCount(summaryRes.data.pendingCount || 0);
    }catch(e){
      setToast({ type:'error', msg:'Failed to load data'});
    }finally{ setLoading(false);} 
  },[]);

  useEffect(()=>{ loadData(); },[loadData]);

  // Build filtered list
  useEffect(()=>{
    let list=[...teamExpenses];
    if(statusFilter!=='all') list=list.filter(e=>e.status===statusFilter);
    if(active==='pending') list=list.filter(e=>e.status==='pending');
    if(search){ const q=search.toLowerCase(); list=list.filter(e=> (e.user?.name||'').toLowerCase().includes(q) || e.category.toLowerCase().includes(q)); }
    setFiltered(list);
  },[teamExpenses,statusFilter,active,search]);

  // Notifications: detect new expenses and status changes
  useEffect(()=>{
    const prevMap = prevMapRef.current; // key: id -> status
    const newMap = new Map();
    const newNotifications = [];
    teamExpenses.forEach(exp=>{
      newMap.set(exp._id, exp.status);
      const prevStatus = prevMap.get(exp._id);
      if(!prevStatus){
        if(exp.status==='pending') newNotifications.push({ id:exp._id+':new', msg:`New expense from ${exp.user?.name||'User'} (${exp.category})`, read:false, ts:Date.now(), type:'new' });
      } else if(prevStatus!==exp.status){
        newNotifications.push({ id:exp._id+':status', msg:`Expense ${exp.category} is now ${exp.status}`, read:false, ts:Date.now(), type:'status' });
      }
    });
    if(newNotifications.length){
      setNotifications(prev=>[...newNotifications, ...prev].slice(0,100));
    }
    prevMapRef.current = newMap;
  },[teamExpenses]);

  const unread = notifications.filter(n=>!n.read).length;
  const markAllRead = ()=> setNotifications(n=> n.map(x=>({...x,read:true})));

  const updateStatus = async ({ status, comment }) => {
    if(!selected) return; 
    try{
      setActionLoading(true);
      await api.put(`/expenses/${selected._id}/status`, { status, comment });
      setToast({ type:'success', msg:`Expense ${status}` });
      setSelected(null);
      loadData();
    }catch(e){ setToast({ type:'error', msg:'Update failed'});} finally { setActionLoading(false);} 
  };

  const exportCSV = ()=>{
    const rows = [['Employee','Category','Amount','Currency','Date','Status'], ...filtered.map(e=>[e.user?.name||'', e.category, e.amount, e.currency, new Date(e.date).toISOString(), e.status])];
    const csv = rows.map(r=> r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob = new Blob([csv],{ type:'text/csv'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='expenses.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const exportPDF = ()=>{
    if(!filtered.length) return; const doc=new jsPDF({ orientation:'landscape'}); doc.setFontSize(16); doc.text('Team Expenses Report',14,14); const generated=new Date().toLocaleString(); doc.setFontSize(10); doc.text(`Generated: ${generated}`,14,20);
    const headers=['Employee','Category','Amount','Currency','Date','Status'];
    const body=filtered.map(e=>[ e.user?.name||'', e.category, Number(e.amount||0).toFixed(2), e.currency, new Date(e.date).toLocaleDateString(), e.status]);
    doc.autoTable({ head:[headers], body, startY:26, styles:{ fontSize:9 }, headStyles:{ fillColor:[15,23,42] }, didDrawPage:()=>{ const pageSize=doc.internal.pageSize; const pageHeight=pageSize.height||pageSize.getHeight(); doc.setFontSize(9); doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageSize.width-30, pageHeight-10);} });
    if(summary){ let y=doc.lastAutoTable.finalY + 10; doc.setFontSize(12); doc.text('Summary',14,y); y+=6; doc.setFontSize(10); if(summary.categories){ summary.categories.forEach(c=>{ doc.text(`${c.category}: ${Number(c.total).toFixed(2)}`,14,y); y+=5; }); } }
    doc.save('expenses.pdf');
  };

  useEffect(()=>{ if(toast){ const id=setTimeout(()=>setToast(null), 3000); return ()=>clearTimeout(id);} },[toast]);
  useEffect(()=>{
    function docHandler(e){ if(profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false); }
    function keyHandler(e){ if(e.key==='Escape') setProfileOpen(false); }
    if(profileOpen){ document.addEventListener('mousedown', docHandler); document.addEventListener('keydown', keyHandler); }
    return ()=>{ document.removeEventListener('mousedown', docHandler); document.removeEventListener('keydown', keyHandler); };
  },[profileOpen]);

  const SummaryCard = ({ title, value, sub }) => (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex flex-col gap-1">
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-medium">{title}</div>
      <div className="text-3xl font-semibold text-slate-800 dark:text-white">{value}</div>
      {sub && <div className="text-[11px] text-slate-500 dark:text-slate-400">{sub}</div>}
    </div>
  );

  return (
    <div className={(dark? 'dark ' : '') + 'min-h-screen bg-slate-100 dark:bg-slate-900 flex'}>
      {/* Sidebar */}
      <aside className={`relative z-30 w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 md:translate-x-0 ${sidebarOpen? 'translate-x-0' : '-translate-x-full md:translate-x-0'} fixed md:static inset-y-0 left-0`}> 
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 justify-between">
          <span className="font-bold tracking-tight text-slate-800 dark:text-white">Manager</span>
          <button className="md:hidden p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800" onClick={()=>setSidebarOpen(false)}><Icon.x className="w-5 h-5"/></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-4 flex flex-col gap-1">
          {tabs.map(t=>{ const isActive= active===t.id; return <button key={t.id} onClick={()=>{ setActive(t.id); setSidebarOpen(false); if(t.id==='pending') setNotificationsOpen(false); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive? 'bg-indigo-600 text-white shadow':'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{Icon[t.icon]({ className:'w-4 h-4'})} <span>{t.label}</span>{ t.id==='pending' && pendingCount>0 && <span className="ml-auto inline-flex items-center justify-center text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-semibold" style={{ height: "10px", width: "10px", padding: "10px", borderRadius: "50%"}}>{pendingCount}</span>}</button>; })}
          <div className="mt-auto pt-4">
            <button onClick={logout} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><Icon.logout className="w-4 h-4"/> Logout</button>
          </div>
        </nav>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm md:hidden" onClick={()=>setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 ml-0 md:ml-0 md:pl-0">
        {/* Top bar */}
        <header className="h-16 px-4 md:px-8 flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur sticky top-0 z-20">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button className="md:hidden p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800" onClick={()=>setSidebarOpen(true)}><Icon.menu className="w-5 h-5"/></button>
            <h1 className="text-xl font-semibold tracking-tight text-slate-800 dark:text-white truncate">{ active==='dashboard' ? 'Team Overview' : active==='pending' ? 'Pending Approvals' : active==='team' ? 'All Expenses' : 'Reports & Analytics' }</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={()=>setDark(d=>{ const v=!d; try { localStorage.setItem('themeDark', String(v)); } catch(_){} return v; })} aria-label="Toggle theme" className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">{dark? <Icon.sun className="w-4 h-4"/> : <Icon.moon className="w-4 h-4"/>}</button>
            <button onClick={()=>setNotificationsOpen(o=>!o)} aria-label="Notifications" className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-white">
              <Icon.bell className="w-4 h-4"/>
              {unread>0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-semibold">{unread}</span>}
            </button>
            <div className="relative" ref={profileRef}>
              <button onClick={()=>setProfileOpen(o=>!o)} className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-2 pr-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-xs font-semibold shadow-inner">{(role||'M').slice(0,2).toUpperCase()}</span>
                <span className="hidden sm:inline-flex flex-col leading-tight text-left">
                  <span className="text-xs font-medium -mb-0.5 capitalize">{role||'Manager'}</span>
                  <span className="text-[10px] uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Menu</span>
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

        {/* Filters */}
        {(active==='team' || active==='pending' || active==='dashboard') && (
          <div className="px-5 md:px-8 pt-5 pb-4 flex flex-wrap items-center gap-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-800/60 border-y border-slate-200 dark:border-slate-700">
            <input 
              placeholder="Search employee/category" 
              value={search} 
              onChange={e=>setSearch(e.target.value)} 
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 hover:dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-900/80 rounded-lg text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition" />
            <select 
              value={statusFilter} 
              onChange={e=>setStatusFilter(e.target.value)} 
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/60 hover:dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-900/80 rounded-lg text-sm text-slate-700 dark:text-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition">
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button 
              onClick={exportCSV} 
              className="px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 bg-white/90 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-sm transition">
              Export CSV
            </button>
            <button 
              onClick={exportPDF} 
              disabled={!filtered.length} 
              className="px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 bg-white/90 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed">
              Export PDF
            </button>
            <button 
              onClick={loadData} 
              className="px-3 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition">
              Refresh
            </button>
          </div>
        )}

        <main className="flex-1 w-full mx-auto max-w-[1600px] px-4 md:px-8 py-6 space-y-6">
          {loading? (
            <div className="text-sm text-slate-500 dark:text-slate-400">Loading data...</div>
          ) : (
            <>
              {active==='dashboard' && (
                <div className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
                    <SummaryCard title="Pending" value={pendingCount} />
                    <SummaryCard title="Total Amount" value={teamExpenses.reduce((a,b)=>a+Number(b.amount||0),0).toFixed(2)} sub="All expenses" />
                    <SummaryCard title="Employees" value={new Set(teamExpenses.map(e=>e.user?._id)).size} />
                    <SummaryCard title="Avg Approval (h)" value={(summary?.averageApprovalHours||0).toFixed(1)} sub="Avg hours to approve" />
                    <SummaryCard title="Velocity 7d" value={`${summary?.expenseVelocity?.current7d||0}`} sub={(()=>{ const cp=summary?.expenseVelocity?.changePct; if(cp==null) return 'No prior data'; const sign = cp>0? '+':''; return `${sign}${cp.toFixed(1)}% vs prev`; })()} />
                  </div>
                  <AnalyticsCharts summary={summary} />
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div>
                      <h2 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-100">Recent Expenses</h2>
                      <ExpenseTable data={teamExpenses.slice(0,8)} onRowClick={setSelected} />
                    </div>
                    <TeamSummary expenses={teamExpenses} />
                  </div>
                </div>
              )}
              {active==='pending' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Pending Approvals</h2>
                  <ExpenseTable data={filtered.filter(e=>e.status==='pending')} onRowClick={setSelected} />
                </div>
              )}
              {active==='team' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">All Team Expenses</h2>
                  <ExpenseTable data={filtered} onRowClick={setSelected} />
                </div>
              )}
              {active==='reports' && (
                <div className="space-y-6">
                  <AnalyticsCharts summary={summary} />
                  <TeamSummary expenses={teamExpenses} />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Notifications drawer */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 transform transition-transform duration-300 z-40 flex flex-col ${notificationsOpen? 'translate-x-0':'translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-semibold tracking-wide text-white">Notifications</h2>
          <button onClick={()=>setNotificationsOpen(false)} className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-white"><Icon.x className="w-4 h-4"/></button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {!notifications.length && <div className="text-xs text-slate-500 dark:text-slate-400">No notifications yet.</div>}
          {notifications.map(n=> (
            <div key={n.id} className={`text-xs rounded-lg border px-3 py-2 flex flex-col gap-1 ${n.read? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400':'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-slate-800 dark:text-slate-200'}`}> 
              <div className="font-medium">{n.msg}</div>
              <div className="text-[10px] opacity-60">{new Date(n.ts).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
        {notifications.length>0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <button onClick={markAllRead} className="text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 flex-1 text-white">Mark all read</button>
            <button onClick={()=> setNotifications([])} className="text-xs px-3 py-2 rounded-lg border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40">Clear</button>
          </div>
        )}
      </div>

      {selected && <ExpenseDetailModal expense={selected} onClose={()=>setSelected(null)} onUpdate={updateStatus} loading={actionLoading} />}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-slate-900 text-white px-4 py-2 rounded-lg shadow z-50 text-sm flex items-center gap-3">
          <span>{toast.msg}</span>
          <button onClick={()=>setToast(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}
      <ProfileDrawer open={profileDrawerOpen} onClose={()=>setProfileDrawerOpen(false)} width={420} />
    </div>
  );
}
