// src/middleware/security.js
// Centralised security middleware applied to every request

const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

// ── CORS ─────────────────────────────────────────────────────────────────────
// Only allow requests from the frontend origin (set in .env)
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET"],           // backend is read-only — no POST/PUT/DELETE
  allowedHeaders: ["Content-Type"],
  optionsSuccessStatus: 200,
};

// ── Rate Limiting ─────────────────────────────────────────────────────────────
// Separate limiters per route so polling doesn't exhaust a single shared bucket.
// Light data (contract-info, insured-users): 300 req / 15 min per IP.
// Heavy data (transactions / event scan):    120 req / 15 min per IP.
function makeLimiter(max) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  });
}

const limiterLight  = makeLimiter(300);
const limiterHeavy  = makeLimiter(120);

module.exports = { helmet, corsOptions, limiterLight, limiterHeavy };
