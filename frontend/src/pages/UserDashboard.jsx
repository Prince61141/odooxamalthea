import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../components/AuthContext.jsx';
import api from '../api';
import { Link } from 'react-router-dom';

// NOTE: Single-file implementation per prompt.
// Icons (simple inline SVG components) to avoid extra deps
const Icon = {
  menu: (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>),
  x: (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>),
  bell: (p)=>(<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21h4"/></svg>),
  logout: (p)=>(<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3H5v18h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>),
  dashboard: (p)=>(<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="15" width="7" height="6"/></svg>),
  plus:(p)=>(<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>),
  search:(p)=>(<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>),
  mic:(p)=>(<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 19v3"/></svg>),
  file:(p)=>(<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 3h11l5 5v13H4z"/><path d="M14 3v6h6"/></svg>),
  sun:(p)=>(<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07 6.07-1.42-1.42M8.35 8.35 6.93 6.93m0 10.14 1.42-1.42m9.3-9.3-1.42 1.42"/></svg>),
  moon:(p)=>(<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg>),
};

const categories = ['Travel','Meals','Supplies','Software','Other'];
const statusStyles = {
  pending: 'bg-amber-100 text-amber-700 border border-amber-200',
  approved: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  rejected: 'bg-rose-100 text-rose-700 border border-rose-200'
};

export default function UserDashboard() {
  const { role, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [form, setForm] = useState({ amount:'', currency:'USD', category:'', description:'', date:'', file:null });
  const [submitting, setSubmitting] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]); // {id,msg,read,type,ts}
  const [unread, setUnread] = useState(0);
  const [rates, setRates] = useState(null); // FX rates
  const [companyCurrency, setCompanyCurrency] = useState('USD'); // Could fetch from user/company
  const [convertedValue, setConvertedValue] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [dark, setDark] = useState(()=> {
    if (typeof window !== 'undefined') {
      try { return localStorage.getItem('themeDark') === 'true'; } catch(_){}
    }
    return false;
  });
  const voiceSupported = typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  const recognitionRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [receiptMeta, setReceiptMeta] = useState({ receiptUrl: null, ocrText: null, ocrData: null });
  const dropRef = useRef(null);

  // Fetch expenses
  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/expenses/mine');
      setExpenses(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(()=>{ loadExpenses(); }, [loadExpenses]);

  // Derive notifications from expenses (approved/rejected changes)
  useEffect(()=>{
    // Basic generation: for each non-pending create message if not already present
    setNotifications(prev => {
      const existingKeys = new Set(prev.map(n=>n.key));
      const newOnes = expenses.filter(e=> e.status !== 'pending').map(e=>({
        key: e._id + ':' + e.status,
        id: e._id + ':' + e.status,
        msg: e.status === 'approved' ? `Approved: ${e.category} ${e.currency} ${Number(e.amount).toFixed(2)}` : `Rejected: ${e.category} ${e.currency} ${Number(e.amount).toFixed(2)}`,
        type: e.status,
        read: existingKeys.has(e._id+':'+e.status),
        ts: new Date(e.updatedAt || e.date || Date.now()).getTime()
      })).filter(n=> !existingKeys.has(n.key));
      const merged = [...prev, ...newOnes].sort((a,b)=> b.ts - a.ts);
      setUnread(merged.filter(n=>!n.read).length);
      return merged;
    });
  }, [expenses]);

  // Currency conversion fetch
  useEffect(()=>{
    if (!form.amount || !form.currency || form.currency === companyCurrency) { setConvertedValue(null); return; }
    let aborted = false;
    (async()=>{
      try {
        const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${form.currency}`);
        const json = await res.json();
        if (!aborted && json?.rates) {
          setRates(json.rates);
          if (json.rates[companyCurrency]) {
            const cv = parseFloat(form.amount)* json.rates[companyCurrency];
            setConvertedValue(cv);
          }
        }
      } catch(e){ /* ignore */ }
    })();
    return ()=>{ aborted = true; };
  }, [form.amount, form.currency, companyCurrency]);

  // AI Suggestion mock (categorize based on description keywords)
  useEffect(()=>{
    if (!form.description) { setAiSuggestion(null); return; }
    const desc = form.description.toLowerCase();
    if (/flight|uber|taxi|hotel|airbnb|train/.test(desc)) setAiSuggestion('Travel');
    else if (/meal|restaurant|cafe|lunch|dinner|breakfast|food|coffee/.test(desc)) setAiSuggestion('Meals');
    else if (/license|saas|subscription|software|tool/.test(desc)) setAiSuggestion('Software');
    else setAiSuggestion(null);
  }, [form.description]);

  // Voice input (simple grammar)
  const startVoice = () => {
    if (!voiceSupported) return;
    const Cls = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new Cls();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      // Pattern: Add $25 lunch at Subway yesterday
      const regex = /\$?(\d+(?:\.\d+)?)\s+(.*?)\s+(?:at\s+([\w\s]+))?(?:\s+(yesterday|today))?/i;
      const m = transcript.match(regex);
      const today = new Date();
      let date = today.toISOString().split('T')[0];
      if (m) {
        if (m[4]==='yesterday') {
          const d = new Date(); d.setDate(d.getDate()-1); date = d.toISOString().split('T')[0];
        }
        setForm(f=> ({...f, amount: m[1], description: m[2] + (m[3]? (' at '+m[3]):''), date }));
        setToast({type:'info', msg:`Parsed voice input: ${transcript}`});
      } else {
        setToast({type:'error', msg:'Could not parse voice input'});
      }
    };
    rec.onerror = ()=> setToast({type:'error', msg:'Voice input error'});
    rec.start();
    recognitionRef.current = rec;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      const file = files[0];
      if (!file) return;
      uploadReceiptFile(file);
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  function uploadReceiptFile(file){
    if (!file) return;
    if (!/\.(png|jpe?g|pdf)$/i.test(file.name)) { setToast({type:'error', msg:'Only PNG/JPG/PDF allowed'}); return; }
    setUploading(true); setUploadProgress(0);
    const data = new FormData();
    data.append('file', file);
    api.post('/expenses/receipt', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: ev => { if (ev.total) setUploadProgress(Math.round((ev.loaded/ev.total)*100)); }
    }).then(res=> {
      const o = res.data?.ocrData || {};
      setForm(f=> {
        const next = { ...f, file };
        if (!f.amount && o.amount != null) next.amount = o.amount;
        if ((!f.currency || f.currency === 'USD') && o.currency) next.currency = o.currency;
        if (!f.date && o.date) {
          try { next.date = new Date(o.date).toISOString().split('T')[0]; } catch(_){}
        }
        if (!f.description && o.merchant) next.description = o.merchant;
        return next;
      });
      setReceiptMeta({ receiptUrl: res.data.receiptUrl, ocrText: res.data.ocrText, ocrData: res.data.ocrData });
      const hasAny = o.amount || o.currency || o.date || o.merchant;
      setToast({type: hasAny? 'success' : 'info', msg: hasAny? 'Receipt uploaded & data extracted' : 'Receipt uploaded (no data parsed)'});
    }).catch(err=> {
      setToast({type:'error', msg: err.response?.data?.error || 'Upload failed'});
    }).finally(()=> setUploading(false));
  }

  // Drag & drop handlers
  useEffect(()=>{
    const el = dropRef.current; if(!el) return;
    const prevent = e=> { e.preventDefault(); e.stopPropagation(); };
    const onDrop = e=> { prevent(e); const file = e.dataTransfer.files?.[0]; if (file) uploadReceiptFile(file); };
    ['dragenter','dragover','dragleave','drop'].forEach(evt=> el.addEventListener(evt, prevent));
    el.addEventListener('drop', onDrop);
    return ()=> { ['dragenter','dragover','dragleave','drop'].forEach(evt=> el.removeEventListener(evt, prevent)); el.removeEventListener('drop', onDrop); };
  }, []);

  // Submit expense
  const submitExpense = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.category || !form.date) return;
    setSubmitting(true);
    try {
      const payload = { amount: parseFloat(form.amount), currency: form.currency, category: form.category, description: form.description, date: form.date };
      if (receiptMeta.receiptUrl) {
        payload.receiptUrl = receiptMeta.receiptUrl;
        payload.ocrText = receiptMeta.ocrText;
        payload.ocrData = receiptMeta.ocrData;
      }
      await api.post('/expenses', payload);
      setToast({type:'success', msg:'Expense submitted'});
      setForm(f=>({...f, amount:'', category:'', description:'', date:'', file:null }));
      setReceiptMeta({ receiptUrl:null, ocrText:null, ocrData:null });
      loadExpenses();
    } catch(e){
      setToast({type:'error', msg: e.response?.data?.error || 'Submit failed'});
    } finally { setSubmitting(false); }
  };

  const filtered = expenses.filter(e=> (filter==='all'|| e.status===filter) && ( !search || (e.category+e.description).toLowerCase().includes(search.toLowerCase()) ) );

  const summary = React.useMemo(()=>{
    const total = expenses.reduce((a,b)=> a + Number(b.amount||0),0);
    const approvedExpenses = expenses.filter(e=>e.status==='approved');
    const approved = approvedExpenses.reduce((a,b)=> a + Number(b.amount||0),0);
    const pendingCount = expenses.filter(e=>e.status==='pending').length;
    const last = [...expenses].sort((a,b)=> new Date(b.date)-new Date(a.date))[0];

    // Average approval hours
    let avgApprovalHours = 0;
    if (approvedExpenses.length) {
      const diffs = approvedExpenses.map(e=>{
        const start = new Date(e.createdAt || e.date);
        const end = new Date(e.approvedAt || e.updatedAt || e.date);
        return (end - start) / (1000*60*60);
      }).filter(x=> x>=0);
      if (diffs.length) avgApprovalHours = diffs.reduce((a,b)=>a+b,0) / diffs.length;
    }

    // Velocity (7d vs previous 7d)
    const now = new Date();
    const startCurrent = new Date(now); startCurrent.setDate(startCurrent.getDate()-6);
    const startPrev = new Date(startCurrent); startPrev.setDate(startPrev.getDate()-7);
    let current7d = 0, previous7d = 0;
    expenses.forEach(e=> { const d = new Date(e.date); if (d >= startCurrent) current7d++; else if (d >= startPrev) previous7d++; });
    let changePct = null;
    if (previous7d === 0 && current7d > 0) changePct = 100; else if (previous7d > 0) changePct = ((current7d - previous7d)/previous7d)*100;

    return { total, approved, pendingCount, lastDate: last? new Date(last.date).toLocaleDateString(): '—', avgApprovalHours, velocity: { current7d, previous7d, changePct } };
  }, [expenses]);

  const markAllRead = () => {
    setNotifications(n=> n.map(x=>({...x, read:true}))); setUnread(0);
  };

  const statusBadge = (s) => statusStyles[s] || statusStyles.pending;

  const toggleDark = () => setDark(d=> { const v = !d; try { localStorage.setItem('themeDark', String(v)); } catch(_){} return v; });

  // Utility: toast auto dismiss
  useEffect(()=>{ if (toast) { const t = setTimeout(()=> setToast(null), 3000); return ()=> clearTimeout(t); } }, [toast]);

  return (
    <div className={`${dark? 'dark' : ''}`}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900 dark:text-slate-100 text-gray-800 transition-colors duration-300">
        {/* Sidebar */}
        <aside className={`relative z-30 w-64 shrink-0 bg-white dark:bg-slate-800 shadow-lg border-r border-gray-100 dark:border-slate-700 transform transition-transform duration-300 flex flex-col fixed md:static inset-y-0 left-0 ${sidebarOpen? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="h-16 flex items-center px-5 justify-between">
            <span className="font-bold tracking-tight text-lg">My Expenses</span>
            <button onClick={()=>setSidebarOpen(false)} className="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700"><Icon.x className="w-5 h-5"/></button>
          </div>
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto pb-6">
            {[
              {id:'dashboard', label:'Dashboard', icon: Icon.dashboard},
              {id:'submit', label:'Submit Expense', icon: Icon.plus},
              {id:'history', label:'My Expenses', icon: Icon.file},
              {id:'notifications', label:'Notifications', icon: Icon.bell}
            ].map(item => {
              const IconComp = item.icon;
              return (
                <button key={item.id} onClick={()=>{ setActiveSection(item.id); if(item.id==='notifications') setNotificationsOpen(true); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${activeSection===item.id? 'bg-indigo-600 text-white shadow' : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                  <IconComp className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.id==='notifications' && unread>0 && <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500 text-white">{unread}</span>}
                </button>
              );
            })}
          </nav>
          <div className="p-4 border-t border-gray-100 dark:border-slate-700 text-xs text-gray-500 dark:text-slate-400">Role: {role}</div>
        </aside>

  {/* Main wrapper */}
  <div className="flex-1 flex flex-col md:pl-0">
          {/* Top bar */}
          <header className="h-16 backdrop-blur bg-white/70 dark:bg-slate-800/70 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <button onClick={()=>setSidebarOpen(s=>!s)} className="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700"><Icon.menu className="w-5 h-5"/></button>
              <h1 className="font-semibold text-lg tracking-tight hidden sm:block">Employee Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={toggleDark} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700" aria-label="Toggle dark mode">{dark? <Icon.sun className="w-5 h-5"/> : <Icon.moon className="w-5 h-5"/>}</button>
              <button onClick={()=> setNotificationsOpen(o=>!o)} className="relative p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700" aria-label="Notifications">
                <Icon.bell className="w-5 h-5"/>
                {unread>0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unread}</span>}
              </button>
              <div className="relative group">
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-sm font-medium">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">U</div>
                  <span className="hidden sm:inline">User</span>
                </button>
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 py-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition">
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700">View Profile</button>
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700">Settings</button>
                  <button onClick={logout} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"><Icon.logout className="w-4 h-4"/> Logout</button>
                </div>
              </div>
            </div>
          </header>

          {/* Main content scroll area */}
          <main className="flex-1 w-full mx-auto max-w-[1600px] px-4 md:px-8 py-8 space-y-10">
            {/* Summary / Dashboard Cards */}
            <section id="dashboard" className={`${activeSection==='dashboard'? 'block' : 'hidden'} space-y-6`}>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-6">
                <SummaryCard title="Total Submitted" value={`$${summary.total.toFixed(2)}`} sub="All statuses" gradient="from-indigo-500 to-blue-500" />
                <SummaryCard title="Approved" value={`$${summary.approved.toFixed(2)}`} sub="Approved total" gradient="from-emerald-500 to-teal-500" />
                <SummaryCard title="Pending" value={String(summary.pendingCount)} sub="Awaiting review" gradient="from-amber-500 to-amber-600" />
                <SummaryCard title="Last Submission" value={summary.lastDate} sub="Most recent" gradient="from-fuchsia-500 to-pink-500" />
                <SummaryCard title="Avg Approval (h)" value={summary.avgApprovalHours.toFixed(1)} sub="Avg hours" gradient="from-cyan-500 to-sky-500" />
                <SummaryCard title="Velocity 7d" value={String(summary.velocity.current7d)} sub={(()=>{ const cp=summary.velocity.changePct; if(cp==null) return 'No prior data'; const sign = cp>0? '+':''; return `${sign}${cp.toFixed(1)}% vs prev`; })()} gradient="from-lime-500 to-green-500" />
              </div>
            </section>

            {/* Submission Form */}
            <section id="submit" className={`${activeSection==='submit'? 'block' : 'hidden'} space-y-6`}>
              <div className="flex items-start flex-wrap gap-6">
                <form onSubmit={submitExpense} className="flex-1 min-w-[320px] bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-5">
                  <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2"><Icon.plus className="w-5 h-5"/> Submit Expense</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">Amount</label>
                      <input type="number" step="0.01" value={form.amount} onChange={e=> setForm(f=>({...f, amount:e.target.value}))} required className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">Currency</label>
                      <input value={form.currency} onChange={e=> setForm(f=>({...f, currency:e.target.value.toUpperCase()}))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400 flex items-center gap-2">Category {aiSuggestion && <button type="button" onClick={applySuggestion} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-600 text-white">Use {aiSuggestion}</button>}</label>
                      <select value={form.category} onChange={e=> setForm(f=>({...f, category:e.target.value}))} required className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">Select category</option>
                        {categories.map(c=> <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">Date</label>
                      <input type="date" value={form.date} onChange={e=> setForm(f=>({...f, date:e.target.value}))} required className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">Description</label>
                      <textarea rows={3} value={form.description} onChange={e=> setForm(f=>({...f, description:e.target.value}))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y" placeholder="e.g. Lunch with client at Cafe" />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-slate-600 hover:border-indigo-500 transition bg-gray-50 dark:bg-slate-700">
                      <Icon.file className="w-4 h-4"/>
                      <span>Upload Receipt</span>
                      <input type="file" onChange={handleChange} className="hidden" />
                    </label>
                    {form.file && <span className="text-xs px-2 py-1 rounded bg-indigo-50 dark:bg-slate-700 border border-indigo-200 dark:border-slate-600">{form.file.name}</span>}
                    {voiceSupported && <button type="button" onClick={startVoice} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg border bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600"><Icon.mic className="w-4 h-4"/> Voice</button>}
                  </div>
                  {convertedValue && <div className="text-xs text-gray-600 dark:text-slate-400">≈ {companyCurrency} {convertedValue.toFixed(2)} (company currency)</div>}
                  <div className="flex items-center gap-3">
                    <button disabled={submitting} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow disabled:opacity-50 disabled:cursor-not-allowed"><Icon.plus className="w-4 h-4"/>{submitting? 'Submitting...' : 'Submit Expense'}</button>
                    {toast && toast.type==='info' && <span className="text-xs text-indigo-600">{toast.msg}</span>}
                  </div>
                </form>
                {/* Dashboard summary visible on wide screens when in submit view */}
                <div className="flex-1 min-w-[260px] space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <MiniMetric label="Total" value={`$${summary.total.toFixed(2)}`} />
                    <MiniMetric label="Approved" value={`$${summary.approved.toFixed(2)}`} />
                    <MiniMetric label="Pending" value={String(summary.pendingCount)} />
                    <MiniMetric label="Last" value={summary.lastDate} />
                  </div>
                  {aiSuggestion && <div className="text-xs p-3 rounded-lg bg-indigo-50 dark:bg-slate-700 border border-indigo-200 dark:border-slate-600">AI Suggestion: This looks like <span className="font-semibold">{aiSuggestion}</span>.</div>}
                </div>
              </div>
            </section>

            {/* History Table */}
            <section id="history" className={`${activeSection==='history'? 'block' : 'hidden'} space-y-6`}>
              <div className="flex flex-wrap items-center gap-3">
                {['all','pending','approved','rejected'].map(s=> (
                  <button key={s} onClick={()=>setFilter(s)} className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${filter===s? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300'}`}>{s.charAt(0).toUpperCase()+s.slice(1)}</button>
                ))}
                <div className="relative">
                  <Icon.search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input value={search} onChange={e=> setSearch(e.target.value)} placeholder="Search..." className="pl-9 pr-3 py-2 rounded-lg border bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                </div>
              </div>
              <div className="overflow-x-auto bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-sm">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-gray-500 dark:text-slate-400 uppercase text-[11px] tracking-wider">
                    <tr className="border-b border-gray-100 dark:border-slate-700">
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Description</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Manager</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr><td colSpan={6} className="px-4 py-6 text-center text-xs text-gray-500">Loading...</td></tr>
                    )}
                    {!loading && filtered.length===0 && (
                      <tr><td colSpan={6} className="px-4 py-6 text-center text-xs text-gray-500">No expenses.</td></tr>
                    )}
                    {!loading && filtered.map(exp => (
                      <tr key={exp._id} className="border-t border-gray-100 dark:border-slate-700 hover:bg-gray-50/60 dark:hover:bg-slate-700/50 transition">
                        <td className="px-4 py-3 whitespace-nowrap">{new Date(exp.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-medium">{exp.category}</td>
                        <td className="px-4 py-3 max-w-[240px]"><div className="truncate" title={exp.description}>{exp.description || '—'}</div></td>
                        <td className="px-4 py-3 font-semibold">{exp.currency} {Number(exp.amount).toFixed(2)}</td>
                        <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusBadge(exp.status)}`}>{exp.status}</span></td>
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">{exp.managerComment || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        </div>

        {/* Notifications Drawer */}
        <div className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-slate-800 shadow-xl border-l border-gray-200 dark:border-slate-700 transform transition-transform duration-300 z-40 flex flex-col ${notificationsOpen? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-semibold tracking-tight">Notifications</h3>
            <button onClick={()=> setNotificationsOpen(false)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700"><Icon.x className="w-5 h-5"/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length===0 && <div className="text-xs text-gray-500 dark:text-slate-400">No notifications.</div>}
            {notifications.map(n=> (
              <div key={n.id} className={`p-3 rounded-lg text-xs border ${n.type==='approved'? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700 text-rose-700 dark:text-rose-300'} ${!n.read? 'ring-2 ring-indigo-200 dark:ring-indigo-600/40' : ''}`}> 
                <div className="font-medium mb-0.5">{n.type==='approved' ? 'Approved' : 'Rejected'}</div>
                <div>{n.msg}</div>
                <div className="mt-1 text-[10px] opacity-60">{new Date(n.ts).toLocaleString()}</div>
              </div>
            ))}
          </div>
          {notifications.length>0 && <div className="p-3 border-t border-gray-100 dark:border-slate-700"><button onClick={markAllRead} className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">Mark All Read</button></div>}
        </div>
      </div>

      {/* Floating Toast */}
      {toast && (
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-3 z-50 ${toast.type==='success'? 'bg-emerald-600 text-white' : toast.type==='error'? 'bg-rose-600 text-white' : toast.type==='info'? 'bg-indigo-600 text-white' : 'bg-gray-800 text-white'}`}> 
          <span>{toast.msg}</span>
          <button onClick={()=> setToast(null)} className="text-white/70 hover:text-white">✕</button>
        </div>
      )}
    </div>
  );
}

// Reusable inline components inside file
function SummaryCard({ title, value, sub, gradient }) {
  return (
    <div className={`relative rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-[1px] shadow-sm overflow-hidden group`}> 
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-br ${gradient} blur-xl`}/>
      <div className="relative rounded-2xl bg-white dark:bg-slate-800 p-5 h-full flex flex-col">
        <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">{title}</div>
        <div className="text-2xl font-semibold mt-2 tracking-tight">{value}</div>
        <div className="mt-auto text-[11px] text-gray-400 dark:text-slate-500">{sub}</div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-4 flex flex-col">
      <div className="text-[10px] uppercase font-semibold tracking-wider text-gray-500 dark:text-slate-400">{label}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  );
}
