// ===================================================================
// DOCUMENT SERVICE
// ===================================================================
// src/services/documentService.js
import apiClient from './apiService';

/**
 * Document management API service
 * Handles file uploads, downloads, and document organization
 */
export const documentService = {
  /**
   * Upload multiple documents to a dossier
   */
  uploadDocuments: async (dossierId, files, metadata = {}) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('documents', file);
    });
    formData.append('metadata', JSON.stringify(metadata));

    const response = await apiClient.post(`/dossiers/${dossierId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get all documents for a dossier
   */
  getDocuments: async (dossierId) => {
    const response = await apiClient.get(`/dossiers/${dossierId}/documents`);
    return response.data;
  },

  /**
   * Download specific document
   */
  downloadDocument: async (documentId) => {
    const response = await apiClient.get(`/documents/${documentId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Update document metadata (including physical location)
   */
  updateDocument: async (documentId, metadata) => {
    const response = await apiClient.put(`/documents/${documentId}`, metadata);
    return response.data;
  },

  /**
   * Delete document
   */
  deleteDocument: async (documentId) => {
    const response = await apiClient.delete(`/documents/${documentId}`);
    return response.data;
  },

  /**
   * Search documents by filename or content
   */
  searchDocuments: async (searchTerm) => {
    const response = await apiClient.get('/documents/search', {
      params: { q: searchTerm }
    });
    return response.data;
  },

  /**
   * Get document preview URL
   */
  getPreviewUrl: (documentId) => {
    return `${apiClient.defaults.baseURL}/documents/${documentId}/preview`;
  },
};