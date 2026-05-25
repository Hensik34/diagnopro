require('dotenv').config();
const pool = require('./config/db');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, './db/migrations');
  const files = fs.readdirSync(migrationsDir);
  
  // Sort by the numeric prefix and handle duplicates with different suffixes
  const sortedFiles = files.sort((a, b) => {
    const aNum = parseInt(a.split('_')[0]);
    const bNum = parseInt(b.split('_')[0]);
    return aNum - bNum;
  });
  
  return sortedFiles;
}

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

async function setupDatabase() {
  try {
    console.log('🚀 Starting full database setup...\n');
    
    // Drop and recreate database
    console.log('📦 Recreating database...');
    try {
      await execPromise('dropdb -U hensik lab_management_db 2>/dev/null || true');
    } catch (e) {
      // Ignore errors if db doesn't exist
    }
    await execPromise('createdb -U hensik lab_management_db');
    console.log('✅ Database created\n');
    
    // Run all migrations in order
    console.log('🔄 Running migrations...\n');
    const migrations = await getMigrationFiles();
    
    // Skip the old duplicate seeders
    const skipMigrations = [
      '010_seed_default_tests.sql',
      '009_seed_test_fields.sql',
      '015_seed_calculated_field_formulas.sql'
    ];
    
    const filteredMigrations = migrations.filter(m => !skipMigrations.includes(m));
    let successCount = 0;
    
    for (const migration of filteredMigrations) {
      if (await runMigration(migration)) {
        successCount++;
      }
    }
    
    console.log(`\n✅ Migrations completed: ${successCount}/${migrations.length} successful`);
    
    if (successCount === migrations.length) {
      console.log('\n🎉 Database setup complete! Ready to start the server.');
      process.exit(0);
    } else {
      console.error('\n⚠️ Some migrations failed. Check the errors above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
