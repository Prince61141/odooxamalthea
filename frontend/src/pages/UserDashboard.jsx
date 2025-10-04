import React, { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthContext.jsx';
import api from '../api';

const categories = ['Travel', 'Meals', 'Supplies', 'Software', 'Other'];

const UserDashboard = () => {
  const { role, logout } = useAuth();
  const [form, setForm] = useState({ amount: '', currency: 'USD', category: '', description: '', date: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loadingList, setLoadingList] = useState(true);

  const loadExpenses = async () => {
    try {
      setLoadingList(true);
      const res = await api.get('/expenses/mine');
      setExpenses(res.data);
    } catch (e) {
      // silently ignore for now
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { loadExpenses(); }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      const res = await api.post('/expenses', payload);
      setMessage(res.data.message || 'Submitted');
      setForm({ amount: '', currency: form.currency, category: '', description: '', date: '' });
      loadExpenses();
    } catch (e) {
      setMessage(e.response?.data?.error || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const displayed = expenses.filter(exp => filter === 'all' || exp.status === filter);

  return (
    <div style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto', fontFamily: 'Poppins, Inter, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <h1 style={{ margin: 0, fontSize: 34 }}>Employee Expenses</h1>
        <div>
          <span style={{ marginRight: 20, fontWeight: 500 }}>Role: {role}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <section style={{ display: 'grid', gap: '2.2rem', gridTemplateColumns: '1fr 1fr' }}>
        <div style={{ background: '#fff', padding: '1.6rem 1.8rem', borderRadius: 18, boxShadow: '0 8px 30px -12px rgba(0,0,0,0.12)' }}>
          <h2 style={{ marginTop: 0, fontSize: 20 }}>Submit Expense</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <input name="amount" type="number" step="0.01" placeholder="Amount" value={form.amount} onChange={handleChange} required style={fieldStyle} />
              <input name="currency" placeholder="Currency" value={form.currency} onChange={handleChange} required style={{ ...fieldStyle, maxWidth: 120 }} />
            </div>
            <select name="category" value={form.category} onChange={handleChange} required style={fieldStyle}>
              <option value="">Category</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <textarea name="description" placeholder="Description (optional)" value={form.description} onChange={handleChange} rows={3} style={{ ...fieldStyle, resize: 'vertical' }} />
            <input name="date" type="date" value={form.date} onChange={handleChange} required style={fieldStyle} />
            <button disabled={submitting} style={primaryBtn}>{submitting ? 'Submitting...' : 'Submit Expense'}</button>
            {message && <div style={{ fontSize: 13, color: /fail/i.test(message) ? '#b42318' : '#15803d' }}>{message}</div>}
          </form>
        </div>

        <div style={{ background: '#fff', padding: '1.6rem 1.8rem', borderRadius: 18, boxShadow: '0 8px 30px -12px rgba(0,0,0,0.12)', minHeight: 300 }}>
          <h2 style={{ marginTop: 0, fontSize: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            History
            <select value={filter} onChange={e => setFilter(e.target.value)} style={{ ...fieldStyle, maxWidth: 140, margin: 0 }}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </h2>
          {loadingList ? (
            <div style={{ fontSize: 13 }}>Loading...</div>
          ) : displayed.length === 0 ? (
            <div style={{ fontSize: 13 }}>No expenses found.</div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {displayed.map(exp => (
                <li key={exp._id} style={expenseRow(exp.status)}>
                  <div style={{ fontWeight: 600 }}>{exp.category}</div>
                  <div style={{ opacity: .9 }}>{exp.currency} {exp.amount.toFixed(2)}</div>
                  <div style={{ fontSize: 12, opacity: .7 }}>{new Date(exp.date).toLocaleDateString()}</div>
                  <div style={{ marginLeft: 'auto', fontSize: 12, padding: '4px 10px', borderRadius: 20, background: statusColor(exp.status).bg, color: statusColor(exp.status).fg }}>{exp.status}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};

const fieldStyle = {
  padding: '12px 14px',
  borderRadius: 12,
  border: '1.5px solid #d2d9e5',
  outline: 'none',
  fontSize: 14,
  fontFamily: 'inherit',
  background: '#f7f9fc'
};

const primaryBtn = {
  background: 'linear-gradient(90deg,#4c56ff,#3352d6)',
  color: '#fff',
  border: 'none',
  borderRadius: 28,
  padding: '14px 26px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  letterSpacing: '.3px',
  boxShadow: '0 10px 24px -8px rgba(83,103,255,0.55)'
};

const expenseRow = (status) => ({
  display: 'grid',
  gridTemplateColumns: '140px 140px 120px 1fr',
  alignItems: 'center',
  gap: 18,
  background: '#f8faff',
  padding: '12px 16px',
  borderRadius: 16,
  border: '1px solid #e4eaf4'
});

const statusColor = (status) => {
  switch (status) {
    case 'approved': return { bg: '#d1fae5', fg: '#065f46' };
    case 'rejected': return { bg: '#fee2e2', fg: '#991b1b' };
    default: return { bg: '#e0e7ff', fg: '#3730a3' };
  }
};

export default UserDashboard;
