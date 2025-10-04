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
			subheading="Enter your new password"
			sideContent={<HeroPanel />}
			altLink={<div>Remember your password? <Link to="/login">Sign in</Link></div>}
		>
			<form className="auth-form" onSubmit={handleSubmit}>
				<div className="auth-field">
					<label>New Password</label>
					<input 
						name="password" 
						type={showPass ? 'text' : 'password'} 
						placeholder="••••••••" 
						value={form.password} 
						onChange={handleChange} 
						required 
					/>
					<span className="toggle-pass" onClick={() => setShowPass(s => !s)}>
						{showPass ? 'Hide' : 'Show'}
					</span>
				</div>
				<div className="auth-field">
					<label>Confirm Password</label>
					<input 
						name="confirmPassword" 
						type={showConfirm ? 'text' : 'password'} 
						placeholder="••••••••" 
						value={form.confirmPassword} 
						onChange={handleChange} 
						required 
					/>
					<span className="toggle-pass" onClick={() => setShowConfirm(s => !s)}>
						{showConfirm ? 'Hide' : 'Show'}
					</span>
				</div>
				<button type="submit" className="auth-primary" disabled={loading}>
					{loading ? 'Resetting...' : 'Reset Password'}
				</button>
				{message && (
					<div className={`auth-message ${success ? 'auth-success' : ''}`}>
						{message}
					</div>
				)}
			</form>
		</AuthLayout>
	);
};

export default ResetPassword;
