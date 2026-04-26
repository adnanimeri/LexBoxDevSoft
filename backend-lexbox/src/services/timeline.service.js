// ===================================================================
// TIMELINE SERVICE
// ===================================================================
// src/services/timeline.service.js

const { TimelineNode, Dossier, User, Document } = require('../models');
const { Op } = require('sequelize');

class TimelineService {
  /**
   * Get timeline for a dossier
   */
  async getTimeline(dossierId, filters = {}) {
    const {
      nodeType,
      activityType,
      status,
      startDate,
      endDate,
      isBillable,
      isBilled,
      sortOrder = 'DESC'
    } = filters;

    const where = { dossier_id: dossierId };

    if (nodeType) where.node_type = nodeType;
    if (activityType) where.activity_type = activityType;
    if (status) where.status = status;
    if (isBillable !== undefined) where.is_billable = isBillable;
    if (isBilled !== undefined) where.is_billed = isBilled;

    if (startDate || endDate) {
      where.activity_date = {};
      if (startDate) where.activity_date[Op.gte] = new Date(startDate);
      if (endDate) where.activity_date[Op.lte] = new Date(endDate);
    }

    try {
      const timelineNodes = await TimelineNode.findAll({
        where,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'first_name', 'last_name', 'email'],
            required: false
          },
          {
            model: Document,
            as: 'document',
            attributes: ['id', 'original_filename', 'mime_type', 'file_size', 'category'],
            required: false
          }
        ],
        order: [['activity_date', sortOrder]]
      });

      //return { nodes: timelineNodes, totals: {} };
      // Get totals
      const totals = await this.getTimelineTotals(dossierId);
      return { nodes: timelineNodes, totals };  

    } catch (error) {
      console.error('Error fetching timeline:', error);
      throw error;
    }
  }

  /**
   * Get timeline totals for a dossier
   */
  async getTimelineTotals(dossierId) {
    try {
      const nodes = await TimelineNode.findAll({
        where: { dossier_id: dossierId },
        attributes: ['hours_worked', 'billing_amount', 'is_billable', 'is_billed']
      });

      const totals = {
        totalNodes: nodes.length,
        totalHours: 0,
        totalBilling: 0,
        billedAmount: 0,
        unbilledAmount: 0
      };
/*
      nodes.forEach(node => {
        totals.totalHours += parseFloat(node.hours_worked) || 0;
        if (node.is_billable) {
          const amount = parseFloat(node.billing_amount) || 0;
          totals.totalBilling += amount;
          if (node.is_billed) {
            totals.totalBilling += amount;
          } else {
            totals.unbilledAmount += amount;
          }
        }
      });
*/

nodes.forEach(node => {
  totals.totalHours += parseFloat(node.hours_worked) || 0;
  if (node.is_billable) {
    const amount = parseFloat(node.billing_amount) || 0;
    totals.totalBilling += amount;
    if (node.is_billed) {
      totals.billedAmount += amount;  // FIXED: Now adds to billedAmount
    } else {
      totals.unbilledAmount += amount;
    }
  }
});


      return totals;
    } catch (error) {
      console.error('Error fetching timeline totals:', error);
      throw error;
    }
  }

  /**
   * Get single timeline node
   */
  async getTimelineNode(nodeId) {
    const node = await TimelineNode.findByPk(nodeId, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email'],
          required: false
        },
        {
          model: Dossier,
          as: 'dossier',
          attributes: ['id', 'dossier_number', 'title'],
          required: false
        },
        {
          model: Document,
          as: 'document',
          attributes: ['id', 'original_filename', 'mime_type', 'file_size', 'category'],
          required: false
        }
      ]
    });

    if (!node) {
      throw new Error('Timeline node not found');
    }

    return node;
  }




  /**
   * Create timeline node
   */
  async createTimelineNode(dossierId, data, userId) {
    // Verify dossier exists
    const dossier = await Dossier.findByPk(dossierId);
    if (!dossier) {
      throw new Error('Dossier not found');
    }

    const hours = parseFloat(data.hours_worked) || 0;
    const rate = parseFloat(data.hourly_rate) || 0;

    const nodeData = {
      dossier_id: dossierId,
      node_type: data.node_type,
      activity_type: data.activity_type || null,
      title: data.title,
      description: data.description || null,
      activity_date: data.activity_date || new Date(),
      hours_worked: hours,
      hourly_rate: rate,
      billing_amount: hours * rate,
      is_billable: data.is_billable || false,
      is_billed: false,
      status: data.status || 'completed',
      priority: data.priority || 'medium',
      document_id: data.document_id || null,
      metadata: data.metadata || {},
      created_by: userId
    };

    const node = await TimelineNode.create(nodeData);

    // Update dossier billing totals
    await this.updateDossierBilling(dossierId);

    return await this.getTimelineNode(node.id);
  }

  /**
   * Update timeline node
   */
  async updateTimelineNode(nodeId, data, userId) {
    const node = await TimelineNode.findByPk(nodeId);
    if (!node) {
      throw new Error('Timeline node not found');
    }

    // Recalculate billing amount if hours or rate changed
    if (data.hours_worked !== undefined || data.hourly_rate !== undefined) {
      const hours = data.hours_worked !== undefined ? parseFloat(data.hours_worked) : parseFloat(node.hours_worked);
      const rate = data.hourly_rate !== undefined ? parseFloat(data.hourly_rate) : parseFloat(node.hourly_rate);
      data.billing_amount = hours * rate;
    }

    data.updated_by = userId;

    await node.update(data);

    // Update dossier billing totals
    await this.updateDossierBilling(node.dossier_id);

    return await this.getTimelineNode(nodeId);
  }

  /**
   * Delete timeline node
   */
  async deleteTimelineNode(nodeId) {
    const node = await TimelineNode.findByPk(nodeId);
    if (!node) {
      throw new Error('Timeline node not found');
    }

    const dossierId = node.dossier_id;
    await node.destroy();

    // Update dossier billing totals
    await this.updateDossierBilling(dossierId);

    return { success: true };
  }

  /**
   * Mark nodes as billed
   */
  async markAsBilled(nodeIds, invoiceId) {
    await TimelineNode.update(
      { is_billed: true, invoice_id: invoiceId },
      { where: { id: { [Op.in]: nodeIds } } }
    );

    return { success: true, count: nodeIds.length };
  }

  /**
   * Get unbilled nodes for a dossier
   */
  async getUnbilledNodes(dossierId) {
    const nodes = await TimelineNode.findAll({
      where: {
        dossier_id: dossierId,
        is_billable: true,
        is_billed: false
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name'],
          required: false
        },
        {
          model: Document,
          as: 'document',
          attributes: ['id', 'original_filename'],
          required: false
        }
      ],
      order: [['activity_date', 'ASC']]
    });

    return nodes;
  }

  /**
   * Update dossier billing totals
   */
  async updateDossierBilling(dossierId) {
    try {
      const totals = await this.getTimelineTotals(dossierId);
      
      await Dossier.update(
        { total_billed: totals.totalBilling },
        { where: { id: dossierId } }
      );
    } catch (error) {
      console.error('Error updating dossier billing:', error);
    }
  }

  /**
   * Get timeline stats for dashboard
   */
  async getTimelineStats(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where = {
      created_at: { [Op.gte]: startDate }
    };

    if (userId) {
      where.created_by = userId;
    }

    const nodes = await TimelineNode.findAll({
      where,
      attributes: ['node_type', 'hours_worked', 'billing_amount', 'is_billable']
    });

    const stats = {
      totalActivities: nodes.length,
      totalHours: 0,
      totalBilling: 0,
      byType: {}
    };

    nodes.forEach(node => {
      stats.totalHours += parseFloat(node.hours_worked) || 0;
      if (node.is_billable) {
        stats.totalBilling += parseFloat(node.billing_amount) || 0;
      }
      stats.byType[node.node_type] = (stats.byType[node.node_type] || 0) + 1;
    });

    return stats;
  }
}

module.exports = new TimelineService();