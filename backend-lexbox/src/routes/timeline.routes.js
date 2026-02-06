// ===================================================================
// TIMELINE ROUTES
// ===================================================================
// src/routes/timeline.routes.js

const express = require('express');
const router = express.Router();
const timelineController = require('../controllers/timeline.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate: validateRequest } = require('../middleware/validation.middleware');
const { body, param, query } = require('express-validator');

// Validation rules
const createTimelineValidation = [
  body('node_type')
    .notEmpty()
    .isIn(['registration', 'legal_classification', 'activity', 'document', 'milestone', 'billing_event'])
    .withMessage('Valid node type is required'),
  body('title')
    .trim()
    .notEmpty()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title is required (max 255 characters)'),
  body('activity_type')
    .optional()
    .isIn(['consultation', 'court_hearing', 'document_filing', 'phone_call', 'email', 'meeting', 'research', 'drafting', 'review', 'negotiation', 'other']),
  body('description').optional().trim(),
  body('activity_date').optional().isISO8601(),
  body('hours_worked').optional().isFloat({ min: 0, max: 999.99 }),
  body('hourly_rate').optional().isFloat({ min: 0 }),
  body('billing_amount').optional().isFloat({ min: 0 }),
  body('is_billable').optional().isBoolean(),
  body('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  validateRequest
];

const updateTimelineValidation = [
  param('nodeId').isInt(),
  body('node_type')
    .optional()
    .isIn(['registration', 'legal_classification', 'activity', 'document', 'milestone', 'billing_event']),
  body('title').optional().trim().isLength({ min: 1, max: 255 }),
  body('activity_type')
    .optional()
    .isIn(['consultation', 'court_hearing', 'document_filing', 'phone_call', 'email', 'meeting', 'research', 'drafting', 'review', 'negotiation', 'other']),
  body('hours_worked').optional().isFloat({ min: 0, max: 999.99 }),
  body('hourly_rate').optional().isFloat({ min: 0 }),
  body('is_billable').optional().isBoolean(),
  body('is_billed').optional().isBoolean(),
  body('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled']),
  validateRequest
];

// Timeline stats (must be before /:nodeId routes)
router.get('/stats', 
  authenticate, 
  timelineController.getTimelineStats.bind(timelineController)
);

// Mark nodes as billed
router.post('/mark-billed', 
  authenticate, 
  authorize(['admin', 'lawyer']),
  body('nodeIds').isArray().withMessage('nodeIds must be an array'),
  body('invoiceId').optional().isInt(),
  validateRequest,
  timelineController.markAsBilled.bind(timelineController)
);

// Single node operations
router.get('/:nodeId', 
  authenticate, 
  param('nodeId').isInt(), 
  validateRequest,
  timelineController.getTimelineNode.bind(timelineController)
);

router.put('/:nodeId', 
  authenticate, 
  authorize(['admin', 'lawyer']),
  updateTimelineValidation,
  timelineController.updateTimelineNode.bind(timelineController)
);

router.delete('/:nodeId', 
  authenticate, 
  authorize(['admin', 'lawyer']),
  param('nodeId').isInt(), 
  validateRequest,
  timelineController.deleteTimelineNode.bind(timelineController)
);

module.exports = router;