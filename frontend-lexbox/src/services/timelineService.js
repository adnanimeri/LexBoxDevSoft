// src/services/timelineService.js
import apiClient from './apiService';

/**
 * Timeline management API service
 */
export const timelineService = {
  /**
   * Get timeline for a dossier
   */
  getTimeline: async (dossierId, filters = {}) => {
    const response = await apiClient.get(`/dossiers/${dossierId}/timeline`, { params: filters });
    return response.data;
  },

  /**
   * Get single timeline node
   */
  getTimelineNode: async (nodeId) => {
    const response = await apiClient.get(`/timeline/${nodeId}`);
    return response.data;
  },

  /**
   * Create timeline node
   */
  createTimelineNode: async (dossierId, nodeData) => {
    const response = await apiClient.post(`/dossiers/${dossierId}/timeline`, nodeData);
    return response.data;
  },

  /**
   * Update timeline node
   */
  updateTimelineNode: async (nodeId, nodeData) => {
    const response = await apiClient.put(`/timeline/${nodeId}`, nodeData);
    return response.data;
  },

  /**
   * Delete timeline node
   */
  deleteTimelineNode: async (nodeId) => {
    const response = await apiClient.delete(`/timeline/${nodeId}`);
    return response.data;
  },

  /**
   * Get unbilled nodes for a dossier
   */
  getUnbilledNodes: async (dossierId) => {
    const response = await apiClient.get(`/dossiers/${dossierId}/timeline/unbilled`);
    return response.data;
  },

  /**
   * Mark nodes as billed
   */
  markAsBilled: async (nodeIds, invoiceId = null) => {
    const response = await apiClient.post('/timeline/mark-billed', { nodeIds, invoiceId });
    return response.data;
  },

  /**
   * Get timeline statistics
   */
  getTimelineStats: async (days = 30) => {
    const response = await apiClient.get('/timeline/stats', { params: { days } });
    return response.data;
  }
};


/* 

// Timeline management API service
 // Handles timeline nodes, activities, and case progression

export const timelineService = {
  
   // Get timeline for specific dossier
   
  getTimeline: async (dossierId) => {
    const response = await apiClient.get(`/dossiers/${dossierId}/timeline`);
    return response.data;
  },

  
   // Create new timeline node
   
  createTimelineNode: async (dossierId, nodeData) => {
    const response = await apiClient.post(`/dossiers/${dossierId}/timeline`, nodeData);
    return response.data;
  },

  
  // Update existing timeline node
  
  updateTimelineNode: async (nodeId, nodeData) => {
    const response = await apiClient.put(`/timeline-nodes/${nodeId}`, nodeData);
    return response.data;
  },

  
   // Delete timeline node (admin only)
   
  deleteTimelineNode: async (nodeId) => {
    const response = await apiClient.delete(`/timeline-nodes/${nodeId}`);
    return response.data;
  },

  
   // Get timeline node details
   
  getTimelineNode: async (nodeId) => {
    const response = await apiClient.get(`/timeline-nodes/${nodeId}`);
    return response.data;
  },

  
   / Export timeline as PDF
   
  exportTimeline: async (dossierId) => {
    const response = await apiClient.get(`/dossiers/${dossierId}/timeline/export`, {
      responseType: 'blob'
    });
    return response.data;
  },
};

*/