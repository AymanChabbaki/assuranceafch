// src/routes/insuredUsers.js
// GET /api/insured-users
// Returns the list of subscribed wallet addresses and their claim status

const { Router } = require("express");
const { contract } = require("../config/contract");

const router = Router();

router.get("/", async (req, res) => {
  try {
    const addresses = await contract.getInsuredUsers();

    // For each address, also fetch whether they have claimed
    const users = await Promise.all(
      addresses.map(async (addr) => {
        const claimed = await contract.hasClaimed(addr);
        return { address: addr, hasClaimed: claimed };
      })
    );

    res.json({
      count: users.length,
      users,
    });
  } catch (err) {
    console.error("[insuredUsers]", err.message);
    res.status(502).json({ error: "Failed to read insured users from blockchain" });
  }
});

module.exports = router;
