import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing session
    const storedUser = localStorage.getItem('user');
    const storedTenant = localStorage.getItem('tenant');
    const token = localStorage.getItem('token');

    if (storedUser && storedTenant && token) {
      try {
        setUser(JSON.parse(storedUser));
        setTenant(JSON.parse(storedTenant));
      } catch (e) {
        console.error('Failed to parse stored auth data');
        apiLogout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await apiLogin(email, password);
    setUser(data.user);
    setTenant(data.tenant);
    return data;
  };

  const register = async (tenantName, email, password, firstName, lastName) => {
    const data = await apiRegister(tenantName, email, password, firstName, lastName);
    setUser(data.user);
    setTenant(data.tenant);
    return data;
  };

  const logout = () => {
    apiLogout();
    setUser(null);
    setTenant(null);
  };

  const value = {
    user,
    tenant,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  if (loading) {
    return <div className="auth-layout"><div className="glass-panel" style={{padding: '2rem'}}>Loading...</div></div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
