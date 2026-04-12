import apiClient from './apiService';

export const orgService = {
  getTrialStatus:   ()      => apiClient.get('/org/trial-status').then(r => r.data),
  requestUpgrade:   (planId, msg) => apiClient.post('/org/upgrade-request', { plan_id: planId, message: msg }).then(r => r.data),
};
