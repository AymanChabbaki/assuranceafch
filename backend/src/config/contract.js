// src/config/contract.js
// Loads contract address, ABI and a read-only ethers provider.
// No private keys are ever loaded here — the backend is read-only.

const { ethers } = require("ethers");
const path = require("path");
const fs = require("fs");

// ── ABI: loaded from the Hardhat artifact (source of truth) ─────────────────
const artifactPath = path.resolve(
  __dirname,
  "../../..",
  "blockchain/artifacts/contracts/InsuranceContract.sol/InsuranceContract.json"
);

let CONTRACT_ABI;
try {
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  CONTRACT_ABI = artifact.abi;
} catch {
  console.error(
    "[config/contract] ⚠️  Could not load ABI from artifact. Run `npx hardhat compile` in the blockchain folder."
  );
  CONTRACT_ABI = [];
}

// ── Config values from environment ──────────────────────────────────────────
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RPC_URL = process.env.SEPOLIA_RPC_URL;

if (!CONTRACT_ADDRESS) {
  console.warn("[config/contract] ⚠️  CONTRACT_ADDRESS not set in .env");
}
if (!RPC_URL) {
  console.warn("[config/contract] ⚠️  SEPOLIA_RPC_URL not set in .env");
}

// ── Read-only provider (no private key needed) ───────────────────────────────
const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

module.exports = { contract, provider, CONTRACT_ABI, CONTRACT_ADDRESS };
