// src/config/eventCache.js
// Solves Alchemy free-tier rate limits for eth_getLogs.
// Uses exponential backoff and larger delays to avoid 429 errors.

const { contract, provider } = require("./contract");

// ── In-memory event store ─────────────────────────────────────────────────────
const cache = {
  events: [],          // all events sorted by blockNumber desc
  lastScannedBlock: 0,
  ready: false,
};

// ── Batch size must stay small for Alchemy free tier ──────────────────────────
const BATCH_SIZE = 5;

// ── Delay between requests (ms) ──────────────────────────────────────────────
const DELAY_MS = 500; // Increased from 200ms to avoid rate limits

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

// ── Sleep helper ──────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Fetch with retry and exponential backoff ──────────────────────────────────
async function fetchWithRetry(from, to, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
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
    } catch (err) {
      const isRateLimit = err.message?.includes("429") || 
                          err.message?.includes("rate limit") ||
                          err.message?.includes("compute units") ||
                          err.message?.includes("exceeded its compute units");
      
      if (isRateLimit && attempt < retries - 1) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10s
        console.warn(`[eventCache] Rate limit hit, retrying batch ${from}-${to} in ${backoffDelay}ms (attempt ${attempt + 1}/${retries})`);
        await sleep(backoffDelay);
      } else if (attempt === retries - 1) {
        console.warn(`[eventCache] Batch ${from}-${to} failed after ${retries} attempts:`, err.message);
        return []; // Return empty on final failure
      } else {
        throw err;
      }
    }
  }
  return [];
}

// ── Initial backfill: scan from deployBlock to latest in batches ──────────────
async function backfill() {
  const deployBlock = parseInt(process.env.CONTRACT_DEPLOY_BLOCK) || 0;
  let latest;
  
  try {
    latest = await provider.getBlockNumber();
  } catch (err) {
    console.error("[eventCache] Failed to get latest block:", err.message);
    cache.ready = true;
    return;
  }

  console.log(
    `[eventCache] Backfilling blocks ${deployBlock} → ${latest} (batches of ${BATCH_SIZE}, delay ${DELAY_MS}ms)...`
  );

  const newEvents = [];
  const totalBatches = Math.ceil((latest - deployBlock) / BATCH_SIZE);
  let completedBatches = 0;
  
  for (let from = deployBlock; from <= latest; from += BATCH_SIZE) {
    const to = Math.min(from + BATCH_SIZE - 1, latest);
    
    try {
      const batch = await fetchWithRetry(from, to);
      newEvents.push(...batch);
    } catch (err) {
      console.warn(`[eventCache] Batch ${from}-${to} error:`, err.message);
    }
    
    completedBatches++;
    
    // Progress logging every 50 batches
    if (completedBatches % 50 === 0 || completedBatches === totalBatches) {
      console.log(`[eventCache] Progress: ${completedBatches}/${totalBatches} batches (${Math.round(completedBatches/totalBatches*100)}%)`);
    }
    
    // Delay to avoid rate-limiting
    await sleep(DELAY_MS);
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
