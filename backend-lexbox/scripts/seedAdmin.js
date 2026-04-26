require('dotenv').config({ path: '../.env' });
const User = require('../src/models/User');
const sequelize = require('../src/config/database');

async function seedAdmin() {
  try {
    console.log('🔄 Connecting to database...');
    console.log('Host:', process.env.DB_HOST);
    console.log('Database:', process.env.DB_NAME);
    console.log('User:', process.env.DB_USER);
    
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Sync models (create tables if they don't exist)
    await sequelize.sync();
    console.log('✅ Database synced');
    
    const adminExists = await User.findOne({ where: { email: 'admin@lexbox.com' } });
    
    if (!adminExists) {
      const password_hash = await User.hashPassword('admin123');
      
      await User.create({
        username: 'admin',
        email: 'admin@lexbox.com',
        password_hash,
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin'
      });
      
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email: admin@lexbox.com');
      console.log('🔑 Password: admin123');
    } else {
      console.log('ℹ️  Admin user already exists');
    }
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

seedAdmin();