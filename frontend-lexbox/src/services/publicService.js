// ===================================================================
// PUBLIC SERVICE — no auth token required
// Used by the law firm registration page
// ===================================================================

import apiClient from './apiService';

export const publicService = {
  /**
   * Fetch all active subscription plans for display on the registration page
   */
  getPlans: async () => {
    const response = await apiClient.get('/public/plans');
    return response.data;
  },

  /**
   * Submit a law firm registration request
   */
  submitOrgRequest: async (formData) => {
    const response = await apiClient.post('/public/org-request', formData);
    return response.data;
  }
};
