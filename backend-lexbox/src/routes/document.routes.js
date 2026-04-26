// ===================================================================
// DOCUMENT ROUTES
// ===================================================================
// src/routes/document.routes.js

const express = require('express');
const router = express.Router();
const documentController = require('../controllers/document.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { upload, handleUploadError } = require('../middleware/upload.middleware');
const { param, body } = require('express-validator');
const { validate: validateRequest } = require('../middleware/validation.middleware');

// Test route - for debugging
router.get('/test', (req, res) => {
  res.json({ message: 'Document routes are working!' });
});

// Single document operations
router.get('/:documentId',
  authenticate,
  param('documentId').isInt(),
  validateRequest,
  documentController.getDocument.bind(documentController)
);

router.put('/:documentId',
  authenticate,
  authorize(['admin', 'lawyer']),
  param('documentId').isInt(),
  body('category').optional().isIn([
    'contract', 'evidence', 'correspondence', 'court_document',
    'identification', 'financial', 'legal_brief', 'witness_statement',
    'medical_record', 'other'
  ]),
  body('is_confidential').optional().isBoolean(),
  validateRequest,
  documentController.updateDocument.bind(documentController)
);

router.delete('/:documentId',
  authenticate,
  authorize(['admin', 'lawyer']),
  param('documentId').isInt(),
  validateRequest,
  documentController.deleteDocument.bind(documentController)
);

router.get('/:documentId/download',
  authenticate,
  param('documentId').isInt(),
  validateRequest,
  documentController.downloadDocument.bind(documentController)
);

router.get('/:documentId/preview',
  authenticate,
  param('documentId').isInt(),
  validateRequest,
  documentController.previewDocument.bind(documentController)
);

module.exports = router;