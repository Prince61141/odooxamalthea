import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Signup = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    country: '',
  });
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/api/countries')
      .then(res => setCountries(res.data))
      .catch(() => setCountries([]));
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/signup', form);
      setMessage(res.data.message || 'Signup successful!');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Signup failed');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Sign Up</h2>
      <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
      <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
      <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
      <select name="country" value={form.country} onChange={handleChange} required>
        <option value="">Select Country</option>
        {countries.map((c, i) => (
          <option key={i} value={c.name.common}>{c.name.common}</option>
        ))}
      </select>
      <button type="submit" disabled={loading}>{loading ? 'Signing up...' : 'Sign Up'}</button>
      {message && <div>{message}</div>}
    </form>
  );
};

export default Signup;
