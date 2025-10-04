import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

/*
  Usage: <ProtectedRoute roles={["admin"]} element={<AdminDashboard />} />
  - roles prop optional; if omitted only authentication is required.
*/

const ProtectedRoute = ({ roles, element }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) return <div style={{ padding: '2rem' }}>Checking access...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && roles.length > 0 && !roles.includes(role)) {
    return <Navigate to="/login" replace state={{ denied: true }} />; // or show a dedicated AccessDenied component
  }
  return element;
};

export default ProtectedRoute;
