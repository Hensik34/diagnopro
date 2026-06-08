require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { syncDatabase } = require("./models");
const { initRealtime } = require("./services/realtime.service");
const whatsappService = require("./services/whatsapp.service");

const app = express();
const server = http.createServer(app);

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? (process.env.CLIENT_URL || "http://localhost:5173")
    : true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Note: File uploads are now stored on Cloudinary — no local static serving needed

// Request logging middleware (opt-in)
if (process.env.REQUEST_LOGS === "true") {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// ─── API Routes ────────────────────────────────────────────────────────────────
const routes = require("./routes");
app.use("/api", routes);

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Lab Management System API" });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// ─── Start Server (syncs DB models first) ─────────────────────────────────────
async function startServer() {
  try {
    await syncDatabase(); // Validate DB connection (and optional sync)
    initRealtime(server);

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀  Server running  → http://localhost:${PORT}`);
      console.log(`📚  API Base URL    → http://localhost:${PORT}/api`);
      console.log(`🏥  Lab Management System — Ready\n`);
    });

    // Restore WhatsApp sessions in background (non-blocking)
    whatsappService.restoreAllSessions().catch((error) => {
      console.error("⚠️  Failed to restore WhatsApp sessions:", error.message);
    });
  } catch (err) {
    console.error("\n❌  Server failed to start:", err.message);
    process.exit(1);
  }
}

startServer();
