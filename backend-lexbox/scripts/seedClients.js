require('dotenv').config({ path: '../.env' });
const { Client, Dossier, User } = require('../src/models');
const sequelize = require('../src/config/database');

async function seedClients() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Get admin user ID for created_by
    const adminUser = await User.findOne({ where: { email: 'admin@lexbox.com' } });
    
    if (!adminUser) {
      console.log('❌ Admin user not found. Please run seedAdmin.js first.');
      process.exit(1);
    }

    console.log('🌱 Seeding sample clients...');

    // Create Client 1 - with dossier
    const client1 = await Client.create({
      first_name: 'John',
      last_name: 'Smith',
      personal_number: 'ID12345',
      email: 'john.smith@email.com',
      phone: '+1234567890',
      address: '123 Main St, New York, NY 10001',
      date_of_birth: '1985-03-15',
      status: 'active',
      created_by: adminUser.id
    });

    await Dossier.create({
      client_id: client1.id,
      dossier_number: 'DOS-2024-001',
      title: 'Property Dispute Case',
      description: 'Legal dispute regarding property ownership',
      legal_issue_type: 'property_law',
      status: 'in_progress',
      priority: 'high',
      assigned_to: adminUser.id,
      total_billed: 2500.00,
      total_paid: 1000.00,
      created_by: adminUser.id
    });

    console.log('✅ Created client: John Smith (DOS-2024-001)');

    // Create Client 2 - with dossier
    const client2 = await Client.create({
      first_name: 'Maria',
      last_name: 'Garcia',
      personal_number: 'ID67890',
      email: 'maria.garcia@email.com',
      phone: '+0987654321',
      address: '456 Oak Ave, Los Angeles, CA 90001',
      date_of_birth: '1990-07-22',
      status: 'active',
      created_by: adminUser.id
    });

    await Dossier.create({
      client_id: client2.id,
      dossier_number: 'DOS-2024-002',
      title: 'Immigration Case',
      description: 'Visa application and documentation',
      legal_issue_type: 'immigration',
      status: 'open',
      priority: 'medium',
      assigned_to: adminUser.id,
      total_billed: 1500.00,
      total_paid: 1500.00,
      created_by: adminUser.id
    });

    console.log('✅ Created client: Maria Garcia (DOS-2024-002)');

    // Create Client 3 - without dossier yet
    const client3 = await Client.create({
      first_name: 'Ahmed',
      last_name: 'Hassan',
      personal_number: 'ID11111',
      email: 'ahmed.hassan@email.com',
      phone: '+1122334455',
      address: '789 Pine Rd, Chicago, IL 60601',
      status: 'active',
      created_by: adminUser.id
    });

    console.log('✅ Created client: Ahmed Hassan (no dossier)');

    console.log('');
    console.log('✅ Sample data created successfully!');
    console.log('📊 Summary:');
    console.log('   - 3 clients created');
    console.log('   - 2 dossiers assigned');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedClients();