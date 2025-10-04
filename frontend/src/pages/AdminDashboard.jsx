import React from 'react';
import { useAuth } from '../components/AuthContext.jsx';

const AdminDashboard = () => {
  const { token, logout } = useAuth();
  const [form, setForm] = React.useState({ name: '', email: '', role: 'manager', managerId: '' });
  const [managers, setManagers] = React.useState([]);
  const [status, setStatus] = React.useState('');

  React.useEffect(() => {
    if (!token) return;
    fetch('http://localhost:5000/api/users/managers', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => Array.isArray(data) ? setManagers(data) : setManagers([]))
      .catch(() => setManagers([]));
  }, [token]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    try {
      const res = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setStatus('User created');
      setForm({ name: '', email: '', role: 'manager', managerId: '' });
    } catch (e) {
      setStatus(e.message);
    }
  };

  const sendInvite = async () => {
    setStatus('');
    try {
      const res = await fetch('http://localhost:5000/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setStatus(data.message || 'Invite sent');
    } catch (e) {
      setStatus(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-600 text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-semibold">Admin Dashboard</h1>
          <button onClick={logout} className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">Logout</button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
        <section className="bg-white rounded-2xl shadow p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900">Add Manager / Employee</h2>
          <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input value={form.name} onChange={e=>setForm(v=>({...v,name:e.target.value}))} className="w-full rounded-lg border border-gray-300 px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e=>setForm(v=>({...v,email:e.target.value}))} className="w-full rounded-lg border border-gray-300 px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select value={form.role} onChange={e=>setForm(v=>({...v,role:e.target.value}))} className="w-full rounded-lg border border-gray-300 px-3 py-2">
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manager (for Employee)</label>
              <select disabled={form.role!=='employee'} value={form.managerId} onChange={e=>setForm(v=>({...v,managerId:e.target.value}))} className="w-full rounded-lg border border-gray-300 px-3 py-2">
                <option value="">None</option>
                {managers.map(m=> <option key={m._id} value={m._id}>{m.name} ({m.email})</option>)}
              </select>
            </div>

            <div className="sm:col-span-2 flex flex-col sm:flex-row gap-2">
              <button type="submit" className="inline-flex justify-center items-center rounded-lg bg-indigo-600 text-white font-medium px-4 py-2 hover:bg-indigo-700">Add User</button>
              <button type="button" onClick={sendInvite} className="inline-flex justify-center items-center rounded-lg bg-white border border-gray-300 text-gray-900 font-medium px-4 py-2 hover:bg-gray-50">Send Mail Invite</button>
            </div>

            {status && <div className="sm:col-span-2 text-sm text-indigo-700">{status}</div>}
          </form>
        </section>
      </main>
    </div>
  );
};
export default AdminDashboard;