require('dotenv').config();
const pool = require('./config/db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function seedData() {
  try {
    console.log('🌱 Starting comprehensive database seeding...\n');
    
    // 1. Verify branch exists
    console.log('📍 Checking for default branch...');
    const branchResult = await pool.query('SELECT id FROM branches LIMIT 1');
    
    let branchId = branchResult.rows[0]?.id;
    if (!branchId) {
      // Create default branch if none exists
      const newBranch = await pool.query(
        `INSERT INTO branches (id, name, location, city, phone, email, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING id`,
        [uuidv4(), 'Main Branch', 'Headquarters', 'City', '+1234567890', 'branch@lab.com']
      );
      branchId = newBranch.rows[0].id;
      console.log(`✅ Created new branch with ID: ${branchId}\n`);
    } else {
      console.log(`✅ Using existing branch with ID: ${branchId}\n`);
    }
    
    // 2. Create default admin user if not exists
    console.log('👤 Creating default admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const userResult = await pool.query(
      `INSERT INTO users (id, email, password_hash, role, firstname, lastname, phone, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [uuidv4(), 'admin@lab.com', hashedPassword, 'admin', 'Admin', 'User', '1234567890']
    );
    
    if (userResult.rows.length > 0) {
      console.log(`✅ Admin user created - Email: admin@lab.com, Password: admin123\n`);
    } else {
      console.log(`✅ Admin user already exists - Email: admin@lab.com\n`);
    }
    
    // 3. Comprehensive test catalog verification
    console.log('📋 Comprehensive Test Catalog Verification:\n');
    
    const testResult = await pool.query(`
      SELECT COUNT(*) as count, 
             COUNT(DISTINCT category) as categories
      FROM tests
    `);
    const testCount = parseInt(testResult.rows[0].count);
    const categoryCount = parseInt(testResult.rows[0].categories);

    // Get test breakdown by category
    const categoryBreakdown = await pool.query(`
      SELECT category, COUNT(*) as count 
      FROM tests 
      GROUP BY category 
      ORDER BY count DESC
    `);

    console.log(`Total Tests: ${testCount}`);
    console.log(`Categories: ${categoryCount}\n`);
    console.log('Breakdown by Category:');
    categoryBreakdown.rows.forEach(row => {
      console.log(`  • ${row.category}: ${row.count} tests`);
    });

    // Verify test fields
    const fieldResult = await pool.query('SELECT COUNT(*) as count FROM test_fields');
    const fieldCount = parseInt(fieldResult.rows[0].count);
    console.log(`\nTest Fields: ${fieldCount}`);

    // Verify test packages
    const packageResult = await pool.query('SELECT COUNT(*) as count FROM test_packages');
    const packageCount = parseInt(packageResult.rows[0].count);
    console.log(`Test Packages: ${packageCount}`);

    // Verify calculated fields
    const calculatedResult = await pool.query(`
      SELECT COUNT(*) as count FROM test_fields 
      WHERE field_type = 'calculated'
    `);
    const calculatedCount = parseInt(calculatedResult.rows[0].count);
    console.log(`Calculated Fields: ${calculatedCount}\n`);

    // Final verification
    console.log('✅ Database verification:\n');
    console.log(`   ✓ Branch count: 1+`);
    console.log(`   ✓ User count: 1+ (admin@lab.com)`);
    console.log(`   ✓ Tests seeded: ${testCount}`);
    console.log(`   ✓ Test categories: ${categoryCount}`);
    console.log(`   ✓ Test fields defined: ${fieldCount}`);
    console.log(`   ✓ Test packages: ${packageCount}`);
    console.log(`   ✓ Calculated fields: ${calculatedCount}\n`);
    
    if (testCount >= 100) {
      console.log('🎉 SUCCESS: All 100+ tests with complete parameters seeded!\n');
    } else if (testCount >= 80) {
      console.log(`⚠️  Found ${testCount} tests (expected 100+)\n`);
    } else {
      console.log(`❌ Only ${testCount} tests found. Migrations may need to be rerun.\n`);
    }
    
    console.log('💡 Login credentials:');
    console.log('   Email: admin@lab.com');
    console.log('   Password: admin123\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedData();
