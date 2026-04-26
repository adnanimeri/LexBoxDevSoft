
// ===================================================================
// SETTINGS ROUTES
// ===================================================================
// src/routes/settings.routes.js

const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * GET /api/settings/defaults/billing
 * Get billing defaults (public for authenticated users)
 */
router.get('/defaults/billing', authenticate, settingsController.getBillingDefaults);

// Admin-only routes below
router.use(authenticate);
router.use(authorize(['admin']));

/**
 * GET /api/settings
 * Get all settings
 */
router.get('/', settingsController.getAllSettings);

/**
 * GET /api/settings/:category
 * Get settings by category
 */
router.get('/:category', settingsController.getByCategory);

/**
 * PUT /api/settings
 * Update multiple settings
 */
router.put('/', settingsController.updateSettings);

/**
 * POST /api/settings/test-email
 * Test email configuration
 */
router.post('/test-email', settingsController.testEmail);

module.exports = router;
