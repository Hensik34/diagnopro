require('dotenv').config();
const { runMigrations } = require('./db/init');
const pool = require('./config/db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function setupDatabase() {
  try {
    console.log('🚀 Starting complete DB setup (schema + seed + verification)...\n');
    
    // Step 1: Run all migrations
    console.log('📊 Step 1: Running migrations (001, 006, 007)...');
    await runMigrations('all');
    console.log('✅ Migrations completed\n');

    // Step 2: Ensure default branch exists
    console.log('📍 Step 2: Verifying default branch...');
    const branchResult = await pool.query('SELECT id FROM branches LIMIT 1');
    let branchId = branchResult.rows[0]?.id;
    
    if (!branchId) {
      const newBranch = await pool.query(
        `INSERT INTO branches (id, name, location, city, phone, email, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING id`,
        [uuidv4(), 'Main Branch', 'Headquarters', 'Primary City', '+91-9999999999', 'main@lab.com']
      );
      branchId = newBranch.rows[0].id;
      console.log(`✅ Created default branch: ${branchId}\n`);
    } else {
      console.log(`✅ Default branch exists: ${branchId}\n`);
    }

    // Step 3: Create admin user
    console.log('👤 Step 3: Setting up admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const userResult = await pool.query(
      `INSERT INTO users (id, email, password_hash, role, firstname, lastname, phone, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [uuidv4(), 'admin@lab.com', hashedPassword, 'admin', 'Admin', 'User', '9999999999']
    );

    if (userResult.rows.length > 0) {
      console.log(`✅ Admin user created - Email: admin@lab.com, Password: admin123\n`);
    } else {
      console.log(`✅ Admin user already exists - Email: admin@lab.com\n`);
    }

    // Step 4: Verify all tests are seeded
    console.log('📋 Step 4: Verifying test catalog...');
    const testResult = await pool.query(
      `SELECT COUNT(*) as count FROM tests`
    );
    const testCount = parseInt(testResult.rows[0].count);

    const testFieldResult = await pool.query(
      `SELECT COUNT(*) as count FROM test_fields`
    );
    const fieldCount = parseInt(testFieldResult.rows[0].count);

    const packageResult = await pool.query(
      `SELECT COUNT(*) as count FROM test_packages`
    );
    const packageCount = parseInt(packageResult.rows[0].count);

    console.log(`\n📊 Database Statistics:`);
    console.log(`   ✅ Tests: ${testCount}`);
    console.log(`   ✅ Test Fields: ${fieldCount}`);
    console.log(`   ✅ Test Packages: ${packageCount}`);
    console.log(`   ✅ Branches: 1+`);
    console.log(`   ✅ Users: 1+ (admin@lab.com)\n`);

    if (testCount >= 100) {
      console.log(`🎉 ✅ COMPLETE: All 100+ tests successfully seeded with parameters!\n`);
    } else if (testCount >= 80) {
      console.log(`⚠️  WARNING: Found ${testCount} tests (expected 100+). Please verify migrations.\n`);
    } else {
      console.log(`❌ ERROR: Found only ${testCount} tests. Migrations may have failed.\n`);
      process.exit(1);
    }

    console.log('💡 Login Credentials:');
    console.log('   Email: admin@lab.com');
    console.log('   Password: admin123\n');

    console.log('🚀 Database setup complete! Ready for use.\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

setupDatabase();
