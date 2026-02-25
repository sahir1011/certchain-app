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

// ── middleware ──────────────────────────────────────────────
app.use(helmet());
app.use(morgan("dev"));
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    process.env.FRONTEND_URL
  ].filter(Boolean), // This allows local dev and Vercel frontend
  methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // Allow cookies
}));
app.use(express.json());
app.use(cookieParser()); // Parse cookies

// ── bootstrap middleware ────────────────────────────────────
let isBootstrapped = false;
app.use(async (req, res, next) => {
  if (isBootstrapped) return next();
  try {
    console.log("━".repeat(50));
    console.log(" CertChain  –  Initializing serverless connections...");

    await blockchain.init();
    const { initDB } = require("./models");
    await initDB();

    isBootstrapped = true;
    next();
  } catch (error) {
    console.error("Bootstrap error:", error);
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
