import React, { createContext, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  loginUser,
  registerUser,
  fetchCurrentUser,
  logout as logoutAction,
} from '../store/slices/authSlice';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { user, token, loading, isAuthenticated, error } = useSelector((state) => state.auth);

  useEffect(() => {
    const storedToken = localStorage.getItem('placyra_token');
    if (storedToken) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch]);

  const login = async (email, password) => {
    const resultAction = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(resultAction)) {
      return resultAction.payload.user;
    } else {
      throw new Error(resultAction.payload || 'Login failed');
    }
  };

  const register = async (userData) => {
    const resultAction = await dispatch(registerUser(userData));
    if (registerUser.fulfilled.match(resultAction)) {
      return resultAction.payload.user;
    } else {
      throw new Error(resultAction.payload || 'Registration failed');
    }
  };

  const logout = () => {
    dispatch(logoutAction());
    window.location.href = '/auth';
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    error,
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
