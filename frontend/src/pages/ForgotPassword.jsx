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
			subheading="Enter your email to receive a password reset link"
			sideContent={<HeroPanel />}
			altLink={<div>Remember your password? <Link to="/login">Sign in</Link></div>}
		>
			<form className="auth-form" onSubmit={handleSubmit}>
				<div className="auth-field">
					<label>Email</label>
					<input 
						name="email" 
						type="email" 
						placeholder="you@email.com" 
						value={email} 
						onChange={(e) => setEmail(e.target.value)} 
						required 
					/>
				</div>
				<button type="submit" className="auth-primary" disabled={loading}>
					{loading ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPassword;
