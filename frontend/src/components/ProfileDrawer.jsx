import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from './AuthContext.jsx';

/*
ProfileDrawer: slide-in panel for viewing/updating current user profile.
Props:
  open (bool) - visible state
  onClose () - close handler
  width (string|number) - optional custom width (default 380)

Features:
 - Fetches /users/me on mount/open
 - Allows updating name and password
 - Password change optional; requires confirm match
 - Basic validation & feedback
*/
export default function ProfileDrawer({ open, onClose, width = 420 }) {
  const { user, setUser, token, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', password: '', confirm: '' });
  const [original, setOriginal] = useState({ name: user?.name || '', email: user?.email || '' });

  // Fetch fresh profile when opening
  useEffect(()=>{
    let ignore=false;
    async function fetchMe(){
      if(!open) return; setLoading(true); setError(null);
      try {
        const res = await api.get('/users/me');
        if(!ignore){
          const n = res.data.name || ''; const em = res.data.email || '';
            setForm(f=>({ ...f, name: n, email: em }));
            setOriginal({ name:n, email:em });
            setUser && setUser(res.data);
        }
      } catch(e){ if(!ignore) setError('Failed to load profile'); }
      finally { if(!ignore) setLoading(false); }
    }
    fetchMe();
    return ()=>{ ignore=true; };
  },[open,setUser]);

  // Auto clear messages
  useEffect(()=>{ if(success||error){ const t=setTimeout(()=>{ setSuccess(null); setError(null); }, 3000); return ()=>clearTimeout(t);} },[success,error]);

  const onChange = e => { const { name, value } = e.target; setForm(f=>({...f,[name]:value})); };

  const isChanged = () => {
    if(form.name.trim() !== original.name) return true;
    if(form.password) return true;
    return false;
  };

  const canSave = () => {
    if(!isChanged()) return false;
    if(!form.name.trim()) return false;
    if(form.password || form.confirm){
      if(form.password.length < 6) return false;
      if(form.password !== form.confirm) return false;
    }
    return true;
  };

  const submit = async (e) => {
    e.preventDefault(); if(!canSave()) return;
    setSaving(true); setError(null); setSuccess(null);
    try {
      const payload = {};
      if(form.name.trim() !== original.name) payload.name = form.name.trim();
      if(form.password) payload.password = form.password;
      if(Object.keys(payload).length===0){ setSaving(false); return; }
      const res = await api.put('/users/me', payload);
      setSuccess('Profile updated');
      setUser && setUser(res.data);
      setOriginal({ name: res.data.name || form.name, email: res.data.email || form.email });
      setForm(f=>({...f, password:'', confirm:''}));
    } catch(e){ setError(e.response?.data?.error || 'Update failed'); }
    finally { setSaving(false); }
  };

  if(!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm opacity-100 pointer-events-auto" 
        aria-hidden="false"
      />
      {/* Panel */}
      <aside 
        style={{ width }} 
        className="absolute top-0 right-0 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl transform transition-transform duration-300 flex flex-col translate-x-0 pointer-events-auto" 
        aria-hidden="false"
      > 
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-200">My Profile</h2>
          <button onClick={onClose} className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading? (
            <div className="space-y-5 animate-pulse" aria-label="Loading profile">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3 w-48 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              </div>
              <div className="h-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="h-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="h-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="h-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-lg font-semibold shadow-inner select-none">
                  {form.name ? form.name.trim()[0].toUpperCase() : (user?.email||'?')[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{form.name || 'Unnamed User'}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{form.email}</div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Name</label>
                <input name="name" value={form.name} onChange={onChange} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40" placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Email</label>
                <input disabled value={form.email} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-500 dark:text-slate-400" />
                <p className="text-[10px] text-slate-400">Email can't be changed.</p>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">New Password</label>
                <input name="password" type="password" value={form.password} onChange={onChange} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40" placeholder="Leave blank to keep current" />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Confirm Password</label>
                <input name="confirm" type="password" value={form.confirm} onChange={onChange} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40" placeholder="Repeat new password" />
                {form.password && form.confirm && form.password!==form.confirm && <p className="text-[11px] text-rose-600">Passwords do not match.</p>}
              </div>
              {error && <div className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700 px-3 py-2 rounded">{error}</div>}
              {success && <div className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 px-3 py-2 rounded">{success}</div>}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button type="button" onClick={logout} className="text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">Logout</button>
                <button disabled={!canSave()||saving} className="text-xs px-4 py-2 rounded-lg bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-500 text-white font-medium shadow-sm">
                  {saving? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
        <div className="p-4 text-[10px] text-center text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800">Profile settings</div>
      </aside>
    </div>
  );
}
