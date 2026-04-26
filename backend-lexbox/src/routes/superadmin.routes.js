// ===================================================================
// SUPER ADMIN ROUTES  —  /api/super/*
// All routes require: authenticate + requireSuperAdmin
// ===================================================================

const express = require('express');
const router = express.Router();
const { authenticate, requireSuperAdmin } = require('../middleware/auth.middleware');
const {
  listOrgRequests,
  approveOrgRequest,
  rejectOrgRequest,
  listOrganizations,
  getOrgStats,
  updateOrgStatus,
  markInvoiced,
  listPlans,
  createPlan,
  updatePlan,
  updateOrgSubscription,
  getDashboardStats,
  getPlatformSettings,
  updatePlatformSettings,
  testPlatformEmail,
  listSubscriptionInvoices,
  createSubscriptionInvoice,
  sendSubscriptionInvoice,
  markSubscriptionInvoicePaid,
  downloadSubscriptionInvoicePdf,
  deleteSubscriptionInvoice
} = require('../controllers/superadmin.controller');

// Apply auth to every route in this file
router.use(authenticate, requireSuperAdmin);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Organization signup requests
router.get('/org-requests', listOrgRequests);
router.post('/org-requests/:id/approve', approveOrgRequest);
router.post('/org-requests/:id/reject', rejectOrgRequest);

// Organization management
router.get('/organizations', listOrganizations);
router.get('/organizations/:id/stats', getOrgStats);
router.patch('/organizations/:id/status', updateOrgStatus);
router.patch('/organizations/:id/subscription', updateOrgSubscription);
router.patch('/organizations/:id/mark-invoiced', markInvoiced);

// Subscription plans
router.get('/plans', listPlans);
router.post('/plans', createPlan);
router.patch('/plans/:id', updatePlan);

// Platform settings (SMTP, etc.)
router.get('/settings', getPlatformSettings);
router.put('/settings', updatePlatformSettings);
router.post('/settings/test-email', testPlatformEmail);

// Subscription invoices (platform billing → orgs)
router.get('/subscription-invoices',                          listSubscriptionInvoices);
router.post('/subscription-invoices',                         createSubscriptionInvoice);
router.post('/subscription-invoices/:id/send',                sendSubscriptionInvoice);
router.patch('/subscription-invoices/:id/mark-paid',          markSubscriptionInvoicePaid);
router.get('/subscription-invoices/:id/pdf',                  downloadSubscriptionInvoicePdf);
router.delete('/subscription-invoices/:id',                   deleteSubscriptionInvoice);

// Reset any user's password by email (not org-scoped)
router.post('/users/reset-password', async (req, res) => {
  try {
    const { email, new_password } = req.body;
    if (!email || !new_password) {
      return res.status(400).json({ success: false, message: 'email and new_password are required' });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }
    const User = require('../models/User');
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ success: false, message: `No user found with email: ${email}` });

    const password_hash = await User.hashPassword(new_password);
    await user.update({ password_hash, is_active: true });

    res.json({ success: true, message: `Password reset for ${email}. User is now active.` });
  } catch (error) {
    console.error('[SuperAdmin] reset-password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
