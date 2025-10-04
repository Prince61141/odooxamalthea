import React, { useState } from 'react';
import axios from 'axios';
import AuthLayout, { HeroPanel } from '../components/AuthLayout.jsx';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const ForgotPassword = () => {
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [success, setSuccess] = useState(false);

	const handleSubmit = async e => {
		e.preventDefault();
		setLoading(true);
		setMessage('');
		setSuccess(false);
		try {
			const res = await axios.post(`${API_BASE}/api/auth/forgot-password`, { email });
			setMessage(res.data.message || 'Reset link sent to your email!');
			setSuccess(true);
			setEmail('');
		} catch (err) {
			setMessage(err.response?.data?.error || 'Failed to send reset link');
			setSuccess(false);
		}
		setLoading(false);
	};

	return (
		<AuthLayout
			heading="Forgot Password"
			subheading="We'll send you a link to reset your password"
			sideContent={<HeroPanel />}
			altLink={<div className="text-[13px]">Remember your password? <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold">Sign in</Link></div>}
		>
			<form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full max-w-md" autoComplete="on">
				{/* Email */}
				<div className="group relative">
					<label className="absolute left-4 top-2 text-[10px] font-semibold tracking-wide uppercase text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">Email</label>
					<input 
						name="email" 
						type="email" 
						placeholder="you@email.com" 
						value={email} 
						onChange={(e) => setEmail(e.target.value)} 
						required 
						className="w-full rounded-2xl bg-slate-100/60 dark:bg-slate-800/60 backdrop-blur px-4 pt-6 pb-3 text-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-slate-100 placeholder:text-slate-400" 
					/>
				</div>

				<button 
					type="submit" 
					disabled={loading} 
					className="relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 dark:from-indigo-500 dark:to-indigo-400 px-6 py-4 text-sm font-semibold tracking-wide text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:-translate-y-0.5 transition disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed"
				>
					{loading ? 'Sending...' : 'Send Reset Link'}
				</button>

				{message && (
					<div className={`text-xs font-medium mt-1 ${success ? 'text-emerald-500' : 'text-rose-500'}`}>
						{message}
					</div>
				)}
			</form>
		</AuthLayout>
	);
};

export default ForgotPassword;
