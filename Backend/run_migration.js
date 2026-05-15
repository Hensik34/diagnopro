require('dotenv').config();
const pool = require('./config/db');
const fs = require('fs');
const path = require('path');

async function run() {
  try {
    // Run initial schema migration
    const schemaPath = path.join(__dirname, './db/migrations/001_create_all_tables.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schemaSql);
    console.log('✅ Schema migration (001_create_all_tables.sql) successful');
    
    // You can add more migrations here in order:
    // const migration002Path = path.join(__dirname, './db/migrations/002_add_doctor_commission.sql');
    // const migration002Sql = fs.readFileSync(migration002Path, 'utf8');
    // await pool.query(migration002Sql);
    // console.log('✅ Migration 002 successful');
    
    console.log('✅ All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

run();
