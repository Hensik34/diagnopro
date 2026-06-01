require("dotenv").config();
const pool = require("../config/db");
const fs = require("fs");
const path = require("path");

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

function getMigrationFiles() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();
}

function isSeedMigration(fileName) {
  return fileName.toLowerCase().includes("seed");
}

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

async function ensureDatabase() {
  const { Pool } = require("pg");
  const systemPool = new Pool({
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASS || "root",
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: "postgres" // Connect to default postgres DB
  });

  const client = await systemPool.connect();
  try {
    const dbName = process.env.DB_NAME || "diangopro";
    
    // Check if database exists
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (result.rows.length === 0) {
      console.log(`📦 Creating database: ${dbName}...`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database created: ${dbName}\n`);
    } else {
      console.log(`✅ Database exists: ${dbName}\n`);
    }
  } finally {
    client.release();
    await systemPool.end();
  }
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
  // First, ensure the database exists
  await ensureDatabase();

  const client = await pool.connect();
  try {
    console.log("🔌 Testing DB connection...");
    await client.query("SELECT 1");
    console.log("✅ DB connected successfully\n");

    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);

    let queue = [];
    const migrationFiles = getMigrationFiles();
    if (mode === "schema") {
      queue = migrationFiles.filter((fileName) => !isSeedMigration(fileName));
    } else if (mode === "seed") {
      queue = migrationFiles.filter((fileName) => isSeedMigration(fileName));
    } else {
      queue = migrationFiles;
    }

    let newCount = 0;
    for (const fileName of queue) {
      if (await applyMigration(client, fileName, applied)) {
        newCount++;
      }
    }

    console.log("\n─────────────────────────────────────────");
    if (newCount === 0) {
      console.log("✅ Database is up to date (all migrations applied)");
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
  ensureDatabase,
};
