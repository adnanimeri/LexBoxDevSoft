// ===================================================================
// SEED SUBSCRIPTION PLANS
// Run once: node scripts/seedPlans.js
// ===================================================================

require('dotenv').config({ path: '../.env' });
const SubscriptionPlan = require('../src/models/SubscriptionPlan');
const sequelize = require('../src/config/database');

const plans = [
  {
    name: 'Starter',
    code: 'starter',
    description: 'Perfect for solo practitioners and small firms getting started.',
    price_monthly: 29.00,
    price_yearly: 290.00,
    max_users: 2,
    max_storage_gb: 10,
    max_clients: 50,
    max_dossiers: 100,
    features: {
      document_encryption: true,
      email_invoices: true,
      pdf_export: true,
      api_access: false,
      priority_support: false,
      custom_branding: false,
      audit_logs: false
    },
    is_active: true,
    sort_order: 1
  },
  {
    name: 'Professional',
    code: 'professional',
    description: 'For growing firms that need more users, storage, and advanced features.',
    price_monthly: 79.00,
    price_yearly: 790.00,
    max_users: 5,
    max_storage_gb: 50,
    max_clients: null,      // unlimited
    max_dossiers: null,     // unlimited
    features: {
      document_encryption: true,
      email_invoices: true,
      pdf_export: true,
      api_access: false,
      priority_support: true,
      custom_branding: false,
      audit_logs: true
    },
    is_active: true,
    sort_order: 2
  },
  {
    name: 'Enterprise',
    code: 'enterprise',
    description: 'For large firms requiring unlimited users, maximum storage, and full feature access.',
    price_monthly: 199.00,
    price_yearly: 1990.00,
    max_users: 999,         // effectively unlimited
    max_storage_gb: 500,
    max_clients: null,
    max_dossiers: null,
    features: {
      document_encryption: true,
      email_invoices: true,
      pdf_export: true,
      api_access: true,
      priority_support: true,
      custom_branding: true,
      audit_logs: true
    },
    is_active: true,
    sort_order: 3
  }
];

async function seedPlans() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    await sequelize.sync({ alter: true });

    for (const plan of plans) {
      const [record, created] = await SubscriptionPlan.findOrCreate({
        where: { code: plan.code },
        defaults: plan
      });

      if (created) {
        console.log(`✅ Created plan: ${plan.name} (${plan.max_users} users, ${plan.max_storage_gb}GB) — €${plan.price_monthly}/mo`);
      } else {
        console.log(`ℹ️  Plan already exists: ${plan.name}`);
      }
    }

    console.log('\n📋 Plans summary:');
    console.log('  Starter      — 2 users,   10GB  — €29/mo');
    console.log('  Professional — 5 users,   50GB  — €79/mo');
    console.log('  Enterprise   — unlimited, 500GB — €199/mo');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedPlans();
