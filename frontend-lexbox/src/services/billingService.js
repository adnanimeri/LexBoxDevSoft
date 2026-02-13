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