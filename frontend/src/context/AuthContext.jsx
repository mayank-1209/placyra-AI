import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('placyra_token'));
  const [loading, setLoading] = useState(true);

  // Initialize auth state from local storage and verify with backend
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('placyra_token');
      const storedUser = localStorage.getItem('placyra_user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          // Verify with backend
          const response = await authApi.getMe();
          setUser(response.data);
          localStorage.setItem('placyra_user', JSON.stringify(response.data));
        } catch (error) {
          console.warn('Stored token is invalid or expired:', error);
          localStorage.removeItem('placyra_token');
          localStorage.removeItem('placyra_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const response = await authApi.login({ email, password });
    const { access_token, user: loggedUser } = response.data;

    localStorage.setItem('placyra_token', access_token);
    localStorage.setItem('placyra_user', JSON.stringify(loggedUser));
    setToken(access_token);
    setUser(loggedUser);
    return loggedUser;
  };

  const register = async (userData) => {
    const response = await authApi.register(userData);
    const { access_token, user: registeredUser } = response.data;

    localStorage.setItem('placyra_token', access_token);
    localStorage.setItem('placyra_user', JSON.stringify(registeredUser));
    setToken(access_token);
    setUser(registeredUser);
    return registeredUser;
  };

  const logout = () => {
    localStorage.removeItem('placyra_token');
    localStorage.removeItem('placyra_user');
    setToken(null);
    setUser(null);
    window.location.href = '/auth';
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
