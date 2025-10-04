import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthLayout, { HeroPanel } from '../components/AuthLayout.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext.jsx';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const Login = () => {
	const navigate = useNavigate();
	const { login, isAuthenticated, getDashboardPath } = useAuth();
	const [form, setForm] = useState({ email: '', password: '' });
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [showPass, setShowPass] = useState(false);

	useEffect(() => {
		if (isAuthenticated) {
			navigate(getDashboardPath(), { replace: true });
		}
	}, [isAuthenticated, navigate, getDashboardPath]);

	const handleChange = e => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const handleSubmit = async e => {
		e.preventDefault();
		setLoading(true);
		setMessage('');
		try {
			const res = await axios.post(`${API_BASE}/api/auth/login`, form);
			setMessage(res.data.message || 'Login successful!');
			if (res.data.token) {
				login(res.data.token);
				// navigate after context updated (short delay not required due to effect above)
			}
		} catch (err) {
			setMessage(err.response?.data?.error || 'Login failed');
		}
		setLoading(false);
	};

	return (
		<AuthLayout
			heading="Sign In"
			subheading="Access your SmartExpense dashboard"
			sideContent={<HeroPanel />}
			altLink={<div className="text-[13px]">New here? <Link to="/signup" className="text-indigo-600 dark:text-indigo-400 font-semibold">Create account</Link></div>}
		>
			<form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full max-w-md" autoComplete="on">
				{/* Email */}
				<div className="group relative">
					<label className="absolute left-4 top-2 text-[10px] font-semibold tracking-wide uppercase text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">Email</label>
					<input name="email" type="email" placeholder="you@email.com" value={form.email} onChange={handleChange} required className="w-full rounded-2xl bg-slate-100/60 dark:bg-slate-800/60 backdrop-blur px-4 pt-6 pb-3 text-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-slate-100 placeholder:text-slate-400" />
				</div>
				{/* Password */}
				<div className="group relative">
					<label className="absolute left-4 top-2 text-[10px] font-semibold tracking-wide uppercase text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">Password</label>
					<input name="password" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={handleChange} required className="w-full rounded-2xl bg-slate-100/60 dark:bg-slate-800/60 backdrop-blur px-4 pt-6 pb-3 text-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-slate-100 placeholder:text-slate-400" />
					<button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline">{showPass ? 'Hide' : 'Show'}</button>
				</div>
				<div className="flex items-center justify-end -mt-2">
					<Link to="/forgot-password" className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline">Forgot Password?</Link>
				</div>
				<button type="submit" disabled={loading} className="relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 dark:from-indigo-500 dark:to-indigo-400 px-6 py-4 text-sm font-semibold tracking-wide text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:-translate-y-0.5 transition disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed">
					{loading ? 'Logging in...' : 'Login'}
				</button>
				{message && (
					<div className={`text-xs font-medium mt-1 ${/successful/i.test(message) ? 'text-emerald-500' : 'text-rose-500'}`}>{message}</div>
				)}
			</form>
		</AuthLayout>
	);
};

export default Login;
