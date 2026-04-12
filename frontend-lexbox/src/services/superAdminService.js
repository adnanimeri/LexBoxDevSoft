import apiClient from './apiService';

export const superAdminService = {
  // Dashboard
  getDashboard: () => apiClient.get('/super/dashboard').then(r => r.data),

  // Org requests
  getOrgRequests: (status = 'pending') => apiClient.get('/super/org-requests', { params: { status, limit: 50 } }).then(r => r.data),
  approveRequest:  (id, body)          => apiClient.post(`/super/org-requests/${id}/approve`, body).then(r => r.data),
  rejectRequest:   (id, notes)         => apiClient.post(`/super/org-requests/${id}/reject`, { review_notes: notes }).then(r => r.data),

  // Organizations
  getOrganizations: (params) => apiClient.get('/super/organizations', { params }).then(r => r.data),
  updateOrgStatus:  (id, status)       => apiClient.patch(`/super/organizations/${id}/status`, { status }).then(r => r.data),
  updateOrgSub:     (id, body)         => apiClient.patch(`/super/organizations/${id}/subscription`, body).then(r => r.data),
  markInvoiced:     (id)               => apiClient.patch(`/super/organizations/${id}/mark-invoiced`).then(r => r.data),

  // Plans
  getPlans:   ()         => apiClient.get('/super/plans').then(r => r.data),
  createPlan: (body)     => apiClient.post('/super/plans', body).then(r => r.data),
  updatePlan: (id, body) => apiClient.patch(`/super/plans/${id}`, body).then(r => r.data),

  // Platform settings
  getSettings:    ()     => apiClient.get('/super/settings').then(r => r.data),
  saveSettings:   (body) => apiClient.put('/super/settings', body).then(r => r.data),
  testEmail:      (to)   => apiClient.post('/super/settings/test-email', { to }).then(r => r.data),

  // Activate a suspended/past_due org (after upgrade request confirmed)
  activateOrg: (id, planId) => apiClient.patch(`/super/organizations/${id}/subscription`, {
    subscription_status: 'active',
    plan_id: planId
  }).then(r => r.data),

  // Subscription invoices (platform billing → orgs)
  getSubscriptionInvoices: (params) => apiClient.get('/super/subscription-invoices', { params }).then(r => r.data),
  createSubscriptionInvoice: (body)  => apiClient.post('/super/subscription-invoices', body).then(r => r.data),
  sendSubscriptionInvoice:   (id)    => apiClient.post(`/super/subscription-invoices/${id}/send`).then(r => r.data),
  markSubscriptionInvoicePaid: (id, body) => apiClient.patch(`/super/subscription-invoices/${id}/mark-paid`, body).then(r => r.data),
  downloadSubscriptionInvoicePdf: async (id, invoiceNumber) => {
    const response = await apiClient.get(`/super/subscription-invoices/${id}/pdf`, { responseType: 'blob' });
    const url  = window.URL.createObjectURL(response.data);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `Invoice-${invoiceNumber}.pdf`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
  deleteSubscriptionInvoice: (id) => apiClient.delete(`/super/subscription-invoices/${id}`).then(r => r.data),
};
