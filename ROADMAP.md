# DApp Assurance — Roadmap & Phases

## Overview
Decentralized Insurance Application using Solidity Smart Contracts, React/TypeScript frontend, and Node.js backend.

---

## Phase 1 — Blockchain & Smart Contract Development
**Goal:** Write, test, and deploy the core Smart Contract on a local blockchain then on Sepolia Testnet.

### Tasks:
- [ ] Install and configure Hardhat (development environment)
- [ ] Write the `InsuranceContract.sol` Smart Contract with:
  - `constructor()` — sets owner, premium amount, payout amount
  - `subscribe()` — payable, registers insured user in mapping
  - `declareSinister()` — onlyOwner, marks sinister as active (Pull model)
  - `claim()` — insured user claims their payout (Pull over Push pattern)
  - `getInsuredUsers()` — view function for frontend
- [ ] Apply security patterns:
  - `nonReentrant` modifier (OpenZeppelin ReentrancyGuard)
  - `Ownable` access control (OpenZeppelin)
  - Pull over Push pattern (no loop payouts)
- [ ] Write unit tests with Hardhat + Chai
- [ ] Run static analysis with Slither
- [ ] Deploy to local Hardhat network → then to Sepolia Testnet

### Deliverables:
- `contracts/InsuranceContract.sol`
- `test/InsuranceContract.test.js`
- Deployed contract address + ABI

---

## Phase 2 — Backend (Node.js/Express) Setup
**Goal:** Create an off-chain backend API to support the frontend and interact with blockchain events.

### Tasks:
- [ ] Configure Express.js server with TypeScript
- [ ] Set up environment variables (`.env`) for sensitive config (no private keys in code)
- [ ] Create route: `GET /api/contract-info` — return contract address and ABI
- [ ] Create route: `GET /api/insured-users` — read blockchain state via Ethers.js
- [ ] Create route: `GET /api/transactions` — return payout history (events)
- [ ] Set up CORS, Helmet.js, and rate-limiting for API security
- [ ] Configure HTTPS (SSL/TLS) for production

### Deliverables:
- `backend/src/` with routes, controllers, and middleware
- `.env.example` file (no real secrets)

---

## Phase 3 — Frontend (React + Vite + TypeScript) Development
**Goal:** Build all three user interfaces connected to the Smart Contract.

### Tasks:
- [ ] Configure Vite + React + TypeScript project (already scaffolded)
- [ ] Install dependencies: `ethers`, `wagmi` or direct MetaMask integration
- [ ] Build `WalletConnect` component (MetaMask connection, display address)
- [ ] Build **User Interface** (Assuré):
  - Display contract details (premium, coverage amount, conditions)
  - Subscribe button calling `subscribe()` on the smart contract
  - Claim button calling `claim()` after sinister is declared
- [ ] Build **Admin Interface**:
  - Restricted to owner wallet address
  - Declare sinister button calling `declareSinister()`
- [ ] Build **Dashboard / Transparency View**:
  - Real-time list of insured users (from blockchain)
  - Payout history with TxHash links (Etherscan)
- [ ] Style with Tailwind CSS or a component library

### Deliverables:
- `frontend/src/` with components, pages, hooks, and utils
- ABI integration and contract address config

---

## Phase 4 — Integration & End-to-End Testing
**Goal:** Connect all layers, verify the full user flow works correctly.

### Tasks:
- [ ] Connect frontend to deployed Sepolia contract via Ethers.js
- [ ] Connect frontend to backend API
- [ ] Test full user flow:
  1. User connects MetaMask
  2. User subscribes (pays premium)
  3. Admin declares sinister
  4. User claims payout
- [ ] Verify payout history and TxHash display on dashboard
- [ ] Test admin access control (non-admin cannot trigger sinister)
- [ ] Test reentrancy protection (attempt attack in test environment)

### Deliverables:
- Integration test report
- Bug fixes from testing

---

## Phase 5 — Security Audit & Deployment
**Goal:** Audit the smart contract, deploy everything to production/cloud.

### Tasks:
- [ ] Run full Slither analysis and fix all warnings
- [ ] (Optional) Run Mythril analysis
- [ ] Write security audit report
- [ ] Deploy frontend to Vercel / AWS S3 + CloudFront (with HTTPS)
- [ ] Deploy backend to Render / Railway / Google Cloud Run
- [ ] Verify SSL/TLS certificate is active
- [ ] Configure CSP (Content Security Policy) headers on frontend
- [ ] Final review: no private keys in source, no sensitive data on-chain

### Deliverables:
- `SECURITY_AUDIT.md` — static analysis report
- `DEPLOYMENT.md` — deployment guide
- Live URLs (frontend + backend + contract on Etherscan)

---

## Progress Tracker

| Phase | Status       |
|-------|-------------|
| Phase 1 — Smart Contract | 🔴 Not Started |
| Phase 2 — Backend        | 🔴 Not Started |
| Phase 3 — Frontend       | 🔴 Not Started |
| Phase 4 — Integration    | 🔴 Not Started |
| Phase 5 — Security & Deploy | 🔴 Not Started |

---

> **Note:** Always follow the security requirements from the cahier de charges:
> - Never store private keys in code or cloud
> - No personal data on-chain (GDPR compliance)
> - HTTPS mandatory on all cloud-hosted services
> - Use OpenZeppelin audited libraries only
