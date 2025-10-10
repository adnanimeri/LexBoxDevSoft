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



import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext();

/**
 * Authentication state management using useReducer
 * MOCK VERSION - bypasses real API calls for testing
 */
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
      return { ...state, user: action.payload, isAuthenticated: true };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing authentication on app load
  useEffect(() => {
    const mockUser = localStorage.getItem('lexbox_mock_user');
    if (mockUser) {
      try {
        const user = JSON.parse(mockUser);
        dispatch({ type: 'SET_USER', payload: user });
      } catch (error) {
        localStorage.removeItem('lexbox_mock_user');
      }
    }
  }, []);

  /**
   * MOCK Login function - no real API calls
   * Creates different user types based on email
   */
  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Create mock user based on email
      let mockUser;
      
      if (email.toLowerCase().includes('admin')) {
        mockUser = {
          id: 1,
          first_name: 'Admin',
          last_name: 'User',
          email: email,
          role: 'admin',
          permissions: ['all'] // Admin has all permissions
        };
      } else if (email.toLowerCase().includes('secretary')) {
        mockUser = {
          id: 3,
          first_name: 'Secretary',
          last_name: 'User',
          email: email,
          role: 'secretary',
          permissions: ['clients:read', 'documents:read', 'documents:create']
        };
      } else {
        // Default to lawyer
        mockUser = {
          id: 2,
          first_name: 'Lawyer',
          last_name: 'User',
          email: email,
          role: 'lawyer',
          permissions: [
            'clients:read', 'clients:create', 'clients:update',
            'timeline:read', 'timeline:create', 'timeline:update',
            'documents:read', 'documents:create', 'documents:update',
            'billing:read', 'billing:create'
          ]
        };
      }
      
      // Store mock user
      localStorage.setItem('lexbox_mock_user', JSON.stringify(mockUser));
      localStorage.setItem('lexbox_token', 'mock-jwt-token');
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: mockUser });
      return { user: mockUser, token: 'mock-jwt-token' };
      
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Login failed' });
      throw error;
    }
  };

  /**
   * Logout function that clears mock authentication
   */
  const logout = () => {
    localStorage.removeItem('lexbox_mock_user');
    localStorage.removeItem('lexbox_token');
    dispatch({ type: 'LOGOUT' });
  };

  /**
   * Check if user has required permission/role
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