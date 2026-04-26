// ===================================================================
// TRIAL SCHEDULER
// Runs daily at 08:00 and handles:
//   1. 3-day warning email before trial ends
//   2. Trial expiry → suspend org + email
//   3. 1st of month → invoice active subscribers by email
// ===================================================================

const cron = require('node-cron');
const { Op } = require('sequelize');
const { Organization, User, SubscriptionPlan } = require('../models');
const emailService = require('./email.service');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const UPGRADE_URL  = `${FRONTEND_URL}/upgrade`;

// ── helpers ──────────────────────────────────────────────────────────

/**
 * Get the primary admin contact for an org
 */
async function getOrgAdmin(orgId) {
  return User.findOne({
    where: { organization_id: orgId, is_org_admin: true, is_active: true },
    order: [['created_at', 'ASC']]
  });
}

function daysBetween(a, b) {
  return Math.ceil((new Date(a) - new Date(b)) / (1000 * 60 * 60 * 24));
}

// ── Job 1: Trial warnings & expiry (daily 08:00) ──────────────────

async function runTrialCheck() {
  console.log('[Scheduler] Running trial check...');
  const now = new Date();

  const trialOrgs = await Organization.findAll({
    where: {
      subscription_status: 'trial',
      trial_ends_at: { [Op.ne]: null },
      status: 'active'
    },
    include: [{ model: SubscriptionPlan, as: 'subscriptionPlan' }]
  });

  for (const org of trialOrgs) {
    const daysLeft = daysBetween(org.trial_ends_at, now);
    const admin = await getOrgAdmin(org.id);
    if (!admin) continue;

    if (daysLeft === 3 || daysLeft === 1) {
      // Warning email
      try {
        await emailService.sendTrialWarningEmail({
          toEmail:     admin.email,
          firstName:   admin.first_name,
          orgName:     org.name,
          trialEndsAt: org.trial_ends_at,
          daysLeft,
          upgradeUrl:  UPGRADE_URL
        });
        console.log(`[Scheduler] Trial warning (${daysLeft}d) sent → ${admin.email}`);
      } catch (e) {
        console.error(`[Scheduler] Warning email failed for org ${org.id}:`, e.message);
      }
    }

    if (daysLeft <= 0) {
      // Trial expired — suspend
      try {
        await org.update({ subscription_status: 'past_due', status: 'suspended' });
        await emailService.sendTrialExpiredEmail({
          toEmail:      admin.email,
          firstName:    admin.first_name,
          orgName:      org.name,
          planName:     org.subscriptionPlan?.name,
          priceMonthly: org.subscriptionPlan?.price_monthly,
          upgradeUrl:   UPGRADE_URL
        });
        console.log(`[Scheduler] Trial expired → org ${org.id} suspended, email sent`);
      } catch (e) {
        console.error(`[Scheduler] Expiry handling failed for org ${org.id}:`, e.message);
      }
    }
  }
}

// ── Job 2: First-of-month subscription invoice email ─────────────

async function runMonthlyBilling() {
  console.log('[Scheduler] Running monthly billing...');

  const activeOrgs = await Organization.findAll({
    where: { subscription_status: 'active', status: 'active' },
    include: [{ model: SubscriptionPlan, as: 'subscriptionPlan' }]
  });

  const now        = new Date();
  const billingMonth = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  for (const org of activeOrgs) {
    const plan  = org.subscriptionPlan;
    if (!plan)  continue;

    const admin = await getOrgAdmin(org.id);
    if (!admin) continue;

    const invoiceRef = `LBX-${org.id.slice(0, 6).toUpperCase()}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

    try {
      await emailService.sendSubscriptionInvoiceEmail({
        toEmail:      admin.email,
        firstName:    admin.first_name,
        orgName:      org.name,
        planName:     plan.name,
        priceMonthly: plan.price_monthly,
        billingMonth,
        invoiceRef
      });
      console.log(`[Scheduler] Invoice email sent → org ${org.id} (${invoiceRef})`);
    } catch (e) {
      console.error(`[Scheduler] Invoice email failed for org ${org.id}:`, e.message);
    }
  }
}

// ── Register cron jobs ────────────────────────────────────────────

function startScheduler() {
  // Daily at 08:00 — trial warnings & expiry
  cron.schedule('0 8 * * *', runTrialCheck, { timezone: 'Europe/Luxembourg' });

  // 1st of every month at 08:00 — subscription invoices
  cron.schedule('0 8 1 * *', runMonthlyBilling, { timezone: 'Europe/Luxembourg' });

  console.log('[Scheduler] Trial & billing jobs registered');
}

module.exports = { startScheduler, runTrialCheck, runMonthlyBilling };
