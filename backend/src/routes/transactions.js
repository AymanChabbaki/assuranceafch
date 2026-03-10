// src/routes/transactions.js
// GET /api/transactions
// Returns on-chain event history: subscriptions, sinister declarations, and payouts.
// Uses the in-memory eventCache to work within Alchemy free-tier limits.

const { Router } = require("express");
const { cache } = require("../config/eventCache");

const router = Router();

router.get("/", (req, res) => {
  if (!cache.ready) {
    return res.status(503).json({ error: "Event cache is still loading, try again shortly." });
  }

  const subscriptions = cache.events.filter((e) => e.type === "SUBSCRIPTION").length;
  const sinisters     = cache.events.filter((e) => e.type === "SINISTER_DECLARED").length;
  const payouts       = cache.events.filter((e) => e.type === "PAYOUT").length;

  res.json({
    total: cache.events.length,
    subscriptions,
    sinisters,
    payouts,
    lastScannedBlock: cache.lastScannedBlock,
    events: cache.events,
  });
});

module.exports = router;
