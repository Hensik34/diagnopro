require("dotenv").config();
const { Pool } = require("pg");

const p = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: "postgres",
});

(async () => {
  const c = await p.connect();
  try {
    const dbName = process.env.DB_NAME || "diagnopro";
    // Terminate all connections to the target database
    await c.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [dbName]
    );
    console.log(`✅ All connections to ${dbName} terminated`);

    await c.query(`DROP DATABASE IF EXISTS "${dbName}"`);
    console.log(`✅ Database ${dbName} dropped`);

    await c.query(`CREATE DATABASE "${dbName}"`);
    console.log(`✅ Database ${dbName} created fresh`);
  } finally {
    c.release();
    await p.end();
  }
})().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
