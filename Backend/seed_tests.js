require('dotenv').config();
const pool = require('./config/db');
const fs = require('fs');
const path = require('path');

async function runMigration(fileName) {
  try {
    const filePath = path.join(__dirname, './db/migrations', fileName);
    const sql = fs.readFileSync(filePath, 'utf8');
    await pool.query(sql);
    console.log(`✅ ${fileName} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${fileName} failed:`, error.message);
    return false;
  }
}

async function run() {
  try {
    console.log('🚀 Starting test seed migrations...\n');
    
    // Run migrations in order
    const migrations = [
      '008_create_test_fields_table.sql',
      '010_seed_default_tests_fixed.sql',
      '009_seed_test_fields.sql',
      '015_seed_calculated_field_formulas.sql'
    ];
    
    let successCount = 0;
    for (const migration of migrations) {
      if (await runMigration(migration)) {
        successCount++;
      }
    }
    
    console.log(`\n✅ Seed migrations completed: ${successCount}/${migrations.length} successful`);
    process.exit(successCount === migrations.length ? 0 : 1);
  } catch (error) {
    console.error('❌ Seed migration script failed:', error.message);
    process.exit(1);
  }
}

run();
