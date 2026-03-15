
// src/services/settingsService.js
import apiClient from './apiService';

export const settingsService = {
  // Get all settings
  getAll: async () => {
    const response = await apiClient.get('/settings');
    return response.data;
  },

  // Get settings by category
  getByCategory: async (category) => {
    const response = await apiClient.get(`/settings/${category}`);
    return response.data;
  },

  // Update settings
  update: async (settings) => {
    const response = await apiClient.put('/settings', settings);
    return response.data;
  },

  // Test email configuration
  testEmail: async (email) => {
    const response = await apiClient.post('/settings/test-email', { email });
    return response.data;
  },

  // Get billing defaults
  getBillingDefaults: async () => {
    const response = await apiClient.get('/settings/defaults/billing');
    return response.data;
  }
};
