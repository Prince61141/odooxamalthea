import React, { useState, useEffect } from 'react';
import '../auth.css';

// Redesigned auth layout using Tailwind utilities while retaining legacy classes for fallback.
// Provides glass panel, gradient background, dark mode readiness and consistent spacing with dashboards.
const AuthLayout = ({ children, sideContent, heading, subheading, altLink }) => {
  const [dark, setDark] = useState(()=>{
    try { return localStorage.getItem('authDark')==='true'; } catch { return false; }
  });
  useEffect(()=>{ try { localStorage.setItem('authDark', String(dark)); } catch(_){} },[dark]);

  return (
    <div className={(dark? 'dark ' : '') + 'min-h-screen w-full relative flex items-stretch bg-gradient-to-br from-indigo-600 via-slate-900 to-slate-950 text-slate-800 dark:text-slate-100 font-inter overflow-hidden'}>
      {/* Background decorative blobs */}
      <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-screen">
        <div className="absolute -top-40 -left-32 w-[520px] h-[520px] rounded-full bg-indigo-400 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[560px] h-[560px] rounded-full bg-cyan-400/60 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[760px] h-[760px] rounded-full bg-fuchsia-500/40 blur-3xl" />
      </div>
      <div className="flex flex-1 flex-col lg:flex-row relative z-10">
        {/* Left (form) */}
        <div className="w-full lg:max-w-xl px-6 sm:px-10 lg:px-14 py-10 sm:py-14 flex flex-col backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 shadow-2xl/30 border border-white/30 dark:border-slate-700/40 rounded-none lg:rounded-r-3xl">
          <div className="flex items-center justify-between mb-8 text-xs font-medium text-slate-600 dark:text-slate-400">
            {altLink && <div className="space-x-2 [&_a]:text-indigo-600 dark:[&_a]:text-indigo-400 [&_a]:font-semibold">{altLink}</div>}
            <button onClick={()=>setDark(d=>!d)} className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700/70 transition text-[11px]">
              {dark? 'Light' : 'Dark'}
            </button>
          </div>
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 dark:from-indigo-200 dark:via-indigo-100 dark:to-white bg-clip-text text-transparent drop-shadow-sm">
              {heading}
            </h1>
            {subheading && (
              <p className="mt-3 text-sm leading-relaxed max-w-md text-slate-600 dark:text-slate-400">
                {subheading}
              </p>
            )}
          </div>
          <div className="flex-1 w-full">
            {children}
          </div>
          <div className="mt-12 text-[10px] tracking-wide uppercase font-semibold text-slate-400 dark:text-slate-600">ENG ▾</div>
        </div>
        {/* Right panel */}
        <div className="hidden lg:flex flex-1 relative items-center justify-center p-10">
          <div className="absolute inset-0 backdrop-blur-[2px] rounded-l-3xl ring-1 ring-white/10" />
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="max-w-lg w-full">
              {sideContent}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PasswordRule = ({ ok, children }) => (
  <li className={ok ? 'rule-ok' : 'rule-pending'}>{children}</li>
);

export const HeroPanel = () => (
  <div className="relative flex flex-col gap-8 text-slate-100">
    <div className="grid gap-6">
      <div className="rounded-3xl bg-white/10 backdrop-blur-md p-6 border border-white/20 shadow-xl flex flex-col gap-3">
        <div className="text-xs uppercase tracking-wide text-indigo-200 font-semibold">Realtime</div>
        <div className="text-4xl font-bold leading-none bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">176,18</div>
        <div className="text-[11px] font-medium text-indigo-100/70">Inbox Items</div>
        <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-indigo-500/90 flex items-center justify-center text-xs font-semibold">45</div>
      </div>
      <div className="rounded-3xl bg-gradient-to-br from-indigo-500/70 via-fuchsia-500/50 to-cyan-400/60 backdrop-blur-xl p-6 border border-white/30 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl" />
        <div className="flex flex-col gap-4 relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">🔐</div>
            <h4 className="text-lg font-semibold tracking-tight">Your data, your rules</h4>
          </div>
          <p className="text-sm leading-snug text-indigo-50/80 max-w-sm">Your data belongs to you. End-to-end processing ensures integrity, privacy, and auditability across roles.</p>
          <div className="flex gap-2 mt-2">
            <span className="px-2 py-1 rounded-full bg-white/20 text-[10px] uppercase tracking-wide">Secure</span>
            <span className="px-2 py-1 rounded-full bg-white/20 text-[10px] uppercase tracking-wide">Audited</span>
            <span className="px-2 py-1 rounded-full bg-white/20 text-[10px] uppercase tracking-wide">Scoped</span>
          </div>
        </div>
      </div>
    </div>
    <div className="flex gap-4 mt-4">
      <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center font-semibold text-sm tracking-wide shadow-lg">IG</div>
      <div className="w-16 h-16 rounded-2xl bg-white/90 text-slate-900 flex items-center justify-center font-semibold text-sm tracking-wide shadow-lg">TT</div>
    </div>
  </div>
);

export default AuthLayout;
