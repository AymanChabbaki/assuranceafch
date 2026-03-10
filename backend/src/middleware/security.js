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
// Max 100 requests per 15 minutes per IP — prevents scraping / DoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

module.exports = { helmet, corsOptions, limiter };
