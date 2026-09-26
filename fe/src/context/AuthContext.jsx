import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('taskflow_token') || null);
  const [loading, setLoading] = useState(true);

  // Load user profile on mount if token exists
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
        if (res.data.user.company) {
          setCompany(res.data.user.company);
        }
      } catch (err) {
        console.error('Failed to restore auth state:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: jwtToken, user: userData, company: companyData } = res.data;
    
    localStorage.setItem('taskflow_token', jwtToken);
    localStorage.setItem('taskflow_user', JSON.stringify(userData));
    
    setToken(jwtToken);
    setUser(userData);
    setCompany(companyData);
    return res.data;
  };

  const registerCompany = async (formData) => {
    const res = await api.post('/auth/register', formData);
    const { token: jwtToken, user: userData, company: companyData } = res.data;

    localStorage.setItem('taskflow_token', jwtToken);
    localStorage.setItem('taskflow_user', JSON.stringify(userData));

    setToken(jwtToken);
    setUser(userData);
    setCompany(companyData);
    return res.data;
  };

  const acceptInvitation = async (formData) => {
    const res = await api.post('/auth/accept-invitation', formData);
    const { token: jwtToken, user: userData } = res.data;

    localStorage.setItem('taskflow_token', jwtToken);
    localStorage.setItem('taskflow_user', JSON.stringify(userData));

    setToken(jwtToken);
    setUser(userData);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('taskflow_token');
    localStorage.removeItem('taskflow_user');
    setToken(null);
    setUser(null);
    setCompany(null);
    window.location.href = '/login';
  };

  // Helper check for granular permissions
  const hasPermission = (permissionKey) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions ? user.permissions.includes(permissionKey) : false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        company,
        setCompany,
        token,
        loading,
        login,
        registerCompany,
        acceptInvitation,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
