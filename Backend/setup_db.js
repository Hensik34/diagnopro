require('dotenv').config();
const { runMigrations } = require('./db/init');

async function setupDatabase() {
  try {
    console.log('🚀 Running full DB setup (schema + seed)...\n');
    await runMigrations('all');
    console.log('🎉 Database setup complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
