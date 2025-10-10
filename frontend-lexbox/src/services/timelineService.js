// ===================================================================
// TIMELINE SERVICE
// ===================================================================
// src/services/timelineService.js
import apiClient from './apiService';

/**
 * Timeline management API service
 * Handles timeline nodes, activities, and case progression
 */
export const timelineService = {
  /**
   * Get timeline for specific dossier
   */
  getTimeline: async (dossierId) => {
    const response = await apiClient.get(`/dossiers/${dossierId}/timeline`);
    return response.data;
  },

  /**
   * Create new timeline node
   */
  createTimelineNode: async (dossierId, nodeData) => {
    const response = await apiClient.post(`/dossiers/${dossierId}/timeline`, nodeData);
    return response.data;
  },

  /**
   * Update existing timeline node
   */
  updateTimelineNode: async (nodeId, nodeData) => {
    const response = await apiClient.put(`/timeline-nodes/${nodeId}`, nodeData);
    return response.data;
  },

  /**
   * Delete timeline node (admin only)
   */
  deleteTimelineNode: async (nodeId) => {
    const response = await apiClient.delete(`/timeline-nodes/${nodeId}`);
    return response.data;
  },

  /**
   * Get timeline node details
   */
  getTimelineNode: async (nodeId) => {
    const response = await apiClient.get(`/timeline-nodes/${nodeId}`);
    return response.data;
  },

  /**
   * Export timeline as PDF
   */
  exportTimeline: async (dossierId) => {
    const response = await apiClient.get(`/dossiers/${dossierId}/timeline/export`, {
      responseType: 'blob'
    });
    return response.data;
  },
};