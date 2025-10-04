import React from 'react';
import { useAuth } from '../components/AuthContext.jsx';

const AdminDashboard = () => {
  const { role, logout } = useAuth();
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Welcome, Admin Dashboard</h1>
      <p>Your role: {role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
export default AdminDashboard;
