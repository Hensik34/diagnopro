const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS != null ? String(process.env.DB_PASS) : undefined,
  port: Number(process.env.DB_PORT) || 5432,
  max: 20,                      // max connections in pool
  idleTimeoutMillis: 30000,     // close idle connections after 30s
  connectionTimeoutMillis: 5000, // fail fast if DB is unreachable
});

// Surface unexpected pool errors instead of crashing silently
pool.on("error", (err) => {
  console.error("❌ Unexpected DB pool error:", err.message);
});

module.exports = pool;