import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await authService.getMe();
      if (res.data.success && res.data.user) {
        setUser(res.data.user);
        return res.data.user;
      } else {
        setUser(null);
        return null;
      }
    } catch (err) {
      setUser(null);
      if (err.response?.status === 401) localStorage.removeItem('academia_token');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    if (res.data.success) {
      if (res.data.token) {
        localStorage.setItem('academia_token', res.data.token);
      }
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const register = async (formData) => {
    const res = await authService.register(formData);
    if (res.data.success) {
      if (res.data.token) {
        localStorage.setItem('academia_token', res.data.token);
      }
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.warn("Logout error:", e);
    } finally {
      localStorage.removeItem('academia_token');
      setUser(null);
      window.location.href = '/';
    }
  };

  const refreshUser = useCallback(() => fetchCurrentUser(), [fetchCurrentUser]);

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      loading,
      login,
      register,
      logout,
      refreshUser,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
