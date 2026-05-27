require('dotenv').config();
const { runSchemaMigrations } = require('./db/init');

async function run() {
  try {
    await runSchemaMigrations();
    console.log('✅ Final schema migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

run();
