require('dotenv').config();
const pool = require('./config/db');
const fs = require('fs');

async function run() {
  const sql = fs.readFileSync('./db/migrations/025_remove_inventory_unit.sql', 'utf8');
  await pool.query(sql);
  console.log('Migration successful');
  process.exit(0);
}
run();
