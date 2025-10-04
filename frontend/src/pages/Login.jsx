import React, { useState } from 'react';
import axios from 'axios';

const Login = () => {
	const [form, setForm] = useState({ email: '', password: '' });
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState('');

	const handleChange = e => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const handleSubmit = async e => {
		e.preventDefault();
		setLoading(true);
		setMessage('');
		try {
			const res = await axios.post('http://localhost:5000/api/auth/login', form);
			setMessage(res.data.message || 'Login successful!');
		} catch (err) {
			setMessage(err.response?.data?.error || 'Login failed');
		}
		setLoading(false);
	};

	return (
		<form onSubmit={handleSubmit}>
			<h2>Login</h2>
			<input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
			<input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
			<button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
			{message && <div>{message}</div>}
		</form>
	);
};

export default Login;
