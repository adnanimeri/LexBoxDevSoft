require('dotenv').config();
const sequelize = require('./src/config/database');

async function check() {
  try {
    await sequelize.authenticate();

    const [results] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('invoices','invoice_line_items','payments')"
    );

    console.log('Billing tables:', results);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sequelize.close();   // better than process.exit()
  }
}

check();
