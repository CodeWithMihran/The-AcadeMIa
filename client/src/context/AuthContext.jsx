import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const requestSequence = useRef(0);

  const fetchCurrentUser = useCallback(async () => {
    const requestId = ++requestSequence.current;
    setLoading(true);
    try {
      const res = await authService.getMe();
      if (requestId !== requestSequence.current) return null;
      setAuthError("");
      if (res.data.success && res.data.user) {
        setUser(res.data.user);
        return res.data.user;
      } else {
        setUser(null);
        return null;
      }
    } catch (err) {
      if (requestId !== requestSequence.current) return null;
      if (err.response?.status === 401) {
        setUser(null);
        setAuthError("");
        try { localStorage.removeItem('academia_token'); } catch { /* Cookie authentication remains available if storage is blocked. */ }
      } else {
        setAuthError(err.response?.data?.message || "Could not verify your session. Check your connection and retry.");
      }
      return null;
    } finally {
      if (requestId === requestSequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    if (res.data.success) {
      requestSequence.current += 1;
      setAuthError("");
      setLoading(false);
      if (res.data.token) {
        try { localStorage.setItem('academia_token', res.data.token); } catch { /* Server also sets an HttpOnly authentication cookie. */ }
      }
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const register = async (formData) => {
    const res = await authService.register(formData);
    if (res.data.success) {
      requestSequence.current += 1;
      setAuthError("");
      setLoading(false);
      if (res.data.token) {
        try { localStorage.setItem('academia_token', res.data.token); } catch { /* Server also sets an HttpOnly authentication cookie. */ }
      }
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  const logout = async () => {
    requestSequence.current += 1;
    try {
      await authService.logout();
    } catch (e) {
      console.warn("Logout error:", e);
    } finally {
      try { localStorage.removeItem('academia_token'); } catch { /* Server cookie is cleared by the logout endpoint. */ }
      setAuthError("");
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
      authError,
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
