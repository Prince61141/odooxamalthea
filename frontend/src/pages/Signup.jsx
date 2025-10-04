import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthLayout, { PasswordRule, HeroPanel } from '../components/AuthLayout.jsx';
import usePasswordRules from '../hooks/usePasswordRules.js';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', country: '' });
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/api/countries`)
      .then(res => setCountries(res.data))
      .catch(() => setCountries([]));
  }, []);

  const rules = usePasswordRules(form.password);
  const allRulesOk = Object.values(rules).every(Boolean);
  const passwordsMatch = form.password && form.password === form.confirm;

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!allRulesOk || !passwordsMatch) return;
    setLoading(true); setMessage('');
    try {
      const payload = { name: form.name, email: form.email, password: form.password, country: form.country };
      const res = await axios.post(`${API_BASE}/api/auth/signup`, payload);
      setMessage(res.data.message || 'Signup successful!');
      setTimeout(()=> navigate('/login'), 1200);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Signup failed');
    }
    setLoading(false);
  };

  return (
    <AuthLayout
      heading="Create Account"
      subheading="Join SmartExpense and streamline reimbursements"
      sideContent={<HeroPanel />}
      altLink={<div className="text-[13px]">Already member? <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold">Sign in</Link></div>}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full max-w-xl">
          {/* Name */}
          <div className="group relative">
            <label className="absolute left-4 top-2 text-[10px] font-semibold tracking-wide uppercase text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">Name</label>
            <input name="name" placeholder="Jane Doe" value={form.name} onChange={handleChange} required className="w-full rounded-2xl bg-slate-100/60 dark:bg-slate-800/60 backdrop-blur px-4 pt-6 pb-3 text-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-slate-100 placeholder:text-slate-400" />
          </div>
          {/* Email */}
          <div className="group relative">
            <label className="absolute left-4 top-2 text-[10px] font-semibold tracking-wide uppercase text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">Email</label>
            <input name="email" type="email" placeholder="you@company.com" value={form.email} onChange={handleChange} required className="w-full rounded-2xl bg-slate-100/60 dark:bg-slate-800/60 backdrop-blur px-4 pt-6 pb-3 text-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-slate-100 placeholder:text-slate-400" />
          </div>
          {/* Password */}
          <div className="group relative">
            <label className="absolute left-4 top-2 text-[10px] font-semibold tracking-wide uppercase text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">Password</label>
            <input name="password" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={handleChange} required className="w-full rounded-2xl bg-slate-100/60 dark:bg-slate-800/60 backdrop-blur px-4 pt-6 pb-3 text-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-slate-100 placeholder:text-slate-400" />
            <button type="button" onClick={()=>setShowPass(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline">{showPass? 'Hide':'Show'}</button>
          </div>
          {/* Password Rules */}
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 -mt-2">
            <li className={"flex items-center gap-2 " + (rules.length? 'text-emerald-500':'')}> <span className="w-2 h-2 rounded-full bg-current" /> 8+ chars</li>
            <li className={"flex items-center gap-2 " + (rules.numberOrSymbol? 'text-emerald-500':'')}> <span className="w-2 h-2 rounded-full bg-current" /> Number / symbol</li>
            <li className={"flex items-center gap-2 " + (rules.lowerUpper? 'text-emerald-500':'')}> <span className="w-2 h-2 rounded-full bg-current" /> Mixed case</li>
          </ul>
          {/* Confirm */}
          <div className="group relative -mt-1">
            <label className="absolute left-4 top-2 text-[10px] font-semibold tracking-wide uppercase text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">Confirm Password</label>
              <input name="confirm" type={showPass ? 'text' : 'password'} placeholder="Repeat password" value={form.confirm} onChange={handleChange} required className="w-full rounded-2xl bg-slate-100/60 dark:bg-slate-800/60 backdrop-blur px-4 pt-6 pb-3 text-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-slate-100 placeholder:text-slate-400" />
            {!passwordsMatch && form.confirm && (
              <div className="mt-1 text-[11px] text-rose-500 font-medium">Passwords do not match</div>
            )}
          </div>
          {/* Country */}
          <div className="group relative">
            <label className="absolute left-4 top-2 text-[10px] font-semibold tracking-wide uppercase text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">Country</label>
            <select name="country" value={form.country} onChange={handleChange} required className="w-full rounded-2xl bg-slate-100/60 dark:bg-slate-800/60 backdrop-blur px-4 pt-6 pb-3 text-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-slate-100">
              <option value="">Select Country</option>
              {countries.map((c,i)=> <option key={i} value={c.name.common}>{c.name.common}</option> )}
            </select>
          </div>
          <button type="submit" disabled={loading || !allRulesOk || !passwordsMatch} className="relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 dark:from-indigo-500 dark:to-indigo-400 px-6 py-4 text-sm font-semibold tracking-wide text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:-translate-y-0.5 transition disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed">
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
          {message && <div className={`text-xs font-medium mt-1 ${/successful/i.test(message) ? 'text-emerald-500' : 'text-rose-500'}`}>{message}</div>}
      </form>
    </AuthLayout>
  );
};

export default Signup;
