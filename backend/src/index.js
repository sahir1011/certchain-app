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

// ── bootstrap ───────────────────────────────────────────────
async function bootstrap() {
  console.log("━".repeat(50));
  console.log(" CertChain  –  Backend API");
  console.log("━".repeat(50));

  // Initialise ethers connection
  await blockchain.init();

  // Initialise Database
  const { initDB } = require("./models");
  await initDB();

  // Quick connectivity check
  try {
    const block = await blockchain.getLatestBlockNumber();
    console.log(`[boot] Sepolia latest block: ${block}`);
  } catch (e) {
    console.error("[boot] ⚠️  Could not reach Sepolia RPC –", e.message);
    console.log("       The server will still start but on-chain calls will fail.");
  }
}

// Only start the server if we are running directly (not imported as a module)
// Vercel imports the app, so we don't want to call app.listen()
if (require.main === module) {
  bootstrap().then(() => {
    app.listen(PORT, () => {
      console.log(`\n✅  Server listening on http://localhost:${PORT}`);
      console.log("    Health  → GET  /api/health");
      // ... logs
    });
  }).catch((e) => {
    console.error("Fatal bootstrap error:", e);
    process.exit(1);
  });
} else {
  // For Vercel/Serverless, we might need to verify the DB/Blockchain connection per request
  // or rely on container reuse.
  // We can lazily init in the route handlers or middleware if needed,
  // but typically Vercel reuses the instance.
  // Let's at least try to init once.
  bootstrap().catch(console.error);
}

module.exports = app;
