// src/context/AuthContext.js - MOCK VERSION FOR TESTING

/**
 Admin Account:

Email: admin@lexbox.com
Password: anything (any password works)
Access: Full admin access to all features

Lawyer Account:

Email: lawyer@lexbox.com
Password: anything
Access: Client management, timeline, documents, billing

Secretary Account:

Email: secretary@lexbox.com
Password: anything
Access: Limited - can view clients and documents, no billing
*/

// src/context/AuthContext.js - REAL VERSION
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { ...state, loading: false, user: action.payload, isAuthenticated: true };
    case 'LOGIN_FAILURE':
      return { ...state, loading: false, error: action.payload, isAuthenticated: false };
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false, loading: false };
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: true, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true, // Start with loading true
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing authentication on app load
  useEffect(() => {
    const initAuth = () => {
      const token = localStorage.getItem('lexbox_token');
      const storedUser = localStorage.getItem('lexbox_user');
      
      if (token && storedUser) {
        try {
          const user = JSON.parse(storedUser);
          dispatch({ type: 'SET_USER', payload: user });
        } catch (error) {
          localStorage.removeItem('lexbox_token');
          localStorage.removeItem('lexbox_user');
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    
    initAuth();
  }, []);

  /**
   * Real Login function - calls backend API
   */
  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });
      
      const { user, token } = response.data.data;
      
      // Store in localStorage
      localStorage.setItem('lexbox_token', token);
      localStorage.setItem('lexbox_user', JSON.stringify(user));
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      return { user, token };
      
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      throw new Error(message);
    }
  };

  /**
   * Logout function
   */
  const logout = () => {
    localStorage.removeItem('lexbox_token');
    localStorage.removeItem('lexbox_user');
    dispatch({ type: 'LOGOUT' });
  };

  /**
   * Check if user has required permission
   */
  const hasPermission = (permission) => {
    if (!state.user) return false;
    
    // Admin has all permissions
    if (state.user.role === 'admin') return true;
    
    // Check specific permission
    return state.user.permissions?.includes(permission);
  };

  const value = {
    ...state,
    login,
    logout,
    hasPermission,
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

export default AuthContext;