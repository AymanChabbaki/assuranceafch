// src/routes/contractInfo.js
// GET /api/contract-info
// Returns contract address, ABI, and live state (premium, payout, sinister flag, balance)

const { Router } = require("express");
const { contract, CONTRACT_ABI, CONTRACT_ADDRESS } = require("../config/contract");

const router = Router();

router.get("/", async (req, res) => {
  try {
    const [premium, payout, sinisterDeclared, insuredCount, balance] =
      await contract.getContractInfo();

    res.json({
      address: CONTRACT_ADDRESS,
      network: "sepolia",
      premiumAmount: premium.toString(),        // in wei
      premiumEth: formatEth(premium),           // human-readable
      payoutAmount: payout.toString(),
      payoutEth: formatEth(payout),
      sinisterDeclared,
      insuredCount: insuredCount.toString(),
      contractBalanceWei: balance.toString(),
      contractBalanceEth: formatEth(balance),
      abi: CONTRACT_ABI,
    });
  } catch (err) {
    console.error("[contractInfo]", err.message);
    res.status(502).json({ error: "Failed to read contract info from blockchain" });
  }
});

function formatEth(wei) {
  // Manual conversion to avoid importing the full ethers in routes
  return (Number(wei) / 1e18).toFixed(4);
}

module.exports = router;
