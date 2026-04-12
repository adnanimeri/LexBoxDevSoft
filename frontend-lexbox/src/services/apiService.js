import axios from 'axios';

/**
 * Base API service configuration with interceptors
 * Handles authentication tokens and global error handling
 */
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('lexbox_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect to login if we actually had a token (session expired)
      // Don't redirect for public routes that return 401 when no token is present
      const hadToken = !!localStorage.getItem('lexbox_token');
      localStorage.removeItem('lexbox_token');
      localStorage.removeItem('lexbox_user');
      if (hadToken) {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;