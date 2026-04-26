// ===================================================================
// DOCUMENT CONTROLLER (with Encryption)
// ===================================================================
// src/controllers/document.controller.js

const documentService = require('../services/document.service');
const path = require('path');

class DocumentController {
  /**
   * Get all documents for a dossier
   * GET /api/dossiers/:dossierId/documents
   */
  async getDocuments(req, res) {
    try {
      const { dossierId } = req.params;
      const filters = {
        category: req.query.category,
        isConfidential: req.query.is_confidential,
        search: req.query.search,
        sortBy: req.query.sort_by,
        sortOrder: req.query.sort_order
      };

      const documents = await documentService.getDocuments(dossierId, filters);

      res.json({
        success: true,
        data: documents,
        count: documents.length
      });
    } catch (error) {
      console.error('Error getting documents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve documents',
        error: error.message
      });
    }
  }

  /**
   * Get single document
   * GET /api/documents/:documentId
   */
  async getDocument(req, res) {
    try {
      const document = await documentService.getDocumentById(req.params.documentId);

      res.json({
        success: true,
        data: document
      });
    } catch (error) {
      if (error.message === 'Document not found') {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      console.error('Error getting document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve document',
        error: error.message
      });
    }
  }

  /**
   * Upload document(s)
   * POST /api/dossiers/:dossierId/documents
   */


 /**
 * Upload document(s)
 * POST /api/dossiers/:dossierId/documents
 */
async uploadDocuments(req, res) {
  try {
    const { dossierId } = req.params;
    const userId = req.user?.id || null;
    const metadata = {
    category: req.body.category || 'other',
    physical_location: req.body.physical_location,
    is_confidential: req.body.is_confidential === 'true',
   encryption: req.body.encryption || 'none',
    description: req.body.description,
    document_date: req.body.document_date,
  // Timeline integration fields
    create_timeline_entry: req.body.create_timeline_entry === 'true',
    timeline_title: req.body.timeline_title,
    is_billable: req.body.is_billable === 'true',
    hours_worked: req.body.hours_worked,
    hourly_rate: req.body.hourly_rate
};

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const documents = await documentService.createDocuments(
      dossierId,
      req.files,
      metadata,
      userId
    );

    res.status(201).json({
      success: true,
      message: `${documents.length} document(s) uploaded and encrypted successfully`,
      data: documents
    });
  } catch (error) {
    if (error.message === 'Dossier not found') {
      return res.status(404).json({
        success: false,
        message: 'Dossier not found'
      });
    }

    console.error('Error uploading documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload documents',
      error: error.message
    });
  }
}




  /**
   * Update document metadata
   * PUT /api/documents/:documentId
   */
  async updateDocument(req, res) {
    try {
      const userId = req.user?.id || null;
      const document = await documentService.updateDocument(
        req.params.documentId,
        req.body,
        userId
      );

      res.json({
        success: true,
        message: 'Document updated successfully',
        data: document
      });
    } catch (error) {
      if (error.message === 'Document not found') {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      console.error('Error updating document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update document',
        error: error.message
      });
    }
  }

  /**
   * Delete document
   * DELETE /api/documents/:documentId
   */
  async deleteDocument(req, res) {
    try {
      await documentService.deleteDocument(req.params.documentId);

      res.json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error) {
      if (error.message === 'Document not found') {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      console.error('Error deleting document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete document',
        error: error.message
      });
    }
  }

  /**
   * Download document (decrypted)
   * GET /api/documents/:documentId/download
   */
  async downloadDocument(req, res) {
    try {
      const file = await documentService.getDocumentFile(req.params.documentId);

      res.setHeader('Content-Type', file.mimetype);
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      res.setHeader('Content-Length', file.buffer.length);
      res.send(file.buffer);
    } catch (error) {
      if (error.message === 'Document not found' || error.message === 'File not found on server') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      console.error('Error downloading document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download document',
        error: error.message
      });
    }
  }

  /**
   * Preview document (decrypted, for PDFs and images)
   * GET /api/documents/:documentId/preview
   */
  async previewDocument(req, res) {
    try {
      const file = await documentService.getDocumentFile(req.params.documentId);

      res.setHeader('Content-Type', file.mimetype);
      res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
      res.setHeader('Content-Length', file.buffer.length);
      res.send(file.buffer);
    } catch (error) {
      if (error.message === 'Document not found' || error.message === 'File not found on server') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      console.error('Error previewing document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to preview document',
        error: error.message
      });
    }
  }

  /**
   * Get document statistics for a dossier
   * GET /api/dossiers/:dossierId/documents/stats
   */
  async getDocumentStats(req, res) {
    try {
      const stats = await documentService.getDocumentStats(req.params.dossierId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting document stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve document statistics',
        error: error.message
      });
    }
  }
}

module.exports = new DocumentController();