require('dotenv').config();
const pool = require('./config/db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function seedData() {
  try {
    console.log('🌱 Starting database seeding...\n');
    
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
    
    // 3. Verify tests were seeded by migrations
    const testResult = await pool.query('SELECT COUNT(*) as count FROM tests');
    const testCount = parseInt(testResult.rows[0].count);
    
    console.log(`\n✅ Database verification:\n`);
    console.log(`   - Branch count: 1+`);
    console.log(`   - User count: 1+ (admin@lab.com)`);
    console.log(`   - Tests seeded: ${testCount}\n`);
    
    if (testCount >= 40) {
      console.log('🎉 All 40 tests successfully seeded!\n');
    } else {
      console.log(`⚠️  Expected 40 tests, found ${testCount}. Please run migrations.\n`);
    }
    
    console.log('💡 Login credentials:');
    console.log('   Email: admin@lab.com');
    console.log('   Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedData();
