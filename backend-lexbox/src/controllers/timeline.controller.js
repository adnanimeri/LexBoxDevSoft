// ===================================================================
// TIMELINE CONTROLLER
// ===================================================================
// src/controllers/timeline.controller.js

const timelineService = require('../services/timeline.service');

class TimelineController {
  /**
   * Get timeline for dossier
   * GET /api/dossiers/:dossierId/timeline
   */
  async getTimeline(req, res) {
    try {
      const { dossierId } = req.params;
      const filters = {
        nodeType: req.query.node_type,
        activityType: req.query.activity_type,
        status: req.query.status,
        startDate: req.query.start_date,
        endDate: req.query.end_date,
        isBillable: req.query.is_billable,
        isBilled: req.query.is_billed,
        sortBy: req.query.sort_by,
        sortOrder: req.query.sort_order
      };

      const result = await timelineService.getTimeline(dossierId, filters);

      res.json({
        success: true,
        data: result.nodes,
        totals: result.totals
      });
    } catch (error) {
      console.error('Error getting timeline:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve timeline',
        error: error.message
      });
    }
  }

  /**
   * Get single timeline node
   * GET /api/timeline/:nodeId
   */
  async getTimelineNode(req, res) {
    try {
      const node = await timelineService.getTimelineNode(req.params.nodeId);

      res.json({
        success: true,
        data: node
      });
    } catch (error) {
      if (error.message === 'Timeline node not found') {
        return res.status(404).json({
          success: false,
          message: 'Timeline node not found'
        });
      }

      console.error('Error getting timeline node:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve timeline node',
        error: error.message
      });
    }
  }

  /**
   * Create timeline node
   * POST /api/dossiers/:dossierId/timeline
   */
  async createTimelineNode(req, res) {
    try {
      const { dossierId } = req.params;
      const userId = req.user?.id || null;

      const node = await timelineService.createTimelineNode(
        dossierId,
        req.body,
        userId
      );

      res.status(201).json({
        success: true,
        message: 'Timeline node created successfully',
        data: node
      });
    } catch (error) {
      if (error.message === 'Dossier not found') {
        return res.status(404).json({
          success: false,
          message: 'Dossier not found'
        });
      }

      console.error('Error creating timeline node:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create timeline node',
        error: error.message
      });
    }
  }

  /**
   * Update timeline node
   * PUT /api/timeline/:nodeId
   */
  async updateTimelineNode(req, res) {
    try {
      const userId = req.user?.id || null;
      const node = await timelineService.updateTimelineNode(
        req.params.nodeId,
        req.body,
        userId
      );

      res.json({
        success: true,
        message: 'Timeline node updated successfully',
        data: node
      });
    } catch (error) {
      if (error.message === 'Timeline node not found') {
        return res.status(404).json({
          success: false,
          message: 'Timeline node not found'
        });
      }

      console.error('Error updating timeline node:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update timeline node',
        error: error.message
      });
    }
  }

  /**
   * Delete timeline node
   * DELETE /api/timeline/:nodeId
   */
  async deleteTimelineNode(req, res) {
    try {
      await timelineService.deleteTimelineNode(req.params.nodeId);

      res.json({
        success: true,
        message: 'Timeline node deleted successfully'
      });
    } catch (error) {
      if (error.message === 'Timeline node not found') {
        return res.status(404).json({
          success: false,
          message: 'Timeline node not found'
        });
      }

      console.error('Error deleting timeline node:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete timeline node',
        error: error.message
      });
    }
  }

  /**
   * Get unbilled nodes
   * GET /api/dossiers/:dossierId/timeline/unbilled
   */
  async getUnbilledNodes(req, res) {
    try {
      const nodes = await timelineService.getUnbilledNodes(req.params.dossierId);

      res.json({
        success: true,
        data: nodes
      });
    } catch (error) {
      console.error('Error getting unbilled nodes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve unbilled nodes',
        error: error.message
      });
    }
  }

  /**
   * Mark nodes as billed
   * POST /api/timeline/mark-billed
   */
  async markAsBilled(req, res) {
    try {
      const { nodeIds, invoiceId } = req.body;

      if (!nodeIds || !Array.isArray(nodeIds)) {
        return res.status(400).json({
          success: false,
          message: 'nodeIds array is required'
        });
      }

      const result = await timelineService.markAsBilled(nodeIds, invoiceId);

      res.json({
        success: true,
        message: `${result.updated} nodes marked as billed`,
        data: result
      });
    } catch (error) {
      console.error('Error marking nodes as billed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark nodes as billed',
        error: error.message
      });
    }
  }

  /**
   * Get timeline statistics
   * GET /api/timeline/stats
   */
  async getTimelineStats(req, res) {
    try {
      const userId = req.query.user_id || null;
      const days = parseInt(req.query.days) || 30;

      const stats = await timelineService.getTimelineStats(userId, days);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting timeline stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve timeline statistics',
        error: error.message
      });
    }
  }

  /**
   * Get timeline totals for a dossier
   * GET /api/dossiers/:dossierId/timeline/totals
   */
  async getTimelineTotals(req, res) {
    try {
      const { dossierId } = req.params;
      const totals = await timelineService.getTimelineTotals(dossierId);
      res.json({
        success: true,
        data: totals
      });
    } catch (error) {
      console.error('Error getting timeline totals:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve timeline totals',
        error: error.message
      });
    }
  }
}

module.exports = new TimelineController();