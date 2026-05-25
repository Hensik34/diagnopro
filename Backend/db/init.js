require('dotenv').config();
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// ─────────────────────────────────────────────
// Ensure the tracking table exists
// ─────────────────────────────────────────────
async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          SERIAL PRIMARY KEY,
      filename    VARCHAR(255) UNIQUE NOT NULL,
      applied_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// ─────────────────────────────────────────────
// Auto-rename migrations to sequence-safe names
// ─────────────────────────────────────────────
async function renameAndFixMigrations(client) {
  const RENAMES = {
    '001_create_all_tables.sql': '001a_create_all_tables.sql',
    '001_add_technician_to_reports.sql': '001b_add_technician_to_reports.sql',
    '005_create_inventory_table.sql': '005a_create_inventory_table.sql',
    '005_patient_name_age_and_sample_id.sql': '005b_patient_name_age_and_sample_id.sql',
    '008_create_test_fields_table.sql': '008a_create_test_fields_table.sql',
    '029_create_default_branch.sql': '008b_create_default_branch.sql',
    '010_seed_default_tests.sql': '010a_seed_default_tests.sql',
    '010_seed_default_tests_fixed.sql': '010b_seed_default_tests_fixed.sql',
    '021_create_settings_table.sql': '021a_create_settings_table.sql',
    '021_create_user_tests_table.sql': '021b_create_user_tests_table.sql',
    '022_add_report_settings.sql': '022a_add_report_settings.sql',
    '022_create_user_test_fields_table.sql': '022b_create_user_test_fields_table.sql',
    '031_fix_schema_column_mismatches.sql': '031a_fix_schema_column_mismatches.sql',
    '031_fix_schema_sync.sql': '031b_fix_schema_sync.sql',
  };

  // 1. Rename files physically if they exist
  for (const [oldName, newName] of Object.entries(RENAMES)) {
    const oldPath = path.join(MIGRATIONS_DIR, oldName);
    const newPath = path.join(MIGRATIONS_DIR, newName);
    if (fs.existsSync(oldPath)) {
      console.log(`   🔄  Renaming file: ${oldName} ➔ ${newName}`);
      try {
        fs.renameSync(oldPath, newPath);
      } catch (e) {
        console.error(`      ⚠️ Failed to rename ${oldName} physically:`, e.message);
      }
    }
  }

  // 2. Update existing entries in schema_migrations table
  for (const [oldName, newName] of Object.entries(RENAMES)) {
    await client.query(
      'UPDATE schema_migrations SET filename = $1 WHERE filename = $2',
      [newName, oldName]
    );
  }
}

// ─────────────────────────────────────────────
// Return Set of already-applied filenames
// ─────────────────────────────────────────────
async function getAppliedMigrations(client) {
  const res = await client.query(
    'SELECT filename FROM schema_migrations ORDER BY id'
  );
  return new Set(res.rows.map((r) => r.filename));
}

// ─────────────────────────────────────────────
// Main entry: run pending migrations in order
// ─────────────────────────────────────────────
async function runMigrations() {
  const client = await pool.connect();

  try {
    // 1. Test connection
    console.log('\n🔌  Testing DB connection...');
    await client.query('SELECT 1');
    console.log('✅  DB connected successfully');

    // 2. Ensure tracking table
    await ensureMigrationsTable(client);

    // 3. Rename old/duplicated migrations to safe sequential names
    await renameAndFixMigrations(client);

    // 4. Get already-applied migrations
    const applied = await getAppliedMigrations(client);

    // 5. Read & sort all .sql files
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort(); // lexicographic — 001a < 001b < ... < 031b

    console.log(`\n📂  Found ${files.length} migration file(s) in db/migrations/`);

    let newCount = 0;
    let skipCount = 0;

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`   ⏭️  Skip  (already applied): ${file}`);
        skipCount++;
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`   ✅  Applied migration      : ${file}`);
        newCount++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`\n❌  Migration failed: ${file}`);
        console.error(`    ${err.message}`);
        throw err; // Abort server start on failure
      }
    }

    console.log('\n─────────────────────────────────────────');
    if (newCount === 0) {
      console.log('✅  Database is up to date — no new migrations applied');
    } else {
      console.log(`✅  Applied ${newCount} new migration(s)  |  Skipped ${skipCount}`);
    }
    console.log('─────────────────────────────────────────\n');
  } finally {
    client.release();
  }
}

module.exports = { runMigrations };
