// ===================================================================
// ORG ROUTES  —  /api/org/*
// Authenticated org-admin operations (trial status, upgrade request)
// ===================================================================

const express = require('express');
const router  = express.Router();
const { Op }  = require('sequelize');
const { authenticate, requireOrg, authorize } = require('../middleware/auth.middleware');
const { Organization, SubscriptionPlan, User } = require('../models');
const emailService = require('../services/email.service');

router.use(authenticate, requireOrg);

// ── GET /api/org/trial-status ─────────────────────────────────────
// Returns the org's subscription status + days remaining in trial
router.get('/trial-status', async (req, res) => {
  try {
    const org = await Organization.findByPk(req.user.organization_id, {
      attributes: { exclude: ['encryption_salt'] },
      include: [{ model: SubscriptionPlan, as: 'subscriptionPlan' }]
    });

    const now      = new Date();
    const trialEnd = org.trial_ends_at ? new Date(org.trial_ends_at) : null;
    const daysLeft = trialEnd ? Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)) : null;

    res.json({
      success: true,
      data: {
        subscription_status: org.subscription_status,
        org_status:          org.status,
        trial_ends_at:       org.trial_ends_at,
        days_left:           daysLeft,
        plan:                org.subscriptionPlan
          ? { id: org.subscriptionPlan.id, name: org.subscriptionPlan.name, price_monthly: org.subscriptionPlan.price_monthly }
          : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

// ── POST /api/org/upgrade-request ────────────────────────────────
// Org admin confirms upgrade — immediately activates subscription and notifies super admin
router.post('/upgrade-request', async (req, res) => {
  try {
    const admin = req.user;
    const { plan_id, message } = req.body;

    // Resolve chosen plan or fall back to current plan
    const org = await Organization.findByPk(req.user.organization_id, {
      include: [{ model: SubscriptionPlan, as: 'subscriptionPlan' }]
    });

    let chosenPlan = org.subscriptionPlan;
    if (plan_id) {
      const found = await SubscriptionPlan.findByPk(plan_id);
      if (found) chosenPlan = found;
    }

    // Immediately activate — subscription_status → active, update plan if changed
    await org.update({
      subscription_status: 'active',
      subscription_started_at: new Date(),
      ...(chosenPlan ? { subscription_plan_id: chosenPlan.id } : {}),
      metadata: { ...(org.metadata || {}), invoice_pending: true, upgraded_at: new Date().toISOString() }
    });

    // Notify super admin (fire-and-forget)
    const superAdmin = await User.findOne({ where: { role: 'super_admin', is_active: true } });
    if (superAdmin) {
      try {
        await emailService.ensureInitialized();
        await emailService.transporter.sendMail({
          from:    `"LexBox Platform" <${emailService.fromEmail}>`,
          to:      superAdmin.email,
          subject: `New paid subscription — ${org.name}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
              <div style="background:#16a34a;color:white;padding:20px;border-radius:8px 8px 0 0;">
                <h2 style="margin:0;">New Paid Subscription</h2>
              </div>
              <div style="background:#f8fafc;padding:20px;border:1px solid #e2e8f0;">
                <p><strong>${org.name}</strong> has upgraded to a paid plan.</p>
                <table style="width:100%;font-size:14px;border-collapse:collapse;">
                  <tr><td style="color:#64748b;padding:4px 0;">Organization</td><td><strong>${org.name}</strong></td></tr>
                  <tr><td style="color:#64748b;padding:4px 0;">Contact</td><td>${admin.first_name} ${admin.last_name} — ${admin.email}</td></tr>
                  <tr><td style="color:#64748b;padding:4px 0;">Plan</td><td><strong>${chosenPlan?.name || 'N/A'}</strong> — €${chosenPlan?.price_monthly || 0}/mo</td></tr>
                  ${message ? `<tr><td style="color:#64748b;padding:4px 0;vertical-align:top;">Message</td><td><em>${message}</em></td></tr>` : ''}
                </table>
                <p style="margin-top:16px;font-size:13px;color:#475569;">Please send the first invoice to <strong>${admin.email}</strong> at the start of the next billing month.</p>
              </div>
            </div>
          `
        });
      } catch (mailErr) {
        console.error('[Upgrade] Email to super admin failed:', mailErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Your subscription is now active. You will receive your first invoice at the start of next month.',
      data: { subscription_status: 'active', plan: chosenPlan ? { id: chosenPlan.id, name: chosenPlan.name } : null }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

// ── GET /api/org/profile ─────────────────────────────────────────
// All authenticated users — returns this org's company info fields
router.get('/profile', async (req, res) => {
  try {
    const org = await Organization.findByPk(req.user.organization_id, {
      attributes: ['name', 'email', 'phone', 'address', 'website', 'tax_id']
    });
    if (!org) return res.status(404).json({ success: false, message: 'Organisation not found' });
    res.json({ success: true, data: org });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load organisation profile' });
  }
});

// ── PATCH /api/org/profile ────────────────────────────────────────
// Admin only — update company info stored on the Organisation record
router.patch('/profile', authorize(['admin']), async (req, res) => {
  try {
    const org = await Organization.findByPk(req.user.organization_id);
    if (!org) return res.status(404).json({ success: false, message: 'Organisation not found' });

    const allowed = ['name', 'email', 'phone', 'address', 'website', 'tax_id'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key] || null;
    }
    // name must not be empty — keep old value if blank submitted
    if (updates.name === null) delete updates.name;

    await org.update(updates);
    res.json({ success: true, data: org, message: 'Company profile updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update organisation profile' });
  }
});

// ── GET /api/org/permissions ──────────────────────────────────────
// All authenticated users — lets the frontend know which secretary
// permissions are active for their org.
router.get('/permissions', async (req, res) => {
  try {
    const org = await Organization.findByPk(req.user.organization_id, { attributes: ['settings'] });
    if (!org) return res.status(404).json({ success: false, message: 'Organisation not found' });
    const s = org.settings || {};
    res.json({
      success: true,
      data: {
        secretary_can_create_clients: !!s.secretary_can_create_clients,
        secretary_can_access_billing: !!s.secretary_can_access_billing,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load permissions' });
  }
});

// ── PATCH /api/org/permissions ────────────────────────────────────
// Admin only — toggle secretary permissions.
router.patch('/permissions', authorize(['admin']), async (req, res) => {
  try {
    const org = await Organization.findByPk(req.user.organization_id);
    if (!org) return res.status(404).json({ success: false, message: 'Organisation not found' });

    const allowed = ['secretary_can_create_clients', 'secretary_can_access_billing'];
    const updates = {};
    for (const key of allowed) {
      if (typeof req.body[key] === 'boolean') updates[key] = req.body[key];
    }

    await org.update({ settings: { ...(org.settings || {}), ...updates } });
    res.json({ success: true, message: 'Permissions updated', data: org.settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update permissions' });
  }
});

module.exports = router;
