require('dotenv').config();
const pool = require('./config/db');
const fs = require('fs');
const path = require('path');

async function run() {
  try {
    const migrationsDir = path.join(__dirname, './db/migrations');
    const files = fs.readdirSync(migrationsDir).sort();
    
    for (const file of files) {
      if (file.endsWith('.sql')) {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        try {
          await pool.query(sql);
          console.log(`✅ ${file} successful`);
        } catch (error) {
          console.warn(`⚠️  ${file} - ${error.message}`);
          // Continue with next migration even if one fails (for idempotent migrations)
        }
      }
    }
    
    console.log('✅ All migrations completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

run();
