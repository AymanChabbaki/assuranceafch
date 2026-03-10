// test/InsuranceContract.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

// ─── Test Parameters ──────────────────────────────────────────────────────────
const PREMIUM = ethers.parseEther("0.01");   // 0.01 ETH
const PAYOUT  = ethers.parseEther("0.05");   // 0.05 ETH

// ─── Fixture ─────────────────────────────────────────────────────────────────
async function deployInsuranceFixture() {
  const [owner, user1, user2, user3, attacker] = await ethers.getSigners();

  const InsuranceContract = await ethers.getContractFactory("InsuranceContract");
  const insurance = await InsuranceContract.deploy(PREMIUM, PAYOUT, owner.address);
  await insurance.waitForDeployment();

  return { insurance, owner, user1, user2, user3, attacker };
}

async function deployAndFundFixture() {
  const ctx = await deployInsuranceFixture();
  // Fund contract with enough ETH for 10 payouts
  await ctx.insurance.fundContract({ value: ethers.parseEther("1.0") });
  return ctx;
}

// ─────────────────────────────────────────────────────────────────────────────
describe("InsuranceContract", function () {

  // ─── Deployment ────────────────────────────────────────────────────────────
  describe("Deployment", function () {
    it("should set the correct owner", async function () {
      const { insurance, owner } = await loadFixture(deployInsuranceFixture);
      expect(await insurance.owner()).to.equal(owner.address);
    });

    it("should set the correct premium amount", async function () {
      const { insurance } = await loadFixture(deployInsuranceFixture);
      expect(await insurance.premiumAmount()).to.equal(PREMIUM);
    });

    it("should set the correct payout amount", async function () {
      const { insurance } = await loadFixture(deployInsuranceFixture);
      expect(await insurance.payoutAmount()).to.equal(PAYOUT);
    });

    it("should start with no insured users", async function () {
      const { insurance } = await loadFixture(deployInsuranceFixture);
      expect(await insurance.getInsuredCount()).to.equal(0);
    });

    it("should start with sinister not declared", async function () {
      const { insurance } = await loadFixture(deployInsuranceFixture);
      expect(await insurance.sinisterDeclared()).to.be.false;
    });

    it("should revert if premium is 0", async function () {
      const [owner] = await ethers.getSigners();
      const InsuranceContract = await ethers.getContractFactory("InsuranceContract");
      await expect(
        InsuranceContract.deploy(0, PAYOUT, owner.address)
      ).to.be.revertedWith("Premium must be > 0");
    });

    it("should revert if payout is 0", async function () {
      const [owner] = await ethers.getSigners();
      const InsuranceContract = await ethers.getContractFactory("InsuranceContract");
      await expect(
        InsuranceContract.deploy(PREMIUM, 0, owner.address)
      ).to.be.revertedWith("Payout must be > 0");
    });
  });

  // ─── subscribe() ─────────────────────────────────────────────────────────
  describe("subscribe()", function () {
    it("should allow a user to subscribe with exact premium", async function () {
      const { insurance, user1 } = await loadFixture(deployInsuranceFixture);
      await expect(insurance.connect(user1).subscribe({ value: PREMIUM }))
        .to.emit(insurance, "Subscribed")
        .withArgs(user1.address, PREMIUM, anyValue);

      expect(await insurance.isSubscribed(user1.address)).to.be.true;
    });

    it("should add user to the insured list", async function () {
      const { insurance, user1 } = await loadFixture(deployInsuranceFixture);
      await insurance.connect(user1).subscribe({ value: PREMIUM });
      const users = await insurance.getInsuredUsers();
      expect(users).to.include(user1.address);
      expect(await insurance.getInsuredCount()).to.equal(1);
    });

    it("should update contract balance after subscription", async function () {
      const { insurance, user1 } = await loadFixture(deployInsuranceFixture);
      await insurance.connect(user1).subscribe({ value: PREMIUM });
      expect(await insurance.getContractBalance()).to.equal(PREMIUM);
    });

    it("should revert if user sends too little ETH", async function () {
      const { insurance, user1 } = await loadFixture(deployInsuranceFixture);
      await expect(
        insurance.connect(user1).subscribe({ value: ethers.parseEther("0.001") })
      ).to.be.revertedWithCustomError(insurance, "IncorrectPremium");
    });

    it("should revert if user sends too much ETH", async function () {
      const { insurance, user1 } = await loadFixture(deployInsuranceFixture);
      await expect(
        insurance.connect(user1).subscribe({ value: ethers.parseEther("1.0") })
      ).to.be.revertedWithCustomError(insurance, "IncorrectPremium");
    });

    it("should revert if user subscribes twice", async function () {
      const { insurance, user1 } = await loadFixture(deployInsuranceFixture);
      await insurance.connect(user1).subscribe({ value: PREMIUM });
      await expect(
        insurance.connect(user1).subscribe({ value: PREMIUM })
      ).to.be.revertedWithCustomError(insurance, "AlreadySubscribed");
    });

    it("should allow multiple users to subscribe", async function () {
      const { insurance, user1, user2, user3 } = await loadFixture(deployInsuranceFixture);
      await insurance.connect(user1).subscribe({ value: PREMIUM });
      await insurance.connect(user2).subscribe({ value: PREMIUM });
      await insurance.connect(user3).subscribe({ value: PREMIUM });
      expect(await insurance.getInsuredCount()).to.equal(3);
    });
  });

  // ─── declareSinister() ───────────────────────────────────────────────────
  describe("declareSinister()", function () {
    it("should allow owner to declare a sinister", async function () {
      const { insurance, owner } = await loadFixture(deployInsuranceFixture);
      await expect(insurance.connect(owner).declareSinister())
        .to.emit(insurance, "SinisterDeclared")
        .withArgs(owner.address, anyValue);

      expect(await insurance.sinisterDeclared()).to.be.true;
    });

    it("should revert if called by non-owner", async function () {
      const { insurance, user1 } = await loadFixture(deployInsuranceFixture);
      await expect(
        insurance.connect(user1).declareSinister()
      ).to.be.revertedWithCustomError(insurance, "OwnableUnauthorizedAccount");
    });

    it("should revert if sinister already declared", async function () {
      const { insurance, owner } = await loadFixture(deployInsuranceFixture);
      await insurance.connect(owner).declareSinister();
      await expect(
        insurance.connect(owner).declareSinister()
      ).to.be.revertedWithCustomError(insurance, "SinisterAlreadyDeclared");
    });
  });

  // ─── claim() ─────────────────────────────────────────────────────────────
  describe("claim()", function () {
    it("should allow an insured user to claim after sinister", async function () {
      const { insurance, owner, user1 } = await loadFixture(deployAndFundFixture);
      await insurance.connect(user1).subscribe({ value: PREMIUM });
      await insurance.connect(owner).declareSinister();

      const balanceBefore = await ethers.provider.getBalance(user1.address);
      const tx = await insurance.connect(user1).claim();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(user1.address);

      expect(balanceAfter).to.be.closeTo(
        balanceBefore + PAYOUT - gasUsed,
        ethers.parseEther("0.001") // tolerance
      );
    });

    it("should emit PayoutClaimed event", async function () {
      const { insurance, owner, user1 } = await loadFixture(deployAndFundFixture);
      await insurance.connect(user1).subscribe({ value: PREMIUM });
      await insurance.connect(owner).declareSinister();

      await expect(insurance.connect(user1).claim())
        .to.emit(insurance, "PayoutClaimed")
        .withArgs(user1.address, PAYOUT, anyValue);
    });

    it("should mark user as claimed", async function () {
      const { insurance, owner, user1 } = await loadFixture(deployAndFundFixture);
      await insurance.connect(user1).subscribe({ value: PREMIUM });
      await insurance.connect(owner).declareSinister();
      await insurance.connect(user1).claim();
      expect(await insurance.hasClaimed(user1.address)).to.be.true;
    });

    it("should revert if sinister not declared", async function () {
      const { insurance, user1 } = await loadFixture(deployAndFundFixture);
      await insurance.connect(user1).subscribe({ value: PREMIUM });
      await expect(
        insurance.connect(user1).claim()
      ).to.be.revertedWithCustomError(insurance, "SinisterNotDeclared");
    });

    it("should revert if user is not subscribed", async function () {
      const { insurance, owner, user1 } = await loadFixture(deployAndFundFixture);
      await insurance.connect(owner).declareSinister();
      await expect(
        insurance.connect(user1).claim()
      ).to.be.revertedWithCustomError(insurance, "NotSubscribed");
    });

    it("should revert if user claims twice", async function () {
      const { insurance, owner, user1 } = await loadFixture(deployAndFundFixture);
      await insurance.connect(user1).subscribe({ value: PREMIUM });
      await insurance.connect(owner).declareSinister();
      await insurance.connect(user1).claim();
      await expect(
        insurance.connect(user1).claim()
      ).to.be.revertedWithCustomError(insurance, "AlreadyClaimed");
    });

    it("should revert if contract has insufficient balance", async function () {
      const { insurance, owner, user1 } = await loadFixture(deployInsuranceFixture);
      // Do NOT fund the contract — only PREMIUM is in it
      await insurance.connect(user1).subscribe({ value: PREMIUM });
      await insurance.connect(owner).declareSinister();
      await expect(
        insurance.connect(user1).claim()
      ).to.be.revertedWithCustomError(insurance, "InsufficientContractBalance");
    });

    it("should allow multiple users to each claim once", async function () {
      const { insurance, owner, user1, user2 } = await loadFixture(deployAndFundFixture);
      await insurance.connect(user1).subscribe({ value: PREMIUM });
      await insurance.connect(user2).subscribe({ value: PREMIUM });
      await insurance.connect(owner).declareSinister();
      await insurance.connect(user1).claim();
      await insurance.connect(user2).claim();
      expect(await insurance.hasClaimed(user1.address)).to.be.true;
      expect(await insurance.hasClaimed(user2.address)).to.be.true;
    });
  });

  // ─── fundContract() ──────────────────────────────────────────────────────
  describe("fundContract()", function () {
    it("should allow owner to fund the contract", async function () {
      const { insurance, owner } = await loadFixture(deployInsuranceFixture);
      await expect(
        insurance.connect(owner).fundContract({ value: ethers.parseEther("1.0") })
      ).to.emit(insurance, "ContractFunded");
      expect(await insurance.getContractBalance()).to.equal(ethers.parseEther("1.0"));
    });

    it("should revert if non-owner tries to fund via fundContract()", async function () {
      const { insurance, user1 } = await loadFixture(deployInsuranceFixture);
      await expect(
        insurance.connect(user1).fundContract({ value: ethers.parseEther("1.0") })
      ).to.be.revertedWithCustomError(insurance, "OwnableUnauthorizedAccount");
    });

    it("should accept ETH via receive() fallback", async function () {
      const { insurance, user1 } = await loadFixture(deployInsuranceFixture);
      await user1.sendTransaction({
        to: await insurance.getAddress(),
        value: ethers.parseEther("0.5"),
      });
      expect(await insurance.getContractBalance()).to.equal(ethers.parseEther("0.5"));
    });
  });

  // ─── getContractInfo() ───────────────────────────────────────────────────
  describe("getContractInfo()", function () {
    it("should return correct contract info", async function () {
      const { insurance, owner, user1 } = await loadFixture(deployInsuranceFixture);
      await insurance.connect(user1).subscribe({ value: PREMIUM });

      const [premium, payout, sinister, count, balance] =
        await insurance.getContractInfo();

      expect(premium).to.equal(PREMIUM);
      expect(payout).to.equal(PAYOUT);
      expect(sinister).to.be.false;
      expect(count).to.equal(1);
      expect(balance).to.equal(PREMIUM);
    });
  });

  // ─── Security: Reentrancy Attack ─────────────────────────────────────────
  describe("Security: Reentrancy Attack", function () {
    it("should NOT be vulnerable to reentrancy on claim()", async function () {
      const [owner, attacker] = await ethers.getSigners();

      // Deploy the attacker contract
      const Attacker = await ethers.getContractFactory("ReentrancyAttacker");
      const attackerContract = await Attacker.deploy();
      await attackerContract.waitForDeployment();

      // Deploy and fund the insurance
      const InsuranceContract = await ethers.getContractFactory("InsuranceContract");
      const insurance = await InsuranceContract.deploy(PREMIUM, PAYOUT, owner.address);
      await insurance.waitForDeployment();
      await insurance.fundContract({ value: ethers.parseEther("1.0") });

      // Attacker subscribes via the attacker contract
      await attackerContract.subscribe(await insurance.getAddress(), { value: PREMIUM });

      // Declare sinister
      await insurance.declareSinister();

      // Attempt reentrancy attack — the guard should block re-entry.
      // The first claim() call should SUCCEED (try/catch in attacker's receive()).
      // Only PAYOUT should leave the contract, not more.
      const contractBalanceBefore = await ethers.provider.getBalance(
        await insurance.getAddress()
      );

      await attackerContract.attack(await insurance.getAddress());

      const contractBalanceAfter = await ethers.provider.getBalance(
        await insurance.getAddress()
      );

      // Only PAYOUT should have left — reentrancy did NOT drain extra funds
      expect(contractBalanceBefore - contractBalanceAfter).to.equal(PAYOUT);

      // Attacker cannot claim again
      await expect(
        attackerContract.attack(await insurance.getAddress())
      ).to.be.revertedWithCustomError(insurance, "AlreadyClaimed");
    });
  });
});

// ─── Helper ──────────────────────────────────────────────────────────────────
async function getTimestamp() {
  const block = await ethers.provider.getBlock("latest");
  return block.timestamp;
}
