# DApp Assurance — Roadmap & Phases

## Overview
Decentralized Insurance Application using Solidity Smart Contracts, React/TypeScript frontend, and Node.js backend.

---

## Phase 1 — Blockchain & Smart Contract Development ✅ COMPLETE
**Goal:** Write, test, and deploy the core Smart Contract on a local blockchain then on Sepolia Testnet.

### Tasks Completed:
- [x] Install and configure Hardhat (development environment)
- [x] Write the `InsuranceContract.sol` Smart Contract with:
  - [x] `constructor()` — sets owner, premium amount, payout amount
  - [x] `subscribe()` — payable, registers insured user in mapping
  - [x] `declareSinister()` — onlyOwner, marks sinister as active (Pull model)
  - [x] `claim()` — insured user claims their payout (Pull over Push pattern)
  - [x] `getInsuredUsers()` — view function for frontend
  - [x] `fundContract()` — owner can add ETH to contract
- [x] Apply security patterns:
  - [x] `nonReentrant` modifier (OpenZeppelin ReentrancyGuard)
  - [x] `Ownable` access control (OpenZeppelin)
  - [x] Pull over Push pattern (no loop payouts)
  - [x] Checks-Effects-Interactions pattern
- [x] Write unit tests with Hardhat + Chai (30 tests passing)
- [x] Deploy to local Hardhat network → then to Sepolia Testnet

### Deliverables:
- ✅ `contracts/InsuranceContract.sol`
- ✅ `test/InsuranceContract.test.js`
- ✅ Deployed contract address + ABI
- ✅ Reentrancy attack test contract

---

## Phase 2 — Backend (Node.js/Express) Setup ✅ COMPLETE
**Goal:** Create an off-chain backend API to support the frontend and interact with blockchain events.

### Tasks Completed:
- [x] Configure Express.js server
- [x] Set up environment variables (`.env`) for sensitive config (no private keys in code)
- [x] Create route: `GET /api/health` — server status
- [x] Create route: `GET /api/contract-info` — return contract state
- [x] Create route: `GET /api/insured-users` — read blockchain state via Ethers.js
- [x] Create route: `GET /api/transactions` — return event history with caching
- [x] Set up CORS, Helmet.js, and rate-limiting for API security
- [x] Implement event cache with batch processing (Alchemy rate limit handling)
- [x] Add retry logic with exponential backoff for failed requests

### Deliverables:
- ✅ `backend/src/` with routes, controllers, and middleware
- ✅ `.env.example` file (no real secrets)
- ✅ Event caching system for blockchain queries

---

## Phase 3 — Frontend (React + Vite + TypeScript) Development ✅ COMPLETE
**Goal:** Build all three user interfaces connected to the Smart Contract.

### Tasks Completed:
- [x] Configure Vite + React + TypeScript project
- [x] Install dependencies: `ethers`, `lucide-react`, `recharts`, `axios`
- [x] Build `WalletConnect` component (MetaMask connection, network switching)
- [x] Build **User Interface** (Assuré):
  - [x] Display contract details (premium, payout, balance, insured count)
  - [x] Subscribe button calling `subscribe()` on smart contract
  - [x] Claim button calling `claim()` after sinister declared
  - [x] Transaction status feedback with Etherscan links
  - [x] Auto-detect wallet state (subscribed, claimed, network)
- [x] Build **Admin Interface**:
  - [x] Restricted to owner wallet address
  - [x] Contract stats and solvency charts
  - [x] Fund Contract button to add ETH
  - [x] Declare sinister button with confirmation dialog
  - [x] Two-step confirmation for irreversible actions
- [x] Build **Dashboard / Transparency View**:
  - [x] Real-time list of insured users (from blockchain)
  - [x] Payout status (claimed vs pending)
  - [x] Transaction history with TxHash links (Etherscan)
  - [x] Event breakdown charts
- [x] Custom CSS design system (dark theme, glassmorphism)
- [x] Copy-to-clipboard functionality for addresses

### Deliverables:
- ✅ `frontend/src/` with components, pages, hooks, and utils
- ✅ ABI integration and contract address config
- ✅ Responsive design with premium dark theme

---

## Phase 4 — Integration & End-to-End Testing ✅ COMPLETE
**Goal:** Connect all layers, verify the full user flow works correctly.

### Tasks Completed:
- [x] Connect frontend to deployed Sepolia contract via Ethers.js
- [x] Connect frontend to backend API
- [x] Test full user flow:
  1. [x] User connects MetaMask
  2. [x] User subscribes (pays premium)
  3. [x] Admin funds contract
  4. [x] Admin declares sinister
  5. [x] User claims payout
- [x] Verify payout history and TxHash display on dashboard
- [x] Test admin access control (non-admin cannot access admin panel)
- [x] Test network switching (Sepolia enforcement)
- [x] Fix rate limiting issues (429 errors) with retry logic
- [x] Add copy-to-clipboard for all addresses

### Deliverables:
- ✅ Integration test report (tested manually)
- ✅ Bug fixes from testing
- ✅ `PRESENTATION_GUIDE.md` for demo day

---

## Phase 5 — Security Audit & Deployment 🟡 PARTIAL / OPTIONAL
**Goal:** Audit the smart contract, deploy everything to production/cloud.

### Tasks Completed:
- [x] Security patterns implemented (ReentrancyGuard, Ownable, Pull over Push)
- [x] No private keys in source code
- [x] No sensitive data on-chain (GDPR compliant)
- [x] Environment variables properly configured

### Optional Tasks (Not Required for Academic Presentation):
- [ ] Run full Slither analysis (can be added)
- [ ] (Optional) Run Mythril analysis
- [ ] Write security audit report
- [ ] Deploy frontend to Vercel / AWS S3 + CloudFront
- [ ] Deploy backend to Render / Railway / Google Cloud Run
- [ ] Configure CSP (Content Security Policy) headers

### Note:
Cloud deployment is **optional** for academic presentation. Local development server is sufficient for demo.

---

## Progress Tracker

| Phase | Status       | Notes |
|-------|-------------|-------|
| Phase 1 — Smart Contract | ✅ Complete | Deployed to Sepolia, all security patterns applied |
| Phase 2 — Backend        | ✅ Complete | API running, event caching with retry logic |
| Phase 3 — Frontend       | ✅ Complete | All pages functional, copy-to-clipboard added |
| Phase 4 — Integration    | ✅ Complete | Full flow tested, presentation guide ready |
| Phase 5 — Security & Deploy | 🟡 Partial | Core security done, cloud deploy optional |

---

## Current Deployment Status

### Local Development (Ready for Presentation)
| Service | URL | Status |
|---------|-----|--------|
| Frontend | http://localhost:5173 | ✅ Ready |
| Backend API | http://localhost:3000 | ✅ Ready |
| Smart Contract | Sepolia Testnet | ✅ Deployed |

### Contract Details
| Property | Value |
|----------|-------|
| **Current Contract** | `0x3E581d9252d33dc03E5B8da595f7a46BB30219e7` |
| **Network** | Ethereum Sepolia Testnet |
| **Owner** | `0xE0C29f8206311A93f87Dfc6449a16C81f0661341` |
| **Premium** | 0.01 ETH |
| **Payout** | 0.05 ETH |

---

## Quick Start (For Presentation)

```bash
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start Frontend  
cd frontend
npm run dev

# Open browser: http://localhost:5173
```

---

## Security Compliance ✅

Per cahier de charges requirements:
- ✅ **Private Keys:** Never stored in code or cloud (only in `.env` files, gitignored)
- ✅ **GDPR:** No personal data on-chain (only wallet addresses)
- ✅ **HTTPS:** Backend configured for HTTPS in production
- ✅ **Libraries:** Only OpenZeppelin audited contracts used
- ✅ **Access Control:** Strict owner-only functions
- ✅ **Reentrancy Protection:** OpenZeppelin ReentrancyGuard applied

---

## Deliverables Summary

| Deliverable | Status | Location |
|-------------|--------|----------|
| Smart Contract Source | ✅ | `blockchain/contracts/InsuranceContract.sol` |
| Test Suite | ✅ | `blockchain/test/InsuranceContract.test.js` |
| Frontend Application | ✅ | `frontend/src/` |
| Backend API | ✅ | `backend/src/` |
| Deployment Scripts | ✅ | `blockchain/scripts/deploy.js` |
| Presentation Guide | ✅ | `PRESENTATION_GUIDE.md` |
| Documentation | ✅ | `README.md`, This file |

---

## Conclusion

**Project Status: ✅ COMPLETE AND READY FOR PRESENTATION**

All core functionality from the cahier de charges has been implemented and tested:
- Decentralized insurance smart contract with security best practices
- Full-stack application with modern React frontend
- Real-time blockchain integration via MetaMask
- Admin and user role separation
- Transparent dashboard with on-chain data

Optional cloud deployment (Phase 5) can be completed post-presentation if required.

---

> **Last Updated:** March 20, 2026
