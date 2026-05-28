require('dotenv').config();
const { runSeedMigrations } = require('./db/init');

async function run() {
  try {
    await runSeedMigrations();
    console.log('✅ Test/field seed migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed migration script failed:', error.message);
    process.exit(1);
  }
}

run();
