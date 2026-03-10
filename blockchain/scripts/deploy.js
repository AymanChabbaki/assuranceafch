// scripts/deploy.js
// Run locally:  npx hardhat run scripts/deploy.js
// Run on Sepolia: npx hardhat run scripts/deploy.js --network sepolia

const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  // ── Contract Parameters ──────────────────────────────────────────────────
  // Adjust these values before deploying to Sepolia testnet
  const premiumAmount = ethers.parseEther("0.01");  // 0.01 ETH premium
  const payoutAmount  = ethers.parseEther("0.05");  // 0.05 ETH payout per user

  // The deployer becomes the initial owner (admin / oracle)
  const initialOwner = deployer.address;

  // ── Deploy ───────────────────────────────────────────────────────────────
  const InsuranceContract = await ethers.getContractFactory("InsuranceContract");
  const insurance = await InsuranceContract.deploy(
    premiumAmount,
    payoutAmount,
    initialOwner
  );

  await insurance.waitForDeployment();
  const contractAddress = await insurance.getAddress();

  console.log("\n✅ InsuranceContract deployed to:", contractAddress);
  console.log("   Premium   :", ethers.formatEther(premiumAmount), "ETH");
  console.log("   Payout    :", ethers.formatEther(payoutAmount), "ETH");
  console.log("   Owner     :", initialOwner);
  console.log("\n📋 Add this to your frontend .env:");
  console.log(`   VITE_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`   VITE_NETWORK=sepolia\n`);

  // ── Optional: Fund the contract to cover initial payouts ─────────────────
  // Uncomment on local/testnet if you want the contract pre-funded
  //
  // const fundTx = await insurance.fundContract({
  //   value: ethers.parseEther("1.0"),
  // });
  // await fundTx.wait();
  // console.log("✅ Contract funded with 1 ETH");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
