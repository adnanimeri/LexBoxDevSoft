// ===================================================================
// SUPER ADMIN CONTROLLER
// Platform-level operations: org requests, org management, subscriptions
// All routes require role = 'super_admin'
// ===================================================================

const crypto = require('crypto');
const { Op } = require('sequelize');
const emailService = require('../services/email.service');
const sequelize = require('../config/database');
const {
  Organization,
  OrganizationRequest,
  SubscriptionPlan,
  User,
  Client,
  Dossier,
  Document,
  Invoice,
  SubscriptionInvoice
} = require('../models');
const pdfService   = require('../services/pdf.service');
const bcrypt = require('bcrypt');

// ===================================================================
// ORGANIZATION REQUESTS
// ===================================================================

/**
 * GET /api/super/org-requests
 * List all org signup requests (filterable by status)
 */
const listOrgRequests = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status !== 'all') where.status = status;

    const { count, rows } = await OrganizationRequest.findAndCountAll({
      where,
      include: [{ model: User, as: 'reviewer', attributes: ['id', 'first_name', 'last_name', 'email'] }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        requests: rows,
        pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

/**
 * POST /api/super/org-requests/:id/approve
 * Approve an org request → creates Organization + first admin user + sends credentials
 */
const approveOrgRequest = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const request = await OrganizationRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Request not found' } });
    if (request.status !== 'pending') return res.status(400).json({ success: false, error: { code: 'ALREADY_REVIEWED', message: 'Request already reviewed' } });

    const { plan_id, review_notes } = req.body;

    // Resolve plan: admin pick > firm's requested plan > default starter
    const resolvedPlanId = plan_id || request.requested_plan_id;
    const plan = resolvedPlanId
      ? await SubscriptionPlan.findByPk(resolvedPlanId)
      : await SubscriptionPlan.findOne({ where: { code: 'starter' } });

    // Create the organization
    const org = await Organization.create({
      name: request.organization_name,
      email: request.contact_email,
      phone: request.contact_phone,
      subscription_plan_id: plan?.id || null,
      subscription_status: 'trial',
      status: 'active'
    }, { transaction });

    // Generate a temporary password for the first admin
    const tempPassword = crypto.randomBytes(10).toString('base64url');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Build username from firstname.lastname — unique suffix only if collision exists
    const baseUsername = `${request.contact_first_name}.${request.contact_last_name}`
      .replace(/[^a-z0-9.]/gi, '').toLowerCase();
    const taken = await User.findOne({ where: { username: baseUsername }, transaction });
    const username = taken
      ? `${baseUsername}_${crypto.randomBytes(3).toString('hex')}`
      : baseUsername;

    // If a user with this email already exists (orphaned from a prior failed attempt), reuse it
    let adminUser = await User.findOne({ where: { email: request.contact_email }, transaction });
    if (adminUser) {
      await adminUser.update({
        organization_id: org.id,
        username,
        password_hash: passwordHash,
        first_name: request.contact_first_name,
        last_name: request.contact_last_name,
        role: 'admin',
        is_org_admin: true,
        is_active: true
      }, { transaction });
    } else {
      adminUser = await User.create({
        organization_id: org.id,
        username,
        email: request.contact_email,
        password_hash: passwordHash,
        first_name: request.contact_first_name,
        last_name: request.contact_last_name,
        role: 'admin',
        is_org_admin: true,
        is_active: true
      }, { transaction });
    }

    // Mark request as approved
    await request.update({
      status: 'approved',
      reviewed_by: req.user.id,
      reviewed_at: new Date(),
      review_notes: review_notes || null,
      organization_id: org.id
    }, { transaction });

    await transaction.commit();

    // Send welcome email with credentials — outside transaction so a mail failure doesn't roll back the org
    let emailSent = false;
    try {
      await emailService.sendWelcomeEmail({
        toEmail:     request.contact_email,
        firstName:   request.contact_first_name,
        lastName:    request.contact_last_name,
        orgName:     org.name,
        planName:    plan?.name,
        tempPassword,
        loginUrl:    process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/login` : null
      });
      emailSent = true;
    } catch (mailError) {
      // Log but don't fail — org is already created
      console.error('Welcome email failed:', mailError.message);
    }

    res.status(201).json({
      success: true,
      message: emailSent
        ? 'Organization approved. Welcome email with credentials sent.'
        : 'Organization approved. Email delivery failed — share credentials manually.',
      data: {
        organization: { id: org.id, name: org.name, slug: org.slug },
        admin: { id: adminUser.id, email: adminUser.email },
        email_sent: emailSent,
        temp_password: tempPassword  // always returned so super admin can share manually if email fails
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Approve org request failed:', error);
    const message = error.name === 'SequelizeUniqueConstraintError'
      ? `Unique constraint violation on: ${error.errors?.map(e => e.path).join(', ')}`
      : error.name === 'SequelizeValidationError'
      ? error.errors?.map(e => e.message).join(', ')
      : error.message;
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message } });
  }
};

/**
 * POST /api/super/org-requests/:id/reject
 */
const rejectOrgRequest = async (req, res) => {
  try {
    const request = await OrganizationRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Request not found' } });
    if (request.status !== 'pending') return res.status(400).json({ success: false, error: { code: 'ALREADY_REVIEWED', message: 'Request already reviewed' } });

    await request.update({
      status: 'rejected',
      reviewed_by: req.user.id,
      reviewed_at: new Date(),
      review_notes: req.body.review_notes || null
    });

    res.json({ success: true, message: 'Request rejected' });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

// ===================================================================
// ORGANIZATION MANAGEMENT
// ===================================================================

/**
 * GET /api/super/organizations
 * List all organizations with stats — no access to their actual data
 */
const listOrganizations = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;

    const { count, rows } = await Organization.findAndCountAll({
      where,
      include: [{ model: SubscriptionPlan, as: 'subscriptionPlan', attributes: ['id', 'name', 'code', 'max_users', 'max_storage_gb'] }],
      attributes: { exclude: ['encryption_salt'] }, // never expose the salt
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    // Attach lightweight stats (counts only — no document content)
    const orgsWithStats = await Promise.all(rows.map(async (org) => {
      const [userCount, clientCount, dossierCount, documentCount] = await Promise.all([
        User.count({ where: { organization_id: org.id } }),
        Client.count({ where: { organization_id: org.id } }),
        Dossier.count({ where: { organization_id: org.id } }),
        Document.count({ where: { organization_id: org.id } })
      ]);

      return {
        ...org.toJSON(),
        stats: { users: userCount, clients: clientCount, dossiers: dossierCount, documents: documentCount }
      };
    }));

    res.json({
      success: true,
      data: {
        organizations: orgsWithStats,
        pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

/**
 * GET /api/super/organizations/:id/stats
 * Detailed stats for one org — counts and storage only, never document content
 */
const getOrgStats = async (req, res) => {
  try {
    const org = await Organization.findByPk(req.params.id, {
      attributes: { exclude: ['encryption_salt'] },
      include: [{ model: SubscriptionPlan, as: 'subscriptionPlan' }]
    });
    if (!org) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Organization not found' } });

    const [userCount, clientCount, dossierCount, documentCount, invoiceCount] = await Promise.all([
      User.count({ where: { organization_id: org.id } }),
      Client.count({ where: { organization_id: org.id } }),
      Dossier.count({ where: { organization_id: org.id } }),
      Document.count({ where: { organization_id: org.id } }),
      Invoice.count({ where: { organization_id: org.id } })
    ]);

    const storageUsedMB = Math.round(org.storage_used_bytes / (1024 * 1024));
    const storageLimitMB = (org.subscriptionPlan?.max_storage_gb || 0) * 1024;

    res.json({
      success: true,
      data: {
        organization: org,
        stats: {
          users: userCount,
          clients: clientCount,
          dossiers: dossierCount,
          documents: documentCount,
          invoices: invoiceCount,
          storage: {
            used_mb: storageUsedMB,
            limit_mb: storageLimitMB,
            used_percent: storageLimitMB > 0 ? Math.round((storageUsedMB / storageLimitMB) * 100) : 0
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

/**
 * PATCH /api/super/organizations/:id/status
 * Suspend, activate, or delete an organization
 */
const updateOrgStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['active', 'suspended', 'deleted'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: `Status must be one of: ${allowed.join(', ')}` } });
    }

    const org = await Organization.findByPk(req.params.id);
    if (!org) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Organization not found' } });

    await org.update({ status });
    res.json({ success: true, message: `Organization ${status}`, data: { id: org.id, status: org.status } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

// ===================================================================
// SUBSCRIPTION MANAGEMENT
// ===================================================================

/**
 * GET /api/super/plans
 */
const listPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll({ order: [['sort_order', 'ASC']] });
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

/**
 * POST /api/super/plans
 */
const createPlan = async (req, res) => {
  try {
    const { name, code, description, price_monthly, price_yearly, max_users, max_storage_gb, max_clients, max_dossiers, features, sort_order } = req.body;

    const plan = await SubscriptionPlan.create({
      name, code, description,
      price_monthly: price_monthly || 0,
      price_yearly: price_yearly || 0,
      max_users: max_users || 5,
      max_storage_gb: max_storage_gb || 10,
      max_clients: max_clients || null,
      max_dossiers: max_dossiers || null,
      features: features || {},
      sort_order: sort_order || 0
    });

    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

/**
 * PATCH /api/super/plans/:id
 */
const updatePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Plan not found' } });

    const allowed = ['name', 'description', 'price_monthly', 'price_yearly', 'max_users', 'max_storage_gb', 'max_clients', 'max_dossiers', 'features', 'is_active', 'sort_order'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    await plan.update(updates);
    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

/**
 * PATCH /api/super/organizations/:id/subscription
 * Change an org's plan or subscription status
 */
const updateOrgSubscription = async (req, res) => {
  try {
    const org = await Organization.findByPk(req.params.id);
    if (!org) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Organization not found' } });

    const { plan_id, subscription_status, billing_cycle, subscription_expires_at } = req.body;

    const updates = {};
    if (plan_id !== undefined) updates.subscription_plan_id = plan_id;
    if (subscription_status !== undefined) updates.subscription_status = subscription_status;
    if (billing_cycle !== undefined) updates.billing_cycle = billing_cycle;
    if (subscription_expires_at !== undefined) updates.subscription_expires_at = subscription_expires_at;

    await org.update(updates);

    const updated = await Organization.findByPk(org.id, {
      attributes: { exclude: ['encryption_salt'] },
      include: [{ model: SubscriptionPlan, as: 'subscriptionPlan' }]
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

/**
 * GET /api/super/dashboard
 * Platform-wide aggregate stats for the super admin dashboard
 */
const getDashboardStats = async (req, res) => {
  try {
    const [totalOrgs, activeOrgs, trialOrgs, suspendedOrgs, totalUsers, pendingRequests, totalPlans, pendingInvoices] = await Promise.all([
      Organization.count(),
      Organization.count({ where: { subscription_status: 'active' } }),
      Organization.count({ where: { subscription_status: 'trial' } }),
      Organization.count({ where: { status: 'suspended' } }),
      User.count({ where: { role: { [Op.ne]: 'super_admin' } } }),
      OrganizationRequest.count({ where: { status: 'pending' } }),
      SubscriptionPlan.count({ where: { is_active: true } }),
      SubscriptionInvoice.count({ where: { status: 'sent' } })
    ]);

    res.json({
      success: true,
      data: {
        organizations: { total: totalOrgs, active: activeOrgs, trial: trialOrgs, suspended: suspendedOrgs },
        users: { total: totalUsers },
        requests: { pending: pendingRequests },
        plans: { active: totalPlans },
        invoices: { pending: pendingInvoices }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

/**
 * PATCH /api/super/organizations/:id/mark-invoiced
 * Super admin marks an org as invoiced — clears the invoice_pending flag
 */
const markInvoiced = async (req, res) => {
  try {
    const org = await Organization.findByPk(req.params.id);
    if (!org) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Organization not found' } });

    await org.update({
      metadata: { ...(org.metadata || {}), invoice_pending: false, last_invoiced_at: new Date().toISOString() }
    });

    res.json({ success: true, message: 'Marked as invoiced' });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

// ===================================================================
// PLATFORM SETTINGS (SMTP / Email)
// ===================================================================

const settingsService = require('../services/settings.service');

const SMTP_KEYS = ['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass', 'smtp_from'];

/**
 * GET /api/super/settings
 * Return current SMTP settings (password masked)
 */
const getPlatformSettings = async (req, res) => {
  try {
    const settings = {};
    for (const key of SMTP_KEYS) {
      const raw = await settingsService.get(key, '');
      settings[key] = key === 'smtp_pass' ? (raw ? '••••••••' : '') : raw;
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

/**
 * PUT /api/super/settings
 * Save SMTP settings. Blank smtp_pass = keep existing.
 */
const updatePlatformSettings = async (req, res) => {
  try {
    const keysToUpdate = SMTP_KEYS.filter(k => {
      // Skip password if blank (keep existing)
      if (k === 'smtp_pass' && !req.body[k]) return false;
      return req.body[k] !== undefined;
    });

    for (const key of keysToUpdate) {
      await settingsService.set(key, req.body[key], {
        category: 'email',
        is_sensitive: key === 'smtp_pass'
      });
    }

    // Force email service to reload with new config
    emailService.initialized = false;

    res.json({ success: true, message: 'SMTP settings saved' });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

/**
 * POST /api/super/settings/test-email
 * Send a test email using current SMTP config
 */
const testPlatformEmail = async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ success: false, error: { code: 'MISSING_TO', message: 'Recipient email is required' } });

    // Force reload so we use latest saved settings
    emailService.initialized = false;
    await emailService.sendTestEmail(to);

    res.json({ success: true, message: `Test email sent to ${to}` });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SMTP_ERROR', message: error.message } });
  }
};

module.exports = {
  listOrgRequests,
  approveOrgRequest,
  rejectOrgRequest,
  listOrganizations,
  getOrgStats,
  updateOrgStatus,
  listPlans,
  createPlan,
  updatePlan,
  updateOrgSubscription,
  getDashboardStats,
  markInvoiced,
  getPlatformSettings,
  updatePlatformSettings,
  testPlatformEmail,
  listSubscriptionInvoices,
  createSubscriptionInvoice,
  sendSubscriptionInvoice,
  markSubscriptionInvoicePaid,
  downloadSubscriptionInvoicePdf,
  deleteSubscriptionInvoice
};

// ===================================================================
// SUBSCRIPTION INVOICES  (platform billing → organizations)
// ===================================================================

/**
 * GET /api/super/subscription-invoices
 * List all subscription invoices, optionally filtered by org
 */
async function listSubscriptionInvoices(req, res) {
  try {
    const where = {};
    if (req.query.organization_id) where.organization_id = req.query.organization_id;
    if (req.query.status)          where.status          = req.query.status;

    const invoices = await SubscriptionInvoice.findAll({
      where,
      include: [{ model: Organization, as: 'organization', attributes: ['id', 'name', 'email'] }],
      order: [['created_at', 'DESC']],
      limit: 100
    });
    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
}

/**
 * POST /api/super/subscription-invoices
 * Generate a new subscription invoice for an org.
 * Body: { organization_id, tax_rate?, notes?, payment_terms?, due_days? }
 * Period is auto-calculated from billing_cycle + subscription_started_at.
 */
async function createSubscriptionInvoice(req, res) {
  try {
    const { organization_id, tax_rate = 0, notes, payment_terms, due_days = 30 } = req.body;

    const org = await Organization.findByPk(organization_id, {
      include: [{ model: SubscriptionPlan, as: 'subscriptionPlan' }]
    });
    if (!org) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Organization not found' } });

    const plan  = org.subscriptionPlan;
    const cycle = org.billing_cycle || 'monthly';

    // Calculate period
    const base        = org.subscription_started_at ? new Date(org.subscription_started_at) : new Date();
    const periodStart = new Date(base);
    const periodEnd   = new Date(base);
    if (cycle === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      periodEnd.setDate(periodEnd.getDate() - 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      periodEnd.setDate(periodEnd.getDate() - 1);
    }

    const price    = cycle === 'yearly'
      ? parseFloat(plan?.price_yearly  || 0)
      : parseFloat(plan?.price_monthly || 0);
    const taxAmt   = parseFloat((price * tax_rate / 100).toFixed(2));
    const total    = parseFloat((price + taxAmt).toFixed(2));

    // Sequential invoice number: SUB-YYYY-NNNN
    const count  = await SubscriptionInvoice.count();
    const num    = String(count + 1).padStart(4, '0');
    const invNum = `SUB-${new Date().getFullYear()}-${num}`;

    const issueDate = new Date();
    const dueDate   = new Date();
    dueDate.setDate(dueDate.getDate() + due_days);

    const invoice = await SubscriptionInvoice.create({
      organization_id,
      invoice_number: invNum,
      plan_name:      plan?.name || 'Subscription',
      billing_cycle:  cycle,
      period_start:   periodStart.toISOString().split('T')[0],
      period_end:     periodEnd.toISOString().split('T')[0],
      issue_date:     issueDate.toISOString().split('T')[0],
      due_date:       dueDate.toISOString().split('T')[0],
      subtotal:       price,
      tax_rate:       parseFloat(tax_rate),
      tax_amount:     taxAmt,
      total_amount:   total,
      notes,
      payment_terms:  payment_terms || 'Payment due within 30 days',
      status:         'draft',
      created_by:     req.user.id
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
}

/**
 * POST /api/super/subscription-invoices/:id/send
 * Generate PDF, email it to the org, set status → sent.
 */
async function sendSubscriptionInvoice(req, res) {
  try {
    const invoice = await SubscriptionInvoice.findByPk(req.params.id, {
      include: [{ model: Organization, as: 'organization' }]
    });
    if (!invoice) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } });

    const org = invoice.organization;
    const pdf = await pdfService.generateSubscriptionInvoicePDF(invoice, org);
    await emailService.sendSubscriptionInvoiceEmail(invoice, org, pdf);
    await invoice.update({ status: 'sent' });

    // Clear invoice_pending flag on org
    await org.update({ metadata: { ...(org.metadata || {}), invoice_pending: false, last_invoiced_at: new Date().toISOString() } });

    res.json({ success: true, message: `Invoice sent to ${org.email}` });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
}

/**
 * PATCH /api/super/subscription-invoices/:id/mark-paid
 * Mark a subscription invoice as paid.
 */
async function markSubscriptionInvoicePaid(req, res) {
  try {
    const invoice = await SubscriptionInvoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } });

    const { payment_date, payment_method, reference_number, notes } = req.body;

    await invoice.update({
      status:             'paid',
      paid_at:            payment_date ? new Date(payment_date) : new Date(),
      payment_method:     payment_method    || null,
      payment_reference:  reference_number  || null,
      payment_notes:      notes             || null
    });
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
}

/**
 * GET /api/super/subscription-invoices/:id/pdf
 * Stream the PDF for download.
 */
async function downloadSubscriptionInvoicePdf(req, res) {
  try {
    const invoice = await SubscriptionInvoice.findByPk(req.params.id, {
      include: [{ model: Organization, as: 'organization' }]
    });
    if (!invoice) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } });

    const pdf = await pdfService.generateSubscriptionInvoicePDF(invoice, invoice.organization);
    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="Invoice-${invoice.invoice_number}.pdf"`,
      'Content-Length':      pdf.length
    });
    res.end(pdf);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
}

/**
 * DELETE /api/super/subscription-invoices/:id
 * Delete a draft invoice only (cannot delete sent/paid).
 */
async function deleteSubscriptionInvoice(req, res) {
  try {
    const invoice = await SubscriptionInvoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } });

    if (invoice.status !== 'draft') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Only draft invoices can be deleted' } });
    }

    await invoice.destroy();
    res.json({ success: true, message: 'Invoice deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
}
