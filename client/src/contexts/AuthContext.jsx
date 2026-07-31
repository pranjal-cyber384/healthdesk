/**
 * Auth Context
 * 
 * Provides authentication state and actions to the entire application.
 * Uses React Context API with useReducer for predictable state management.
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

// Initial state
const initialState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: true,
  error: null
};

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER'
};

// Reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    case AUTH_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    case AUTH_ACTIONS.UPDATE_USER:
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
}

// Create context
const AuthContext = createContext(null);

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * Verify current session on mount
   */
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        return;
      }

      try {
        const { data } = await authAPI.getMe();
        dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: data.data });
        localStorage.setItem('user', JSON.stringify(data.data));
      } catch (error) {
        // Token invalid, clear auth
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    };

    verifyAuth();
  }, []);

  /**
   * Login action
   */
  const login = useCallback(async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      const { data } = await authAPI.login({ email, password });
      
      const { user, accessToken, refreshToken } = data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: user });
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
      return { success: false, message };
    }
  }, []);

  /**
   * Register action
   */
  const register = useCallback(async (formData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      const { data } = await authAPI.register(formData);
      
      const { user, accessToken, refreshToken } = data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: user });
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
      return { success: false, message };
    }
  }, []);

  /**
   * Google login action
   */
  const googleLogin = useCallback(async (token) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      const { data } = await authAPI.googleAuth(token);
      
      const { user, accessToken, refreshToken } = data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: user });
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.message || 'Google login failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
      return { success: false, message };
    }
  }, []);

  /**
   * Logout action
   */
  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // Ignore logout API errors
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  }, []);

  /**
   * Update user in state
   */
  const updateUser = useCallback((userData) => {
    const updatedUser = { ...state.user, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: userData });
  }, [state.user]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  const value = {
    ...state,
    login,
    register,
    googleLogin,
    logout,
    updateUser,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
