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
    case 'SET_ORG_PERMISSIONS':
      return { ...state, orgPermissions: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  orgPermissions: {},
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing authentication on app load
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('lexbox_token');
      const storedUser = localStorage.getItem('lexbox_user');

      if (token && storedUser) {
        try {
          const user = JSON.parse(storedUser);

          // For non-super-admin users, validate the token against the backend
          // before treating them as authenticated. A 401/403 means the org
          // was deleted/suspended — clear the stale session immediately.
          if (user?.role !== 'super_admin') {
            try {
              const res = await axios.get(`${API_BASE_URL}/org/permissions`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              dispatch({ type: 'SET_USER', payload: user });
              dispatch({ type: 'SET_ORG_PERMISSIONS', payload: res.data.data || {} });
            } catch (permErr) {
              const status = permErr.response?.status;
              if (status === 401 || status === 403) {
                // Stale or invalid session — force logout
                localStorage.removeItem('lexbox_token');
                localStorage.removeItem('lexbox_user');
                dispatch({ type: 'SET_LOADING', payload: false });
                return;
              }
              // Network error or other non-auth failure — still log in, skip permissions
              dispatch({ type: 'SET_USER', payload: user });
            }
          } else {
            // super_admin — just restore from storage, no org check needed
            dispatch({ type: 'SET_USER', payload: user });
          }
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

      // Load org-level permissions
      try {
        const permRes = await axios.get(`${API_BASE_URL}/org/permissions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        dispatch({ type: 'SET_ORG_PERMISSIONS', payload: permRes.data.data || {} });
      } catch {
        // non-fatal
      }

      return { user, token };
      
    } catch (error) {
      const message = error.response?.data?.error?.message || error.response?.data?.message || 'Login failed';
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
    const role = state.user.role;

    // Admin has all permissions
    if (role === 'admin') return true;

    // Base role permissions
    const ROLE_PERMISSIONS = {
      lawyer: [
        'clients:read', 'clients:write', 'clients:create', 'clients:update', 'clients:delete',
        'dossiers:read', 'dossiers:write', 'dossiers:create', 'dossiers:update',
        'documents:read', 'documents:write', 'documents:upload', 'documents:create', 'documents:update', 'documents:delete',
        'timeline:read', 'timeline:write', 'timeline:create', 'timeline:update',
        'billing:read', 'billing:write',
        'calendar:read', 'calendar:write',
      ],
      secretary: [
        'clients:read',
        'dossiers:read',
        'documents:read', 'documents:upload',
        'timeline:read', 'timeline:write',
        'calendar:read', 'calendar:write',
      ],
    };

    const basePerms = ROLE_PERMISSIONS[role] || [];

    // Extend secretary permissions based on org settings
    if (role === 'secretary') {
      const extra = [];
      if (state.orgPermissions?.secretary_can_create_clients) {
        extra.push(
          'clients:create', 'clients:update', 'clients:write',
          'dossiers:create', 'dossiers:update', 'dossiers:write',
          'documents:create', 'documents:update', 'documents:delete', 'documents:write',
          'timeline:create', 'timeline:update',
        );
      }
      if (state.orgPermissions?.secretary_can_access_billing) {
        extra.push('billing:read', 'billing:write');
      }
      return [...basePerms, ...extra].includes(permission);
    }

    return basePerms.includes(permission);
  };

  const refreshOrgPermissions = async () => {
    const token = localStorage.getItem('lexbox_token');
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/org/permissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      dispatch({ type: 'SET_ORG_PERMISSIONS', payload: res.data.data || {} });
    } catch {
      // non-fatal
    }
  };

  const value = {
    ...state,
    login,
    logout,
    hasPermission,
    refreshOrgPermissions,
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