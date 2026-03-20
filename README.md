# DApp Assurance — Blockchain-Based Insurance Platform

A full-stack decentralised insurance application built on Ethereum (Sepolia testnet).  
Users subscribe to an insurance policy by paying a premium on-chain; if a sinister is declared by the contract owner, every insured user can claim their payout directly — no middleman.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        User's Browser                           │
│  React + TypeScript (Vite)  ←──── MetaMask / EIP-1193          │
│  • UserPage   (subscribe / claim)                               │
│  • AdminPage  (declare sinister)                                │
│  • DashboardPage (transparency view)                            │
└───────────────┬─────────────────────────┬───────────────────────┘
                │ axios (read-only)        │ ethers v6 (writes)
                ▼                         ▼
┌──────────────────────────┐   ┌──────────────────────────────────┐
│  Express REST API        │   │  Ethereum Sepolia Testnet         │
│  Node.js / Express 5     │   │                                  │
│  • /api/contract-info    │   │  InsuranceContract.sol           │
│  • /api/insured-users    │   │  0xBF7b35D93622974F005EaFC5553   │
│  • /api/transactions     │   │    FD521D7Be71d4                  │
│  • /api/health           │   │                                  │
│                          │   │  Owner: 0xF2A129097...           │
│  Event cache (in-memory) │──▶│  (Alchemy Sepolia RPC)           │
└──────────────────────────┘   └──────────────────────────────────┘
```

---

## Smart Contract

### Deployment

| Property  | Value                                                                           |
| --------- | ------------------------------------------------------------------------------- |
| Network   | Sepolia Testnet (chain ID 11155111)                                             |
| Address   | `0x3E581d9252d33dc03E5B8da595f7a46BB30219e7`                                    |
| Owner     | `0xF2A1290978ea12B904bDb29087a5E9557E21976c`                                    |
| Etherscan | https://sepolia.etherscan.io/address/0x3E581d9252d33dc03E5B8da595f7a46BB30219e7 |

### Contract: `InsuranceContract.sol`

Written in Solidity, compiled and deployed with Hardhat.

#### State Variables

```solidity
address public owner;
uint256 public premiumAmount;   // ETH required to subscribe
uint256 public payoutAmount;    // ETH paid out per claim
bool    public sinisterDeclared;
mapping(address => bool) public isSubscribed;
mapping(address => bool) public hasClaimed;
address[] private insuredUsers;
```

#### Key Functions

| Function            | Access          | Description                                |
| ------------------- | --------------- | ------------------------------------------ |
| `subscribe()`       | Public, payable | Pay `premiumAmount` ETH to get insured     |
| `declareSinister()` | Owner only      | Irreversibly opens all payouts             |
| `claimPayout()`     | Insured only    | Claim `payoutAmount` ETH after sinister    |
| `getContractInfo()` | View            | Returns all contract state in one call     |
| `getInsuredUsers()` | View            | Returns the full list of insured addresses |

#### Events

```solidity
event Subscription(address indexed user, uint256 premium);
event SinisterDeclared(address indexed declaredBy);
event PayoutClaimed(address indexed user, uint256 amount);
```

#### Security Patterns

- **Reentrancy guard**: uses Checks-Effects-Interactions pattern before ETH transfer in `claimPayout()`
- **Access control**: `onlyOwner` modifier on `declareSinister()`
- **Duplicate check**: reverts if already subscribed or already claimed
- **Balance check**: reverts on `claimPayout()` if contract has insufficient funds
- **Exact payment**: `subscribe()` reverts if `msg.value != premiumAmount`
- **30/30 tests passing** in Hardhat test suite (including reentrancy attack simulation)

---

## Backend API

### Stack

| Package            | Version | Purpose                            |
| ------------------ | ------- | ---------------------------------- |
| Node.js            | 18+     | Runtime                            |
| Express            | 5.x     | HTTP server                        |
| ethers             | 6.x     | Blockchain interaction (read-only) |
| helmet             | 8.x     | Secure HTTP headers                |
| cors               | 2.x     | Origin whitelist                   |
| express-rate-limit | 8.x     | 100 req / 15 min per IP            |
| dotenv             | 17.x    | Environment config                 |

### Environment Variables

Create `backend/.env` (copy from `backend/.env.example`):

```env
PORT=3000
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
CONTRACT_ADDRESS=0x3E581d9252d33dc03E5B8da595f7a46BB30219e7
FRONTEND_URL=http://localhost:5173
CONTRACT_DEPLOY_BLOCK=8500000   # block when contract was deployed
```

### Endpoints

#### `GET /api/health`

Returns server status.

```json
{ "status": "ok", "timestamp": "2025-01-01T00:00:00.000Z" }
```

#### `GET /api/contract-info`

Returns current on-chain state.

```json
{
  "address": "0xBF7b35...",
  "network": "sepolia",
  "premiumAmount": "10000000000000000",
  "premiumEth": "0.01",
  "payoutAmount": "20000000000000000",
  "payoutEth": "0.02",
  "sinisterDeclared": false,
  "insuredCount": "3",
  "contractBalanceWei": "30000000000000000",
  "contractBalanceEth": "0.03"
}
```

#### `GET /api/insured-users`

Returns all insured addresses and their claim status.

```json
{
  "count": 3,
  "users": [
    { "address": "0xabc...", "hasClaimed": false },
    { "address": "0xdef...", "hasClaimed": true }
  ]
}
```

#### `GET /api/transactions`

Returns the full on-chain event history (from deploy block to latest).

Returns `503` while the initial cache is still building (first load).

```json
{
  "total": 5,
  "subscriptions": 3,
  "sinisters": 1,
  "payouts": 1,
  "events": [
    {
      "type": "SUBSCRIPTION",
      "user": "0xabc...",
      "premiumWei": "10000000000000000",
      "txHash": "0x123...",
      "blockNumber": 8501234,
      "explorerUrl": "https://sepolia.etherscan.io/tx/0x123..."
    },
    {
      "type": "SINISTER_DECLARED",
      "declaredBy": "0xF2A129...",
      "txHash": "0x456...",
      "blockNumber": 8502000,
      "explorerUrl": "https://sepolia.etherscan.io/tx/0x456..."
    },
    {
      "type": "PAYOUT",
      "user": "0xabc...",
      "amountWei": "20000000000000000",
      "txHash": "0x789...",
      "blockNumber": 8502100,
      "explorerUrl": "https://sepolia.etherscan.io/tx/0x789..."
    }
  ]
}
```

### Event Cache

The `/api/transactions` endpoint queries blockchain events by fetching logs in chunks of 2 000 blocks (Alchemy free-tier limit). On server start, `eventCache.js` pre-fetches all historical events from `CONTRACT_DEPLOY_BLOCK` to latest. Subsequent requests are served from memory and periodically refreshed.

---

## Frontend

### Stack

| Package          | Version | Purpose                            |
| ---------------- | ------- | ---------------------------------- |
| React            | 19.x    | UI framework                       |
| TypeScript       | 5.9     | Type safety                        |
| Vite             | 7.x     | Build tool / dev server            |
| ethers           | 6.x     | MetaMask interaction (writes)      |
| react-router-dom | 6.x     | Client-side routing                |
| lucide-react     | latest  | Icon library (replaces all emojis) |
| axios            | latest  | HTTP client for REST API           |

### Environment Variables

Create `frontend/.env` (copy from `frontend/.env.example`):

```env
VITE_CONTRACT_ADDRESS=0x3E581d9252d33dc03E5B8da595f7a46BB30219e7
VITE_OWNER_ADDRESS=0xF2A1290978ea12B904bDb29087a5E9557E21976c
VITE_NETWORK=sepolia
VITE_API_URL=http://localhost:3000
```

### Pages & Features

#### `/` — UserPage

The main user-facing insurance portal:

- Displays 5 live stats: premium, payout, contract balance, insured count, sinister status
- **Subscribe**: sends `subscribe()` transaction via MetaMask with `premiumAmount` ETH
- **Claim Payout**: sends `claimPayout()` if sinister declared and user is insured
- Transaction status feedback (pending / success / error) with Etherscan links
- Auto-detects wallet state (not connected, wrong network, already subscribed, already claimed)

#### `/admin` — AdminPage _(owner only)_

Restricted to the contract owner address:

- Shows contract overview: insured count, pool balance, required payout total
- Solvency warning if contract is underfunded before declaring sinister
- **Declare Sinister**: sends `declareSinister()` transaction (irreversible, clearly warned)
- Access control enforced on-page (non-owner sees a deny message)

#### `/dashboard` — DashboardPage

Public transparency view, auto-refreshes every 15 seconds:

- **Insured Users table**: address chips with Etherscan links, claimed / pending badges
- **Transaction History table**: event type pills (Subscribed / Sinister / Payout), address chips, block numbers, tx links

### Custom Hooks

| Hook              | Returns                                     | Description                                         |
| ----------------- | ------------------------------------------- | --------------------------------------------------- |
| `useWallet`       | `WalletState`, `getSigner`, `connectWallet` | MetaMask connection, network detection, owner check |
| `useContractInfo` | `info`, `loading`, `refetch`                | Polls `/api/contract-info` every 15 s               |
| `useContract`     | action functions                            | Wraps `subscribe()` and `claimPayout()` calls       |

### Design System

Premium dark theme built with CSS custom properties:

- **Font**: Inter (Google Fonts)
- **Palette**: multi-layer dark backgrounds with glassmorphism cards (`backdrop-filter: blur`)
- **Accents**: gradient blue-to-purple buttons with glow shadows
- **Icons**: Lucide React throughout (no emojis)
- **Responsive**: single-column on narrow viewports, grid on wider screens

---

## Local Setup

### Prerequisites

- Node.js 18+
- MetaMask browser extension
- Sepolia testnet ETH (faucet: https://faucets.chain.link/sepolia)
- Alchemy account for RPC URL

### 1. Clone & install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment variables

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env: add SEPOLIA_RPC_URL, CONTRACT_ADDRESS, FRONTEND_URL, CONTRACT_DEPLOY_BLOCK

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env: add VITE_CONTRACT_ADDRESS, VITE_OWNER_ADDRESS, VITE_API_URL
```

### 3. Start the backend

```bash
cd backend
npm run dev     # uses nodemon for hot-reload
# or
npm start       # production
```

Backend runs on `http://localhost:3000`.

### 4. Start the frontend

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`.

### 5. Connect MetaMask

1. Open `http://localhost:5173`
2. Click **Connect Wallet**
3. Approve the MetaMask connection prompt
4. Switch to **Sepolia** testnet if prompted

---

## Smart Contract Development

The contract source, tests, and deploy script live in the `blockchain/` folder (Hardhat project).

```bash
cd blockchain
npm install

# Compile
npx hardhat compile

# Run tests (30 tests)
npx hardhat test

# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia
```

### Test Coverage

The test suite covers:

- `subscribe()`: success, wrong value, double-subscribe
- `declareSinister()`: access check (non-owner reverts), idempotency
- `claimPayout()`: success, before sinister (reverts), double-claim (reverts), underfunded contract, reentrancy attack simulation
- `getContractInfo()` & `getInsuredUsers()`: data integrity across state changes
- Edge cases: zero-balance payouts, contract balance tracking

---

## Security

| Layer          | Measure                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Smart contract | Checks-Effects-Interactions, reentrancy guard, strict access control                                                     |
| Backend        | Helmet (CSP, HSTS, X-Frame-Options), CORS origin whitelist, rate limiting, no private keys                               |
| Frontend       | No secrets in client code, all env vars prefixed `VITE_` (public), MetaMask signs txs (private key never leaves browser) |
| Network        | All writes go through MetaMask — backend is strictly read-only                                                           |

---

## Project Structure

```
Projet Security/
├── README.md
├── cahier de charge/          # Project specification document
│
├── blockchain/                # Hardhat project
│   ├── contracts/
│   │   └── InsuranceContract.sol
│   ├── test/
│   │   └── InsuranceContract.test.js  (30 tests)
│   ├── scripts/
│   │   └── deploy.js
│   └── hardhat.config.js
│
├── backend/                   # Express REST API
│   ├── index.js               # Server entry point
│   ├── .env.example
│   └── src/
│       ├── config/
│       │   └── eventCache.js  # Block-chunked event fetcher + in-memory cache
│       ├── middleware/
│       │   └── security.js    # Helmet + CORS + rate-limit config
│       └── routes/
│           ├── contractInfo.js
│           ├── insuredUsers.js
│           └── transactions.js
│
└── frontend/                  # React + TypeScript (Vite)
    ├── index.html
    ├── vite.config.ts
    └── src/
        ├── App.tsx            # Router + Navbar + WalletConnect
        ├── index.css          # Global design system (CSS tokens, components)
        ├── config/
        │   └── contract.ts    # Address, ABI, env var exports
        ├── types/
        │   └── index.ts       # TypeScript interfaces
        ├── hooks/
        │   ├── useWallet.ts
        │   ├── useContractInfo.ts
        │   └── useContract.ts
        ├── components/
        │   └── WalletConnect.tsx
        └── pages/
            ├── UserPage.tsx
            ├── AdminPage.tsx
            └── DashboardPage.tsx
```

---

## Deployed Contract — Quick Reference

```
Network  : Sepolia (chainId 11155111)
Contract : 0x3E581d9252d33dc03E5B8da595f7a46BB30219e7
Owner    : 0xF2A1290978ea12B904bDb29087a5E9557E21976c
Explorer : https://sepolia.etherscan.io/address/0x3E581d9252d33dc03E5B8da595f7a46BB30219e7
```
