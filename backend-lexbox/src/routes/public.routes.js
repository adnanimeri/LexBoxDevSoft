// ===================================================================
// PUBLIC ROUTES  —  /api/public/*
// No authentication required — used by the law firm registration page
// ===================================================================

const express = require('express');
const router = express.Router();
const { SubscriptionPlan, OrganizationRequest, User, Organization } = require('../models');
const { body, validationResult } = require('express-validator');

// ===================================================================
// GET /api/public/plans
// Return all active subscription plans for the registration page
// ===================================================================
router.get('/plans', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'code', 'description', 'price_monthly', 'price_yearly', 'max_users', 'max_storage_gb', 'max_clients', 'max_dossiers', 'features', 'sort_order'],
      order: [['sort_order', 'ASC']]
    });
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

// ===================================================================
// POST /api/public/org-request
// Submit a law firm registration request
// ===================================================================
const validateOrgRequest = [
  body('organization_name').trim().notEmpty().withMessage('Law firm name is required'),
  body('contact_first_name').trim().notEmpty().withMessage('First name is required'),
  body('contact_last_name').trim().notEmpty().withMessage('Last name is required'),
  body('contact_email').isEmail().withMessage('Valid email is required').normalizeEmail({ gmail_remove_dots: false, all_lowercase: true }),
  body('contact_phone').optional({ checkFalsy: true }).trim(),
  body('company_size').optional({ checkFalsy: true }).isIn(['1-2', '3-5', '6-10', '11-20', '20+']).withMessage('Invalid company size'),
  body('plan_id').optional({ checkFalsy: true }).isInt().withMessage('Invalid plan'),
  body('message').optional({ checkFalsy: true }).trim()
];

router.post('/org-request', validateOrgRequest, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Please fix the errors below',
        details: errors.array().map(e => ({ field: e.path, message: e.msg }))
      }
    });
  }

  try {
    const {
      organization_name,
      contact_first_name,
      contact_last_name,
      contact_email,
      contact_phone,
      company_size,
      plan_id,
      message
    } = req.body;

    // Block if email already has a user account with a valid (existing) organization
    const existingUser = await User.findOne({
      where: { email: contact_email },
      include: [{ model: Organization, as: 'organization', attributes: ['id', 'status'], required: false }]
    });
    if (existingUser) {
      const org = existingUser.organization;
      // Orphaned user: their org was deleted — clean up and allow re-registration
      if (!org || org.status === 'deleted') {
        // Deactivate and anonymize the orphaned user instead of destroying them.
        // Destroying causes FK violations (dossiers.updated_by, etc.).
        // Anonymizing frees the email for re-registration while keeping FK references intact.
        await existingUser.update({
          is_active: false,
          email: `deleted-${existingUser.id}-${Date.now()}@removed.com`,
          organization_id: null
        });
        // Also reset any stale approved/pending request for this email
        // so the duplicate-request check below won't block re-registration
        await OrganizationRequest.update(
          { status: 'rejected' },
          { where: { contact_email, status: ['pending', 'approved'] } }
        );
        // fall through to create the new request below
      } else if (org.status === 'suspended') {
        return res.status(409).json({
          success: false,
          error: { code: 'ORG_SUSPENDED', message: 'Your account has been suspended. Please contact support to reactivate it.' }
        });
      } else {
        return res.status(409).json({
          success: false,
          error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists. Please log in instead.' }
        });
      }
    }

    // Block if there is already a pending or approved request for this email
    const existingRequest = await OrganizationRequest.findOne({
      where: { contact_email, status: ['pending', 'approved'] }
    });
    if (existingRequest) {
      if (existingRequest.status === 'approved') {
        // Verify the organization that was created from this request still exists
        const linkedOrg = existingRequest.organization_id
          ? await Organization.findByPk(existingRequest.organization_id, { attributes: ['id', 'status'] })
          : null;

        if (!linkedOrg || linkedOrg.status === 'deleted') {
          // Organization was removed — stale approved request, allow re-registration
          await existingRequest.update({ status: 'rejected' });
          // fall through to create the new request below
        } else {
          return res.status(409).json({
            success: false,
            error: {
              code: 'DUPLICATE_REQUEST',
              message: 'This email has already been approved. Check your inbox for your login credentials.'
            }
          });
        }
      } else {
        // pending
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_REQUEST',
            message: 'A request from this email is already pending review. We will contact you soon.'
          }
        });
      }
    }

    const request = await OrganizationRequest.create({
      organization_name,
      contact_first_name,
      contact_last_name,
      contact_email,
      contact_phone: contact_phone || null,
      company_size: company_size || null,
      message: message || null,
      requested_plan_id: plan_id ? parseInt(plan_id) : null,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Your registration request has been received. Our team will review it and contact you within 1-2 business days.',
      data: { request_id: request.id }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

module.exports = router;
