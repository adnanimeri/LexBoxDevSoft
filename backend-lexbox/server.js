require('dotenv').config();
const app = require('./src/app');
const sequelize = require('./src/config/database');
require('./src/models'); // ensure all models + associations are registered before sync

const PORT = process.env.PORT || 3001;

// Test database connection and start server
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync database models (creates tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized.');

    // Initialize default settings
    const settingsService = require('./src/services/settings.service');
    await settingsService.initializeDefaults();
    console.log('✅ Default settings initialized.');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 LexBox Backend running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

startServer();
/*
require('dotenv').config();
const app = require('./src/app');
const sequelize = require('./src/config/database');

const PORT = process.env.PORT || 3001;

// Test database connection and start server
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync database models (creates tables if they don't exist)
    // Use { force: true } to drop and recreate tables (ONLY in development)
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized.');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 LexBox Backend running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

startServer();
*/