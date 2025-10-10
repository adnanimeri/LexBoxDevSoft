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
   * Update client with dossier number
   */
  assignDossierNumber: async (clientId, dossierNumber) => {
    const response = await apiClient.patch(`/clients/${clientId}/dossier`, {
      dossier_number: dossierNumber
    });
    return response.data;
  },

  /**
   * Search clients by various criteria
   */
  searchClients: async (searchTerm) => {
    const response = await apiClient.get('/clients/search', {
      params: { q: searchTerm }
    });
    return response.data;
  },

  /**
   * Archive/deactivate client
   */
  archiveClient: async (clientId) => {
    const response = await apiClient.patch(`/clients/${clientId}/archive`);
    return response.data;
  },
};