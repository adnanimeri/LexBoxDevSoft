//=================================================================
// DOCUMENT SERVICE
// ===================================================================
// src/services/document.service.js

const { Document, Dossier, User, TimelineNode } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

class DocumentService {
  /**
   * Get all documents for a dossier
   */
  async getDocuments(dossierId, filters = {}) {
    const { search, category, startDate, endDate } = filters;
    
    const where = { dossier_id: dossierId };
    
    if (search) {
      where[Op.or] = [
        { original_filename: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (category) {
      where.category = category;
    }
    
    if (startDate || endDate) {
      where.document_date = {};
      if (startDate) where.document_date[Op.gte] = startDate;
      if (endDate) where.document_date[Op.lte] = endDate;
    }

    const documents = await Document.findAll({
      where,
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'first_name', 'last_name']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return documents;
  }

  /**
   * Get single document by ID
   */
  async getDocumentById(documentId) {
    const document = await Document.findByPk(documentId, {
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: Dossier,
          as: 'dossier',
          attributes: ['id', 'dossier_number', 'title']
        }
      ]
    });

    if (!document) {
      throw new Error('Document not found');
    }

    return document;
  }

  /**
   * Create/Upload documents
   */
  async createDocuments(dossierId, files, metadata, userId) {
    const transaction = await sequelize.transaction();

    try {
      const dossier = await Dossier.findByPk(dossierId);
      if (!dossier) {
        throw new Error('Dossier not found');
      }

      const uploadedDocs = [];

      for (const file of files) {
        const document = await Document.create({
          dossier_id: dossierId,
          original_filename: file.originalname,
          filename: file.filename,
          file_path: file.path,
          file_size: file.size,
          mime_type: file.mimetype,
          category: metadata.category || 'other',
          physical_location: metadata.physical_location || null,
          is_confidential: metadata.is_confidential === 'true' || metadata.is_confidential === true,
          description: metadata.description || null,
          document_date: metadata.document_date || new Date(),
          uploaded_by: userId,
          metadata: {
            encryption: metadata.encryption || 'none'
          }
        }, { transaction });

        uploadedDocs.push(document);

        // Create timeline entry if requested
        if (metadata.create_timeline_entry === 'true' || metadata.create_timeline_entry === true) {
          const hoursWorked = parseFloat(metadata.hours_worked) || 0;
          const hourlyRate = parseFloat(metadata.hourly_rate) || 0;
          const isBillable = metadata.is_billable === 'true' || metadata.is_billable === true;

          await TimelineNode.create({
            dossier_id: dossierId,
            document_id: document.id,
            node_type: 'document',
            title: metadata.timeline_title || `Document uploaded: ${file.originalname}`,
            description: `Document "${file.originalname}" was uploaded`,
            activity_date: new Date(),
            status: 'completed',
            is_billable: isBillable,
            hours_worked: hoursWorked,
            hourly_rate: hourlyRate,
            billing_amount: isBillable ? (hoursWorked * hourlyRate) : 0,
            created_by: userId
          }, { transaction });
        }
      }

      await transaction.commit();
      return uploadedDocs;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update document metadata
   */
  async updateDocument(documentId, updateData) {
    const document = await Document.findByPk(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    const allowedUpdates = [
      'category', 
      'physical_location', 
      'is_confidential', 
      'description', 
      'document_date'
    ];

    const filteredData = {};
    for (const key of allowedUpdates) {
      if (updateData[key] !== undefined) {
        filteredData[key] = updateData[key];
      }
    }

    await document.update(filteredData);
    return await this.getDocumentById(documentId);
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId) {
    const document = await Document.findByPk(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Delete file from disk
    try {
      await fs.unlink(document.file_path);
    } catch (err) {
      console.error('Error deleting file:', err.message);
    }

    // Delete related timeline nodes
    await TimelineNode.destroy({
      where: { document_id: documentId }
    });

    await document.destroy();
    return { success: true };
  }

  /**
   * Get document file for download/preview
   */
  async getDocumentFile(documentId) {
    const document = await Document.findByPk(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Check if file exists
    try {
      await fs.access(document.file_path);
    } catch (err) {
      throw new Error('File not found on server');
    }

    // Read the file
    const buffer = await fs.readFile(document.file_path);

    return {
      buffer: buffer,
      filename: document.original_filename,
      mimetype: document.mime_type,
      path: document.file_path
    };
  }

  /**
   * Get document stats for a dossier
   */
  async getDocumentStats(dossierId) {
    const documents = await Document.findAll({
      where: { dossier_id: dossierId },
      attributes: ['category', 'file_size', 'is_confidential']
    });

    const stats = {
      total: documents.length,
      totalSize: documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0),
      byCategory: {},
      confidentialCount: documents.filter(d => d.is_confidential).length
    };

    documents.forEach(doc => {
      const cat = doc.category || 'other';
      stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
    });

    return stats;
  }
}

module.exports = new DocumentService();
