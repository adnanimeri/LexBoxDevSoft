// ===================================================================
// DOSSIER ROUTES (Timeline + Documents)
// ===================================================================
// src/routes/dossier.routes.js

const express = require('express');
const router = express.Router();
const timelineController = require('../controllers/timeline.controller');
const documentController = require('../controllers/document.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { Op } = require('sequelize');
const Dossier = require('../models/Dossier');
const Client = require('../models/Client');
const { upload, handleUploadError } = require('../middleware/upload.middleware');
const { validate: validateRequest } = require('../middleware/validation.middleware');
const { body, param } = require('express-validator');

// Timeline validation
const createTimelineValidation = [
  body('node_type')
    .notEmpty()
    .isIn(['registration', 'legal_classification', 'activity', 'document', 'milestone', 'billing_event'])
    .withMessage('Valid node type is required'),
  body('title')
    .trim()
    .notEmpty()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title is required'),
  body('activity_type')
    .optional()
    .isIn(['consultation', 'court_hearing', 'document_filing', 'phone_call', 'email', 'meeting', 'research', 'drafting', 'review', 'negotiation', 'other']),
  body('hours_worked').optional().isFloat({ min: 0, max: 999.99 }),
  body('hourly_rate').optional().isFloat({ min: 0 }),
  body('is_billable').optional().isBoolean(),
  body('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled']),
  validateRequest
];

// ==================== LIST ALL DOSSIERS FOR ORG ====================
// GET /api/dossiers  — lightweight list for dropdowns / calendar modal
router.get('/', authenticate, async (req, res, next) => {
  try {
    const orgId = req.user.organization_id;
    const dossiers = await Dossier.findAll({
      where: { organization_id: orgId, status: { [Op.notIn]: ['archived'] } },
      attributes: ['id', 'dossier_number', 'title', 'status'],
      include: [{ model: Client, as: 'client', attributes: ['id', 'first_name', 'last_name'] }],
      order: [['dossier_number', 'ASC']],
      limit: 200
    });
    res.json({ success: true, data: dossiers });
  } catch (error) {
    next(error);
  }
});

// ==================== DOSSIER UPDATE ====================
// PATCH /api/dossiers/:dossierId — update assigned_to, status, priority, legal_issue_type
router.patch('/:dossierId',
  authenticate,
  authorize(['admin', 'lawyer']),
  param('dossierId').isInt(),
  validateRequest,
  async (req, res) => {
    try {
      const dossier = await Dossier.findOne({
        where: { id: req.params.dossierId, organization_id: req.user.organization_id }
      });
      if (!dossier) return res.status(404).json({ success: false, message: 'Dossier not found' });

      const { assigned_to, status, priority, legal_issue_type, title } = req.body;
      const updates = {};
      if (assigned_to !== undefined) updates.assigned_to = assigned_to || null;
      if (status)            updates.status = status;
      if (priority)          updates.priority = priority;
      if (legal_issue_type)  updates.legal_issue_type = legal_issue_type;
      if (title)             updates.title = title;

      await dossier.update(updates);
      res.json({ success: true, data: dossier });
    } catch (error) {
      console.error('Error updating dossier:', error);
      res.status(500).json({ success: false, message: 'Failed to update dossier' });
    }
  }
);

// ==================== TIMELINE ROUTES ====================

router.get('/:dossierId/timeline',
  authenticate,
  param('dossierId').isInt(),
  validateRequest,
  timelineController.getTimeline.bind(timelineController)
);

router.post('/:dossierId/timeline',
  authenticate,
  authorize(['admin', 'lawyer', 'secretary']),
  param('dossierId').isInt(),
  createTimelineValidation,
  timelineController.createTimelineNode.bind(timelineController)
);

router.get('/:dossierId/timeline/unbilled',
  authenticate,
  authorize(['admin', 'lawyer']),
  param('dossierId').isInt(),
  validateRequest,
  timelineController.getUnbilledNodes.bind(timelineController)
);

router.get('/:dossierId/timeline/totals',
  authenticate,
  param('dossierId').isInt(),
  validateRequest,
  timelineController.getTimelineTotals.bind(timelineController)
);

// ==================== DOCUMENT ROUTES ====================

router.get('/:dossierId/documents',
  authenticate,
  param('dossierId').isInt(),
  validateRequest,
  documentController.getDocuments.bind(documentController)
);

router.post('/:dossierId/documents',
  authenticate,
  authorize(['admin', 'lawyer', 'secretary']),
  param('dossierId').isInt(),
  upload.array('files', 10),
  handleUploadError,
  documentController.uploadDocuments.bind(documentController)
);

router.get('/:dossierId/documents/stats',
  authenticate,
  param('dossierId').isInt(),
  validateRequest,
  documentController.getDocumentStats.bind(documentController)
);
router.get('/documents/:documentId',
  authenticate,
  param('documentId').isInt(),
  validateRequest,
  documentController.getDocument.bind(documentController)
);

router.get('/documents/:documentId/download',
  authenticate,
  param('documentId').isInt(),
  validateRequest,
  documentController.downloadDocument.bind(documentController)
);

router.get('/documents/:documentId/preview',
  authenticate,
  param('documentId').isInt(),
  validateRequest,
  documentController.previewDocument.bind(documentController)
);

router.put('/documents/:documentId',
  authenticate,
  authorize(['admin', 'lawyer', 'secretary']),
  param('documentId').isInt(),
  validateRequest,
  documentController.updateDocument.bind(documentController)
);

router.delete('/documents/:documentId',
  authenticate,
  authorize(['admin', 'lawyer']),
  param('documentId').isInt(),
  validateRequest,
  documentController.deleteDocument.bind(documentController)
);


module.exports = router;