# 🎓 DApp Assurance — Presentation Guide

> **Blockchain-Based Decentralized Insurance Platform**
> 
> **Presented by:** [Your Name]
> **Course:** [Course Name]
> **Date:** [Presentation Date]

---

## 📋 Presentation Outline (15-20 minutes)

### 1. Introduction (2 min)
**What is DApp Assurance?**
- A decentralized insurance platform built on Ethereum (Sepolia Testnet)
- Users pay a premium → Get covered → Claim payout after incident
- No middleman, fully transparent, automated by smart contracts

**Problem Solved:**
- Traditional insurance: Slow claims, opaque processes, trust issues
- Our solution: Instant payouts, fully transparent, trustless via blockchain

---

### 2. Architecture Overview (3 min)

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
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
│  • /api/insured-users    │   │  [Your Contract Address]         │
│  • /api/transactions     │   │                                  │
│  • /api/health           │   │  Owner: [Your Wallet]            │
│                          │   │  (Alchemy Sepolia RPC)           │
│  Event cache (in-memory) │──▶│                                  │
└──────────────────────────┘   └──────────────────────────────────┘
```

**Tech Stack:**
| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite, Ethers.js v6 |
| **Backend** | Node.js, Express 5, Ethers.js (read-only) |
| **Blockchain** | Solidity 0.8.20, Hardhat, OpenZeppelin |
| **Network** | Ethereum Sepolia Testnet |
| **Wallet** | MetaMask (EIP-1193) |

---

### 3. Smart Contract Demo (5 min)

**Show the contract code:**
```bash
cd blockchain/contracts
cat InsuranceContract.sol
```

**Key Features to Highlight:**

| Feature | Implementation | Security Benefit |
|---------|---------------|------------------|
| **Pull over Push** | Users claim individually (`claim()`) | No DoS via gas limit |
| **Reentrancy Guard** | OpenZeppelin `nonReentrant` modifier | Prevents reentrancy attacks |
| **Access Control** | OpenZeppelin `Ownable` | Only owner declares sinister |
| **Checks-Effects-Interactions** | State changes before ETH transfer | Prevents reentrancy |
| **Exact Payment** | `msg.value == premiumAmount` | No over/under payment |

**Contract Functions:**
- `subscribe()` — Pay premium, get insured
- `claim()` — Claim payout after sinister (Pull pattern)
- `declareSinister()` — Owner triggers payouts
- `fundContract()` — Owner adds ETH to contract

---

### 4. Live Demo Script (8 min)

#### Pre-Demo Setup (Do before class)
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

### 🎬 RECOMMENDED: Deploy Fresh Contract During Demo

**Why?** Shows the full deployment process and starts with a clean slate (0 users).

#### Step 0: Deploy New Contract (2 min)

**Show terminal:**
```bash
cd blockchain
npx hardhat run scripts/deploy.js --network sepolia
```

**Expected output:**
```
Deploying with account: 0xE0C29f8206311A93f87Dfc6449a16C81f0661341
Account balance: 0.089 ETH

✅ InsuranceContract deployed to: 0x[NEW_ADDRESS]
   Premium   : 0.01 ETH
   Payout    : 0.05 ETH
   Owner     : 0xE0C29f8206311A93f87Dfc6449a16C81f0661341
```

**Copy the new contract address!**

---

#### Step 0.5: Update Configuration (1 min)

**Update all .env files with the NEW contract address:**

**`frontend/.env`:**
```env
VITE_CONTRACT_ADDRESS=0x[NEW_ADDRESS]
VITE_OWNER_ADDRESS=0xE0C29f8206311A93f87Dfc6449a16C81f0661341
VITE_NETWORK=sepolia
VITE_API_URL=http://localhost:3000
```

**`backend/.env`:**
```env
PORT=3000
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
CONTRACT_ADDRESS=0x[NEW_ADDRESS]
FRONTEND_URL=http://localhost:5173
CONTRACT_DEPLOY_BLOCK=[RECENT_BLOCK_NUMBER]
```

**Restart both servers:**
```bash
# Stop old servers (Ctrl+C)
# Then restart:
cd backend && npm run dev
cd frontend && npm run dev
```

**Refresh browser** — now connected to fresh contract!

---

### Demo Steps (With Fresh Contract):

**Step 1: Show Landing Page (30 sec)**
- Open http://localhost:5173
- Point out: **Contract Address** in footer (freshly deployed!)
- Show: 0 insured users, clean state
- Professional dark theme UI

**Step 2: Connect Your Account (30 sec)**
- Click "Connect Wallet"
- Connect with your **Owner Account** (`0xE0C29...61341`)
- Show: "Owner" badge appears!
- Point out: "Admin" link is visible (because you're the owner)

**Step 3: Subscribe to Insurance (1 min)**
- You're acting as **User** now (even though you're owner)
- Go to "My Insurance" page
- Show: "Not subscribed" status
- Click **"Subscribe — 0.01 ETH"**
- MetaMask popup → Confirm transaction
- Show: "Successfully subscribed!" + transaction hash
- Click Etherscan link to show on-chain proof

**Step 4: Verify Subscription (30 sec)**
- Dashboard: Your address appears in insured users list
- Show: "Subscription: Active" in Your Status card
- Point out: You paid 0.01 ETH, now covered for 0.05 ETH

**Step 5: Admin Panel — Fund Contract (1 min)**
- Click **"Admin"** in navbar
- Show: **Underfunded warning!**
  - Contract has: ~0.01 ETH (from your premium)
  - Needs: 0.05 ETH (for payout)
  - Shortage: ~0.04 ETH
- **Fund Contract:** Enter `0.05` ETH
- Click **"Fund Contract"**
- MetaMask → Confirm
- Show: Pool Coverage now at 100%!

**Step 6: Declare Sinister (1 min)**
- Show: "Declare Sinister" section
- Click button → **Confirmation dialog appears**
- Explain: This is irreversible! Once declared, payouts open.
- Click **"Yes, Declare Sinister"**
- MetaMask → Confirm
- Show: "Sinister declared successfully!"
- Sinister status changes to "Declared"

**Step 7: Claim Payout (1 min)**
- Go back to **"My Insurance"**
- Show: **"Claim Payout — 0.05 ETH"** button (now active!)
- Explain: You paid 0.01 ETH, now getting 0.05 ETH back
- Click → Confirm in MetaMask
- Show: "Payout of 0.05 ETH received!"

**Step 8: Final State (30 sec)**
- Dashboard: Shows "Claimed" status
- Transaction History: 
  1. 📝 Subscribed (paid 0.01 ETH)
  2. ⚡ Sinister Declared (by admin)
  3. 💰 Payout Claimed (received 0.05 ETH)
- **Profit: 0.04 ETH!** (minus gas fees)
- All on blockchain, fully transparent, immutable!

---

### 📝 Alternative: Using Existing Contract

If you prefer not to deploy during presentation, use the existing contract:

**Skip Step 0 & 0.5**, start directly from **Step 1** with the existing contract address.

**Pre-setup before class:**
- Update `.env` files with existing contract
- Start servers
- Have 0.01 ETH in your wallet for subscription

---

### 5. Security Features (2 min)

**Smart Contract Security:**
```solidity
// Reentrancy protection
function claim() external nonReentrant {
    // Checks
    if (!sinisterDeclared) revert SinisterNotDeclared();
    if (!isSubscribed[msg.sender]) revert NotSubscribed();
    if (hasClaimed[msg.sender]) revert AlreadyClaimed();
    
    // Effects (state change BEFORE transfer)
    hasClaimed[msg.sender] = true;
    
    // Interactions (external call last)
    (bool success, ) = payable(msg.sender).call{value: payoutAmount}("");
}
```

**Backend Security:**
- Helmet.js (CSP, HSTS, secure headers)
- CORS origin whitelist
- Rate limiting (100 req/15min)
- No private keys stored

**Frontend Security:**
- No secrets in client code
- MetaMask handles signing (keys never leave browser)
- Environment variables properly scoped

---

### 6. Key Takeaways (1 min)

| Aspect | What We Built |
|--------|---------------|
| **Decentralization** | No central authority, smart contract rules |
| **Transparency** | All transactions on public blockchain |
| **Security** | OpenZeppelin standards, reentrancy protection |
| **UX** | Modern React UI, MetaMask integration |
| **Scalability** | Pull pattern prevents gas limit issues |

---

## 🎯 Q&A Preparation

### Expected Questions:

**Q: Why use blockchain for insurance?**
> A: Transparency (all transactions public), automation (smart contracts execute without human intervention), trustless (no need to trust a company), global access (anyone with internet).

**Q: What prevents someone from draining the contract?**
> A: Multiple protections: (1) Only subscribed users can claim, (2) Can only claim once, (3) ReentrancyGuard prevents recursive calls, (4) Checks-Effects-Interactions pattern.

**Q: Why "Pull over Push" pattern?**
> A: If we pushed payouts to all users in a loop, gas limit could be exceeded with many users. Pull pattern lets each user claim individually — no gas limit risk.

**Q: How do you handle rate limiting with Alchemy?**
> A: We implemented batch processing with delays (500ms between requests) and exponential backoff retry logic for failed requests.

**Q: What happens if the contract is underfunded?**
> A: The claim transaction reverts with `InsufficientContractBalance` error. Admin must fund the contract before users can claim.

---

## 📁 Files to Show (If Asked)

```
Project Structure:
├── blockchain/
│   ├── contracts/InsuranceContract.sol    ← Smart contract
│   ├── test/InsuranceContract.test.js     ← 30 tests
│   └── scripts/deploy.js                  ← Deployment script
├── backend/
│   ├── index.js                           ← Express server
│   └── src/config/eventCache.js           ← Rate limiting fix
└── frontend/
    ├── src/pages/AdminPage.tsx            ← Admin UI
    ├── src/pages/UserPage.tsx             ← User UI
    └── src/hooks/useWallet.ts             ← MetaMask integration
```

---

## ✅ Pre-Presentation Checklist

### If Deploying Fresh Contract During Demo (Recommended):
- [ ] Backend running on http://localhost:3000
- [ ] Frontend running on http://localhost:5173
- [ ] MetaMask installed and configured
- [ ] **Your wallet has 0.02+ Sepolia ETH** (for deploy + subscription + gas)
- [ ] Alchemy API key working in `blockchain/.env`
- [ ] Private key configured in `blockchain/.env`
- [ ] Tested deployment command: `npx hardhat run scripts/deploy.js --network sepolia`
- [ ] Know how to update `.env` files quickly
- [ ] Slides prepared (optional)
- [ ] Backup: Screenshots of each step

### If Using Existing Contract:
- [ ] Backend running on http://localhost:3000
- [ ] Frontend running on http://localhost:5173
- [ ] MetaMask installed and configured
- [ ] Your wallet has 0.01+ Sepolia ETH (for subscription)
- [ ] `.env` files updated with existing contract address
- [ ] Tested full flow: Subscribe → Fund → Declare → Claim
- [ ] Slides prepared (optional)
- [ ] Backup: Screenshots of each step

### Minimum ETH Requirements:
| Action | ETH Needed |
|--------|------------|
| Deploy contract | ~0.001 ETH (gas) |
| Subscribe | 0.01 ETH + gas |
| Fund contract | 0.05 ETH + gas |
| Declare sinister | ~0.0001 ETH (gas) |
| Claim payout | ~0.0001 ETH (gas) |
| **TOTAL** | **~0.07 ETH** |

---

## 🚀 Quick Start Commands

### Standard Startup (Existing Contract):
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend  
cd frontend && npm run dev

# Open: http://localhost:5173
```

### Fresh Deployment (During Presentation):
```bash
# Step 1: Deploy new contract
cd blockchain
npx hardhat run scripts/deploy.js --network sepolia

# Step 2: Copy the new contract address from output

# Step 3: Update frontend/.env
# VITE_CONTRACT_ADDRESS=0x[NEW_ADDRESS]

# Step 4: Update backend/.env
# CONTRACT_ADDRESS=0x[NEW_ADDRESS]
# CONTRACT_DEPLOY_BLOCK=[Recent Block]

# Step 5: Restart servers
cd backend && npm run dev
cd frontend && npm run dev

# Step 6: Refresh browser and demo!
```

### Quick .env Update Script:
```bash
# Replace these with your actual values:
NEW_CONTRACT="0x..."
NEW_BLOCK="1048xxxx"

# Update frontend
sed -i '' "s/VITE_CONTRACT_ADDRESS=.*/VITE_CONTRACT_ADDRESS=$NEW_CONTRACT/" frontend/.env

# Update backend  
sed -i '' "s/CONTRACT_ADDRESS=.*/CONTRACT_ADDRESS=$NEW_CONTRACT/" backend/.env
sed -i '' "s/CONTRACT_DEPLOY_BLOCK=.*/CONTRACT_DEPLOY_BLOCK=$NEW_BLOCK/" backend/.env
```

---

## 📊 Contract Details (Fill In)

| | Value |
|--|-------|
| **Contract Address** | `0x...` |
| **Network** | Sepolia Testnet |
| **Owner Address** | `0x...` |
| **Premium** | 0.01 ETH |
| **Payout** | 0.05 ETH |
| **Etherscan** | https://sepolia.etherscan.io/address/0x... |

---

## 🎓 Presentation Tips

### During Deployment Step:
- **Narrate:** "I'm now deploying a fresh smart contract to the Sepolia testnet..."
- **Point out:** The contract address, your wallet as owner, premium/payout amounts
- **Explain:** This is a one-time setup — in production, this would be done by the insurance company

### When Updating .env:
- **Narrate:** "Now I need to connect my application to this new contract..."
- **Show:** The configuration files (briefly)
- **Explain:** Environment variables keep sensitive data out of code

### When Subscribing:
- **Narrate:** "Now I'm acting as a customer buying insurance..."
- **Point out:** Even though I'm the owner, I can also be a user
- **Show:** MetaMask transaction confirmation

### After Claiming:
- **Calculate:** "I paid 0.01 ETH and received 0.05 ETH — that's the insurance payout!"
- **Emphasize:** All automated, no human approval needed

---

**Good luck with your presentation! 🎓🚀**
