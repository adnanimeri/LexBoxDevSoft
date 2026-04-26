// ===================================================================
// SEED SUPER ADMIN
// Run once: node scripts/seedSuperAdmin.js
// Creates the platform-level super admin account
// ===================================================================

require('dotenv').config({ path: '../.env' });
const User = require('../src/models/User');
const sequelize = require('../src/config/database');

async function seedSuperAdmin() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    await sequelize.sync({ alter: true });
    console.log('✅ Database synced');

    const existing = await User.findOne({ where: { role: 'super_admin' } });

    if (existing) {
      console.log('ℹ️  Super admin already exists:', existing.email);
      await sequelize.close();
      process.exit(0);
    }

    const password_hash = await User.hashPassword('SuperAdmin123!');

    const superAdmin = await User.create({
      username: 'superadmin',
      email: 'superadmin@lexbox.com',
      password_hash,
      first_name: 'Super',
      last_name: 'Admin',
      role: 'super_admin',
      is_org_admin: false,
      organization_id: null,
      is_active: true
    });

    console.log('✅ Super admin created!');
    console.log('📧 Email:    superadmin@lexbox.com');
    console.log('🔑 Password: SuperAdmin123!');
    console.log('⚠️  Change this password immediately after first login.');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedSuperAdmin();
