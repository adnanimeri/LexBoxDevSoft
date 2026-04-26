// ===================================================================
// BILLING ROUTES
// ===================================================================
// src/routes/billing.routes.js

const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billing.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const Organization = require('../models/Organization');

// Allow secretary if org has granted billing access
const allowSecretaryBilling = async (req, res, next) => {
  if (req.user.role !== 'secretary') return next();
  try {
    const org = await Organization.findByPk(req.user.organization_id, { attributes: ['settings'] });
    if (org?.settings?.secretary_can_access_billing) return next();
    return res.status(403).json({ success: false, message: 'Your role does not have permission for billing' });
  } catch {
    return res.status(500).json({ success: false, message: 'Permission check failed' });
  }
};

// All billing routes require authentication
router.use(authenticate);

// ===================================================================
// GLOBAL BILLING ROUTES (org-wide)
// ===================================================================

router.get('/billing/invoices', authorize(['admin', 'lawyer']), billingController.getGlobalInvoices);
router.get('/billing/summary',  authorize(['admin', 'lawyer']), billingController.getGlobalSummary);

// ===================================================================
// DOSSIER BILLING ROUTES
// ===================================================================

/**
 * GET /api/dossiers/:dossierId/invoices
 */
router.get(
  '/dossiers/:dossierId/invoices',
  authorize(['admin', 'lawyer', 'secretary']),
  allowSecretaryBilling,
  billingController.getInvoices
);

/**
 * GET /api/dossiers/:dossierId/unbilled
 */
router.get(
  '/dossiers/:dossierId/unbilled',
  authorize(['admin', 'lawyer', 'secretary']),
  allowSecretaryBilling,
  billingController.getUnbilledItems
);

/**
 * GET /api/dossiers/:dossierId/billing-summary
 */
router.get(
  '/dossiers/:dossierId/billing-summary',
  authorize(['admin', 'lawyer', 'secretary']),
  allowSecretaryBilling,
  billingController.getBillingSummary
);

/**
 * POST /api/dossiers/:dossierId/invoices
 */
router.post(
  '/dossiers/:dossierId/invoices',
  authorize(['admin', 'lawyer', 'secretary']),
  allowSecretaryBilling,
  billingController.createInvoice
);

// ===================================================================
// INVOICE ROUTES
// ===================================================================

/**
 * GET /api/invoices/:invoiceId
 */
router.get(
  '/invoices/:invoiceId',
  authorize(['admin', 'lawyer', 'secretary']),
  allowSecretaryBilling,
  billingController.getInvoice
);

/**
 * PUT /api/invoices/:invoiceId
 */
router.put(
  '/invoices/:invoiceId',
  authorize(['admin', 'lawyer', 'secretary']),
  allowSecretaryBilling,
  billingController.updateInvoice
);

/**
 * POST /api/invoices/:invoiceId/send
 */
router.post(
  '/invoices/:invoiceId/send',
  authorize(['admin', 'lawyer', 'secretary']),
  allowSecretaryBilling,
  billingController.sendInvoice
);

/**
 * POST /api/invoices/:invoiceId/cancel
 */
router.post(
  '/invoices/:invoiceId/cancel',
  authorize(['admin', 'lawyer']),
  billingController.cancelInvoice
);

/**
 * POST /api/invoices/:invoiceId/payments
 */
router.post(
  '/invoices/:invoiceId/payments',
  authorize(['admin', 'lawyer', 'secretary']),
  allowSecretaryBilling,
  billingController.recordPayment
);

/**
 * GET /api/invoices/:invoiceId/pdf
 * Download invoice as PDF
 */
router.get(
  '/invoices/:invoiceId/pdf',
  authorize(['admin', 'lawyer', 'secretary']),
  allowSecretaryBilling,
  billingController.downloadInvoicePDF
);

/**
 * POST /api/invoices/:invoiceId/email
 * Send invoice via email
 */
router.post(
  '/invoices/:invoiceId/email',
  authorize(['admin', 'lawyer', 'secretary']),
  allowSecretaryBilling,
  billingController.emailInvoice
);

// ===================================================================
// PAYMENT ROUTES
// ===================================================================

/**
 * DELETE /api/payments/:paymentId
 */
router.delete(
  '/payments/:paymentId',
  authorize(['admin']),
  billingController.deletePayment
);

module.exports = router;