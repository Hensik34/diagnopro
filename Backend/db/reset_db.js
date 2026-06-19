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
    // Terminate all connections to the target database
    await c.query(
      "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='diangopro' AND pid <> pg_backend_pid()"
    );
    console.log("✅ All connections to diangopro terminated");

    await c.query("DROP DATABASE IF EXISTS diangopro");
    console.log("✅ Database dropped");

    await c.query("CREATE DATABASE diangopro");
    console.log("✅ Database created fresh");
  } finally {
    c.release();
    await p.end();
  }
})().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
