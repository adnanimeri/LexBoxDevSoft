// src/services/documentService.js
import apiClient from './apiService';

export const documentService = {
  uploadDocuments: async (dossierId, files, metadata = {}) => {
    const formData = new FormData();
    
    // Add files
    files.forEach(file => {
      formData.append('files', file);
    });
    
    // Add metadata
    formData.append('category', metadata.category || 'other');
    formData.append('physical_location', metadata.physical_location || '');
    formData.append('is_confidential', metadata.is_confidential || false);
    formData.append('description', metadata.description || '');
    
    // Timeline integration
    formData.append('create_timeline_entry', metadata.create_timeline_entry || false);
    formData.append('timeline_title', metadata.timeline_title || '');
    formData.append('is_billable', metadata.is_billable || false);
    formData.append('hours_worked', metadata.hours_worked || 0);
    formData.append('hourly_rate', metadata.hourly_rate || 0);

    const response = await apiClient.post(`/dossiers/${dossierId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getDocuments: async (dossierId) => {
    const response = await apiClient.get(`/dossiers/${dossierId}/documents`);
    return response.data;
  },

  downloadDocument: async (documentId) => {
    const response = await apiClient.get(`/documents/${documentId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  updateDocument: async (documentId, metadata) => {
    const response = await apiClient.put(`/documents/${documentId}`, metadata);
    return response.data;
  },

  deleteDocument: async (documentId) => {
    const response = await apiClient.delete(`/documents/${documentId}`);
    return response.data;
  },

  searchDocuments: async (query) => {
    const response = await apiClient.get('/documents/search', {
      params: { q: query }
    });
    return response.data;
  },

  getPreviewUrl: (documentId) => {
    return `${apiClient.defaults.baseURL}/documents/${documentId}/preview`;
  }
};