// src/services/billingService.js
import apiClient from './apiService';

export const billingService = {
  // Get all invoices for a dossier
  getInvoices: async (dossierId, filters = {}) => {
    const response = await apiClient.get(`/dossiers/${dossierId}/invoices`, { params: filters });
    return response.data;
  },

  // Get single invoice
  getInvoice: async (invoiceId) => {
    const response = await apiClient.get(`/invoices/${invoiceId}`);
    return response.data;
  },

  // Get unbilled items for a dossier
  getUnbilledItems: async (dossierId) => {
    const response = await apiClient.get(`/dossiers/${dossierId}/unbilled`);
    return response.data;
  },

  // Get billing summary for a dossier
  getBillingSummary: async (dossierId) => {
    const response = await apiClient.get(`/dossiers/${dossierId}/billing-summary`);
    return response.data;
  },

  // Create invoice
  createInvoice: async (dossierId, invoiceData) => {
    const response = await apiClient.post(`/dossiers/${dossierId}/invoices`, invoiceData);
    return response.data;
  },

  // Update invoice
  updateInvoice: async (invoiceId, invoiceData) => {
    const response = await apiClient.put(`/invoices/${invoiceId}`, invoiceData);
    return response.data;
  },

  // Send invoice (mark as sent)
  sendInvoice: async (invoiceId) => {
    const response = await apiClient.post(`/invoices/${invoiceId}/send`);
    return response.data;
  },

  // Cancel invoice
  cancelInvoice: async (invoiceId) => {
    const response = await apiClient.post(`/invoices/${invoiceId}/cancel`);
    return response.data;
  },

  // Record payment
  recordPayment: async (invoiceId, paymentData) => {
    const response = await apiClient.post(`/invoices/${invoiceId}/payments`, paymentData);
    return response.data;
  },

  // Delete payment
  deletePayment: async (paymentId) => {
    const response = await apiClient.delete(`/payments/${paymentId}`);
    return response.data;
  },

  // Download invoice as PDF
  downloadPDF: async (invoiceId) => {
    const response = await apiClient.get(`/invoices/${invoiceId}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Send invoice via email
  emailInvoice: async (invoiceId) => {
    const response = await apiClient.post(`/invoices/${invoiceId}/email`);
    return response.data;
  },

  // Global billing — all invoices across all clients
  getGlobalInvoices: async (params = {}) => {
    const response = await apiClient.get('/billing/invoices', { params });
    return response.data;
  },

  getGlobalSummary: async () => {
    const response = await apiClient.get('/billing/summary');
    return response.data;
  },

  // CSV export — client-side generation
  exportCSV: (invoices) => {
    const headers = [
      'Invoice #', 'Client', 'Email', 'Dossier', 'Issue Date',
      'Due Date', 'Subtotal', 'Tax', 'Total', 'Paid', 'Balance', 'Status'
    ];
    const rows = invoices.map(inv => {
      const client = inv.dossier?.client;
      const balance = Math.max(0, parseFloat(inv.total_amount) - parseFloat(inv.amount_paid));
      return [
        inv.invoice_number,
        client ? `${client.first_name} ${client.last_name}` : '',
        client?.email || '',
        inv.dossier?.dossier_number || '',
        inv.issue_date,
        inv.due_date,
        parseFloat(inv.subtotal).toFixed(2),
        parseFloat(inv.tax_amount).toFixed(2),
        parseFloat(inv.total_amount).toFixed(2),
        parseFloat(inv.amount_paid).toFixed(2),
        balance.toFixed(2),
        inv.status
      ];
    });
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};



/*

// src/services/billingService.js
import apiClient from './apiService';

export const billingService = {
  // Get all invoices for a dossier
  getInvoices: async (dossierId, filters = {}) => {
    const response = await apiClient.get(`/dossiers/${dossierId}/invoices`, { params: filters });
    return response.data;
  },

  // Get single invoice
  getInvoice: async (invoiceId) => {
    const response = await apiClient.get(`/invoices/${invoiceId}`);
    return response.data;
  },

  // Get unbilled items for a dossier
  getUnbilledItems: async (dossierId) => {
    const response = await apiClient.get(`/dossiers/${dossierId}/unbilled`);
    return response.data;
  },

  // Get billing summary for a dossier
  getBillingSummary: async (dossierId) => {
    const response = await apiClient.get(`/dossiers/${dossierId}/billing-summary`);
    return response.data;
  },

  // Create invoice
  createInvoice: async (dossierId, invoiceData) => {
    const response = await apiClient.post(`/dossiers/${dossierId}/invoices`, invoiceData);
    return response.data;
  },

  // Update invoice
  updateInvoice: async (invoiceId, invoiceData) => {
    const response = await apiClient.put(`/invoices/${invoiceId}`, invoiceData);
    return response.data;
  },

  // Send invoice
  sendInvoice: async (invoiceId) => {
    const response = await apiClient.post(`/invoices/${invoiceId}/send`);
    return response.data;
  },

  // Cancel invoice
  cancelInvoice: async (invoiceId) => {
    const response = await apiClient.post(`/invoices/${invoiceId}/cancel`);
    return response.data;
  },

  // Record payment
  recordPayment: async (invoiceId, paymentData) => {
    const response = await apiClient.post(`/invoices/${invoiceId}/payments`, paymentData);
    return response.data;
  },

  // Delete payment
  deletePayment: async (paymentId) => {
    const response = await apiClient.delete(`/payments/${paymentId}`);
    return response.data;
  }
};

*/