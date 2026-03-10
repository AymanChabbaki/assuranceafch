// index.js — Backend API server for DApp Assurance
// Read-only: all blockchain writes are done directly by the frontend via MetaMask

require("dotenv").config();
const express = require("express");
const { helmet, corsOptions, limiterLight, limiterHeavy } = require("./src/middleware/security");
const cors = require("cors");
const { init: initEventCache } = require("./src/config/eventCache");

// ── Routes ───────────────────────────────────────────────────────────────────
const contractInfoRouter = require("./src/routes/contractInfo");
const insuredUsersRouter = require("./src/routes/insuredUsers");
const transactionsRouter = require("./src/routes/transactions");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());               // Sets secure HTTP headers (XSS, clickjacking, etc.)
app.use(cors(corsOptions));      // Restrict to frontend origin only
app.use(express.json());         // Parse JSON bodies

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── API Routes (each with its own rate limiter) ───────────────────────────────
app.use("/api/contract-info",  limiterLight,  contractInfoRouter);
app.use("/api/insured-users",  limiterLight,  insuredUsersRouter);
app.use("/api/transactions",   limiterHeavy,  transactionsRouter);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[server error]", err.message);
  res.status(500).json({ error: "Internal server error" });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Backend API running on http://localhost:${PORT}`);
  console.log(`   Contract : ${process.env.CONTRACT_ADDRESS}`);
  console.log(`   Network  : Sepolia`);

  // Start backfilling event cache after server is listening
  initEventCache();
});
