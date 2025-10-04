import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const decodeBase64Url = (str) => {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '==='.slice((base64.length + 3) % 4);
    return atob(padded);
  } catch {
    return '{}';
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const parseToken = useCallback((jwt) => {
    try {
      const parts = jwt.split('.');
      if (parts.length < 2) return {};
      const json = JSON.parse(decodeBase64Url(parts[1]));
      return json;
    } catch (e) {
      return {};
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (stored) {
      setToken(stored);
      const parsed = parseToken(stored);
      if (parsed?.role) setRole(parsed.role);
    }
    setLoading(false);
  }, [parseToken]);

  const login = (jwt) => {
    localStorage.setItem('token', jwt);
    setToken(jwt);
    const parsed = parseToken(jwt);
    setRole(parsed?.role || null);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setRole(null);
  };

  const getDashboardPath = () => {
    switch (role) {
      case 'admin': return '/admin-dashboard';
      case 'manager': return '/manager-dashboard';
      case 'employee': return '/user-dashboard';
      default: return '/login';
    }
  };

  const value = {
    isAuthenticated: !!token,
    token,
    role,
    login,
    logout,
    loading,
    getDashboardPath,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
