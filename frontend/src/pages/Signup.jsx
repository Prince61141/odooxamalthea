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
    setLoading(true);
    setMessage('');
    try {
      const payload = { name: form.name, email: form.email, password: form.password, country: form.country };
      const res = await axios.post(`${API_BASE}/api/auth/signup`, payload);
      setMessage(res.data.message || 'Signup successful!');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Signup failed');
    }
    setLoading(false);
  };

  return (
    <AuthLayout
      heading="Sign Up"
      subheading="Secure Your Communications with Easymail"
      sideContent={<HeroPanel />}
      altLink={<div>Already member? <Link to="/login">Sign in</Link></div>}
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label>Name</label>
          <input name="name" placeholder="Company Name" value={form.name} onChange={handleChange} required />
        </div>
        <div className="auth-field">
          <label>Email</label>
          <input name="email" type="email" placeholder="company@email.com" value={form.email} onChange={handleChange} required />
        </div>
        <div className="auth-field">
          <label>Password</label>
          <input name="password" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={handleChange} required />
          <span className="toggle-pass" onClick={() => setShowPass(s => !s)}>{showPass ? 'Hide' : 'Show'}</span>
        </div>
        <ul className="password-rules">
          <PasswordRule ok={rules.length}>Least 8 characters</PasswordRule>
          <PasswordRule ok={rules.numberOrSymbol}>Least one number (0-9) or a symbol</PasswordRule>
            <PasswordRule ok={rules.lowerUpper}>Lowercase (a-z) and uppercase (A-Z).</PasswordRule>
        </ul>
        <div className="auth-field">
          <label>Re-Type Password</label>
          <input name="confirm" type={showPass ? 'text' : 'password'} placeholder="Repeat password" value={form.confirm} onChange={handleChange} required />
        </div>
        <div className="auth-field">
          <label>Country</label>
          <select name="country" value={form.country} onChange={handleChange} required>
            <option value="">Select Country</option>
            {countries.map((c, i) => (
              <option key={i} value={c.name.common}>{c.name.common}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="auth-primary" disabled={loading || !allRulesOk || !passwordsMatch}>
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
        {message && <div className={`auth-message ${/successful/i.test(message) ? 'auth-success' : ''}`}>{message}</div>}
      </form>
    </AuthLayout>
  );
};

export default Signup;
