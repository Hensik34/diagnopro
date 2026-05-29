require("dotenv").config();
const pool = require("../config/db");
const fs = require("fs");
const path = require("path");

const MIGRATIONS_DIR = path.join(__dirname, "migrations");
const SCHEMA_MIGRATION = "001_final_schema.sql";

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedMigrations(client) {
  const res = await client.query("SELECT filename FROM schema_migrations");
  return new Set(res.rows.map((r) => r.filename));
}

function getSql(fileName) {
  const filePath = path.join(MIGRATIONS_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Migration file not found: ${fileName}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

async function applyMigration(client, fileName, applied) {
  if (applied.has(fileName)) {
    console.log(`   ⏭️  Skip (already applied): ${fileName}`);
    return false;
  }

  const sql = getSql(fileName);
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query(
      "INSERT INTO schema_migrations (filename) VALUES ($1)",
      [fileName]
    );
    await client.query("COMMIT");
    console.log(`   ✅ Applied: ${fileName}`);
    return true;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }
}

async function runMigrations(mode = "all") {
  const client = await pool.connect();
  try {
    console.log("\n🔌 Testing DB connection...");
    await client.query("SELECT 1");
    console.log("✅ DB connected successfully");

    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);

    const queue = [SCHEMA_MIGRATION];

    let newCount = 0;
    for (const fileName of queue) {
      if (await applyMigration(client, fileName, applied)) {
        newCount++;
      }
    }

    console.log("\n─────────────────────────────────────────");
    if (newCount === 0) {
      console.log("✅ Database is up to date for selected migration mode");
    } else {
      console.log(`✅ Applied ${newCount} migration(s)`);
    }
    console.log("─────────────────────────────────────────\n");
  } finally {
    client.release();
  }
}

async function runSchemaMigrations() {
  return runMigrations("schema");
}

async function runSeedMigrations() {
  return runMigrations("seed");
}

if (require.main === module) {
  const mode = (process.argv[2] || "all").toLowerCase();
  if (!["schema", "seed", "all"].includes(mode)) {
    console.error("❌ Invalid mode. Use: schema | seed | all");
    process.exit(1);
  }

  runMigrations(mode)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Migration execution failed:", error.message);
      process.exit(1);
    });
}

module.exports = {
  runMigrations,
  runSchemaMigrations,
  runSeedMigrations,
};
