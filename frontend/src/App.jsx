import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import ManagerDashboard from './pages/ManagerDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { AuthProvider, useAuth } from './components/AuthContext.jsx';
import LandingPage from './pages/LandingPage.jsx';

// const HomeRedirect = () => {
//   const { isAuthenticated, role } = useAuth();
//   if (!isAuthenticated) return <Navigate to="/login" replace />;
//   switch (role) {
//     case 'admin': return <Navigate to="/admin-dashboard" replace />;
//     case 'manager': return <Navigate to="/manager-dashboard" replace />;
//     case 'employee': return <Navigate to="/user-dashboard" replace />;
//     default: return <Navigate to="/login" replace />;
//   }
// };

const App = () => (
  <AuthProvider>
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/user-dashboard" element={<ProtectedRoute roles={["employee"]} element={<UserDashboard />} />} />
        <Route path="/manager-dashboard" element={<ProtectedRoute roles={["manager"]} element={<ManagerDashboard />} />} />
        <Route path="/admin-dashboard" element={<ProtectedRoute roles={["admin"]} element={<AdminDashboard />} />} />
        <Route path="/" element={<LandingPage/>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;