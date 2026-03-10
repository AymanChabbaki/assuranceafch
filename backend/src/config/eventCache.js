// src/config/eventCache.js
// Solves Alchemy free-tier 10-block limit for eth_getLogs.
// On startup: fetches historical events in batches of 10 blocks.
// Going forward: listens to live contract events and appends them to cache.

const { contract, provider } = require("./contract");

// ── In-memory event store ─────────────────────────────────────────────────────
const cache = {
  events: [],          // all events sorted by blockNumber desc
  lastScannedBlock: 0,
  ready: false,
};

// ── Batch size must stay ≤ 10 for Alchemy free tier ──────────────────────────
const BATCH_SIZE = 9;

// ── Format helpers ────────────────────────────────────────────────────────────
function formatSubscribed(e) {
  return {
    type: "SUBSCRIPTION",
    user: e.args.user,
    premiumWei: e.args.premium.toString(),
    txHash: e.transactionHash,
    blockNumber: e.blockNumber,
    explorerUrl: `https://sepolia.etherscan.io/tx/${e.transactionHash}`,
  };
}
function formatSinister(e) {
  return {
    type: "SINISTER_DECLARED",
    declaredBy: e.args.owner,
    txHash: e.transactionHash,
    blockNumber: e.blockNumber,
    explorerUrl: `https://sepolia.etherscan.io/tx/${e.transactionHash}`,
  };
}
function formatPayout(e) {
  return {
    type: "PAYOUT",
    user: e.args.user,
    amountWei: e.args.amount.toString(),
    txHash: e.transactionHash,
    blockNumber: e.blockNumber,
    explorerUrl: `https://sepolia.etherscan.io/tx/${e.transactionHash}`,
  };
}

// ── Fetch one batch of events across all event types ─────────────────────────
async function fetchBatch(from, to) {
  const [subs, sins, pays] = await Promise.all([
    contract.queryFilter(contract.filters.Subscribed(),       from, to),
    contract.queryFilter(contract.filters.SinisterDeclared(), from, to),
    contract.queryFilter(contract.filters.PayoutClaimed(),    from, to),
  ]);
  return [
    ...subs.map(formatSubscribed),
    ...sins.map(formatSinister),
    ...pays.map(formatPayout),
  ];
}

// ── Initial backfill: scan from deployBlock to latest in BATCH_SIZE chunks ───
async function backfill() {
  const deployBlock = parseInt(process.env.CONTRACT_DEPLOY_BLOCK) || 0;
  const latest = await provider.getBlockNumber();

  console.log(
    `[eventCache] Backfilling blocks ${deployBlock} → ${latest} (batches of ${BATCH_SIZE})...`
  );

  const newEvents = [];
  for (let from = deployBlock; from <= latest; from += BATCH_SIZE) {
    const to = Math.min(from + BATCH_SIZE - 1, latest);
    try {
      const batch = await fetchBatch(from, to);
      newEvents.push(...batch);
    } catch (err) {
      console.warn(`[eventCache] Batch ${from}-${to} failed:`, err.message);
    }
    // Small delay to avoid rate-limiting on free tier
    await new Promise((r) => setTimeout(r, 200));
  }

  cache.events = newEvents.sort((a, b) => b.blockNumber - a.blockNumber);
  cache.lastScannedBlock = latest;
  cache.ready = true;
  console.log(`[eventCache] ✅ Backfill complete — ${cache.events.length} events cached`);
}

// ── Live listeners: append new events in real-time ───────────────────────────
function attachListeners() {
  contract.on("Subscribed", (user, premium, timestamp, event) => {
    cache.events.unshift(formatSubscribed(event));
  });
  contract.on("SinisterDeclared", (owner, timestamp, event) => {
    cache.events.unshift(formatSinister(event));
  });
  contract.on("PayoutClaimed", (user, amount, timestamp, event) => {
    cache.events.unshift(formatPayout(event));
  });
  console.log("[eventCache] Live event listeners attached");
}

// ── Start: backfill then listen ───────────────────────────────────────────────
async function init() {
  try {
    await backfill();
    attachListeners();
  } catch (err) {
    console.error("[eventCache] Init failed:", err.message);
    cache.ready = true; // still mark ready so server doesn't hang
  }
}

module.exports = { cache, init };
