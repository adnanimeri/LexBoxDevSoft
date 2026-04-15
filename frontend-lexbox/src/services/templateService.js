import apiClient from './apiService';

export const templateService = {
  // List all active templates for the org
  getTemplates: () => apiClient.get('/templates').then(r => r.data),

  // Get single template
  getTemplate: (id) => apiClient.get(`/templates/${id}`).then(r => r.data),

  // Create template (admin/lawyer)
  createTemplate: (data) => apiClient.post('/templates', data).then(r => r.data),

  // Update template (admin/lawyer)
  updateTemplate: (id, data) => apiClient.put(`/templates/${id}`, data).then(r => r.data),

  // Soft-delete template (admin/lawyer)
  deleteTemplate: (id) => apiClient.delete(`/templates/${id}`).then(r => r.data),

  // Generate a document from a template into a dossier
  // format: 'pdf' (default) | 'docx'   encrypt: boolean (default false)
  generateDocument: (templateId, dossierId, format = 'pdf', encrypt = false) =>
    apiClient.post(`/templates/${templateId}/generate`, { dossier_id: dossierId, format, encrypt }).then(r => r.data),
};
