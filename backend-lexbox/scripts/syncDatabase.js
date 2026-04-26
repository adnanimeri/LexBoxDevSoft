//require('dotenv').config();

require('dotenv').config({ path: '../.env' });
const sequelize = require('../src/config/database');
const { User, Client, Dossier } = require('../src/models');


// DEBUG: Print connection details
/*
console.log('🔍 Debug Info:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD === '' ? '(empty string)' : process.env.DB_PASSWORD);
console.log('DB_PASSWORD type:', typeof process.env.DB_PASSWORD);
console.log('');
*/

async function syncDatabase() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    console.log('🔄 Syncing database models...');
    
    await sequelize.sync({ alter: true });
    
    console.log('✅ Database synced successfully!');
    console.log('');
    console.log('📊 Tables created/updated:');
    console.log('   - users');
    console.log('   - clients');
    console.log('   - dossiers');
    console.log('');
    console.log('✅ Phase 2 database setup complete!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Database sync failed:', error);
    process.exit(1);
  }
}

syncDatabase();
