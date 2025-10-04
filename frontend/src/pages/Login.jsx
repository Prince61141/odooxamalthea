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
			subheading="Welcome back, access your inbox securely"
			sideContent={<HeroPanel />}
			altLink={<div>New here? <Link to="/signup">Create account</Link></div>}
		>
			<form className="auth-form" onSubmit={handleSubmit}>
				<div className="auth-field">
					<label>Email</label>
					<input name="email" type="email" placeholder="you@email.com" value={form.email} onChange={handleChange} required />
				</div>
				<div className="auth-field">
					<label>Password</label>
					<input name="password" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={handleChange} required />
					<span className="toggle-pass" onClick={() => setShowPass(s => !s)}>{showPass ? 'Hide' : 'Show'}</span>
				</div>
				<button type="submit" className="auth-primary" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
				{message && <div className={`auth-message ${/successful/i.test(message) ? 'auth-success' : ''}`}>{message}</div>}
			</form>
		</AuthLayout>
	);
};

export default Login;
