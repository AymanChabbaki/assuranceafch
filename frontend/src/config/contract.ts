// src/config/contract.ts
// Single source of truth for contract address, ABI, and network config.
// All values come from .env — never hardcoded.

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as string;
export const NETWORK           = import.meta.env.VITE_NETWORK as string;
export const API_URL           = import.meta.env.VITE_API_URL as string;
export const OWNER_ADDRESS     = (import.meta.env.VITE_OWNER_ADDRESS as string)?.toLowerCase();

export const SEPOLIA_CHAIN_ID  = 11155111;

// Minimal ABI — only the functions the frontend calls directly via MetaMask
export const CONTRACT_ABI = [
  // Read
  "function premiumAmount() view returns (uint256)",
  "function payoutAmount() view returns (uint256)",
  "function sinisterDeclared() view returns (bool)",
  "function isSubscribed(address) view returns (bool)",
  "function hasClaimed(address) view returns (bool)",
  "function getContractInfo() view returns (uint256, uint256, bool, uint256, uint256)",
  // Write (called by user via MetaMask)
  "function subscribe() payable",
  "function claim()",
  // Admin (owner only)
  "function declareSinister()",
  // Events
  "event Subscribed(address indexed user, uint256 premium, uint256 timestamp)",
  "event SinisterDeclared(address indexed owner, uint256 timestamp)",
  "event PayoutClaimed(address indexed user, uint256 amount, uint256 timestamp)",
] as const;
