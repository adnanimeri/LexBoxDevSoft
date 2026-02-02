//src/services/clientService.js
import apiClient from './apiService';

/**
 * Client management API service
 * Handles all client-related API operations
 */
export const clientService = {
  /**
   * Fetch all clients with optional search and pagination
   */
  getClients: async (params = {}) => {
    const response = await apiClient.get('/clients', { params });
    return response.data;
  },

  /**
   * Get specific client by ID with full details
   */
  getClient: async (clientId) => {
    const response = await apiClient.get(`/clients/${clientId}`);
    return response.data;
  },

  /**
   * Create new client with initial registration
   */
  createClient: async (clientData) => {
    const response = await apiClient.post('/clients', clientData);
    return response.data;
  },

  /**
   * Update existing client information
   */
  updateClient: async (clientId, clientData) => {
    const response = await apiClient.put(`/clients/${clientId}`, clientData);
    return response.data;
  },

  /**
   * Update client with dossier number and case details
   */
  assignDossierNumber: async (clientId, dossierData) => {
    const response = await apiClient.patch(`/clients/${clientId}/dossier`, dossierData);
    return response.data;
  },

  /**
   * Search clients by name, email, or personal number
   */
  searchClients: async (searchTerm, limit = 10) => {
    const response = await apiClient.get('/clients/search', {
      params: { q: searchTerm, limit }
    });
    return response.data;
  },

  /**
   * Get client statistics for dashboard
   */
  getStats: async () => {
    const response = await apiClient.get('/clients/stats');
    return response.data;
  },

  /**
   * Get recent clients for dashboard
   */
  getRecentClients: async (limit = 5) => {
    const response = await apiClient.get('/clients/recent', {
      params: { limit }
    });
    return response.data;
  },

  /**
   * Archive/deactivate client (soft delete)
   */
  archiveClient: async (clientId) => {
    const response = await apiClient.delete(`/clients/${clientId}/archive`);
    return response.data;
  },

  /**
   * Delete client permanently (admin only)
   */
  deleteClient: async (clientId) => {
    const response = await apiClient.delete(`/clients/${clientId}`);
    return response.data;
  },

  /**
   * Get dashboard statistics (alias for getStats)
   */
  getDashboardStats: async () => {
    const response = await apiClient.get('/clients/stats');
    return response.data.data;
  },

  /**
   * Get recent activity (recent clients for now)
   */
  getRecentActivity: async (params = {}) => {
    const response = await apiClient.get('/clients/recent', { params });
    return response.data.data;
  },
};