import React, { useState } from 'react';
import axios from 'axios';
import AuthLayout, { HeroPanel } from '../components/AuthLayout.jsx';
import { Link, useParams, useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const ResetPassword = () => {
	const { token } = useParams();
	const navigate = useNavigate();
	const [form, setForm] = useState({ password: '', confirmPassword: '' });
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [success, setSuccess] = useState(false);
	const [showPass, setShowPass] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	const handleChange = e => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const handleSubmit = async e => {
		e.preventDefault();
		setLoading(true);
		setMessage('');
		setSuccess(false);

		if (form.password !== form.confirmPassword) {
			setMessage('Passwords do not match');
			setLoading(false);
			return;
		}

		if (form.password.length < 6) {
			setMessage('Password must be at least 6 characters');
			setLoading(false);
			return;
		}

		try {
			const res = await axios.post(`${API_BASE}/api/auth/reset-password/${token}`, { 
				password: form.password 
			});
			setMessage(res.data.message || 'Password reset successful!');
			setSuccess(true);
			setForm({ password: '', confirmPassword: '' });
			
			// Redirect to login after 2 seconds
			setTimeout(() => {
				navigate('/login');
			}, 2000);
		} catch (err) {
			setMessage(err.response?.data?.error || 'Failed to reset password');
			setSuccess(false);
		}
		setLoading(false);
	};

	return (
		<AuthLayout
			heading="Reset Password"
			subheading="Create a new password for your account"
			sideContent={<HeroPanel />}
			altLink={<div className="text-[13px]">Remember your password? <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold">Sign in</Link></div>}
		>
			<form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full max-w-md" autoComplete="on">
				{/* New Password */}
				<div className="group relative">
					<label className="absolute left-4 top-2 text-[10px] font-semibold tracking-wide uppercase text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">New Password</label>
					<input 
						name="password" 
						type={showPass ? 'text' : 'password'} 
						placeholder="••••••••" 
						value={form.password} 
						onChange={handleChange} 
						required 
						className="w-full rounded-2xl bg-slate-100/60 dark:bg-slate-800/60 backdrop-blur px-4 pt-6 pb-3 text-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-slate-100 placeholder:text-slate-400" 
					/>
					<button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
						{showPass ? 'Hide' : 'Show'}
					</button>
				</div>
				
				{/* Confirm Password */}
				<div className="group relative">
					<label className="absolute left-4 top-2 text-[10px] font-semibold tracking-wide uppercase text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">Confirm Password</label>
					<input 
						name="confirmPassword" 
						type={showConfirm ? 'text' : 'password'} 
						placeholder="••••••••" 
						value={form.confirmPassword} 
						onChange={handleChange} 
						required 
						className="w-full rounded-2xl bg-slate-100/60 dark:bg-slate-800/60 backdrop-blur px-4 pt-6 pb-3 text-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-slate-100 placeholder:text-slate-400" 
					/>
					<button type="button" onClick={() => setShowConfirm(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
						{showConfirm ? 'Hide' : 'Show'}
					</button>
				</div>

				<button 
					type="submit" 
					disabled={loading} 
					className="relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 dark:from-indigo-500 dark:to-indigo-400 px-6 py-4 text-sm font-semibold tracking-wide text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:-translate-y-0.5 transition disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed"
				>
					{loading ? 'Resetting...' : 'Reset Password'}
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

export default ResetPassword;
