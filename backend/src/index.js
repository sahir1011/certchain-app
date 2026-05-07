/**
 * index.js  –  Express server entry point
 *
 * Starts the API on PORT (default 3001).
 * On boot it initialises the ethers provider + contract and
 * syncs any previously-issued certificates from the chain
 * into the in-memory store (only the hashes; full metadata
 * must have been cached at issue time).
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const blockchain = require("./blockchain");
const routes = require("./routes");
const { router: authRouter } = require("./auth");

const app = express();
const PORT = process.env.PORT || 3001;

// ── allowed origins ─────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

// ── middleware ──────────────────────────────────────────────
// Helmet: relax policies that block cross-origin requests in Chrome/Firefox
app.use(helmet({
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(morgan("dev"));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // Allow cookies
}));

// Explicit preflight handler — must respond BEFORE bootstrap wait
app.options("*", cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser()); // Parse cookies

// ── eager bootstrap (runs once at module load, not per-request) ────────
const bootstrapPromise = (async () => {
  try {
    console.log("━".repeat(50));
    console.log(" CertChain  –  Initializing serverless connections...");

    // Run blockchain and DB init in parallel for faster cold starts
    const { initDB } = require("./models");
    await Promise.all([
      blockchain.init(),
      initDB(),
    ]);

    console.log(" CertChain  –  Ready ✓");
  } catch (error) {
    console.error("Bootstrap error:", error);
    throw error; // Will reject the promise; caught by middleware below
  }
})();

// Wait for bootstrap to complete before handling any request
app.use(async (req, res, next) => {
  try {
    await bootstrapPromise;
    next();
  } catch (error) {
    res.status(500).json({ error: "Server Initialization Failed", details: error.message });
  }
});

// ── routes ──────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api", routes);

// ── 404 catch-all ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

// ── global error handler ────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[unhandled]", err);
  res.status(500).json({ message: "Internal server error" });
});

// Only start the server if we are running directly (not imported as a module)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n✅  Server listening on http://localhost:${PORT}`);
    console.log("    Connections will initialize on first request.");
    console.log("    Health  → GET  /api/health");
  });
}

module.exports = app;
