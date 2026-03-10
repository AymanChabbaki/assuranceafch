// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title InsuranceContract
 * @notice Decentralized insurance contract using Pull over Push payment pattern.
 * Users subscribe by paying a premium. The owner (oracle/admin) declares a sinister.
 * Each insured user then pulls (claims) their own payout.
 *
 * Security controls:
 * - ReentrancyGuard: prevents reentrancy attacks on claim()
 * - Ownable: only owner can declare a sinister
 * - Pull over Push: no payout loops, users claim individually (no DoS risk)
 * - No personal data stored on-chain (GDPR)
 */
contract InsuranceContract is Ownable, ReentrancyGuard {
    // ─── State Variables ────────────────────────────────────────────────────

    /// @notice Premium amount in wei that a user must pay to subscribe
    uint256 public immutable premiumAmount;

    /// @notice Payout amount in wei that each insured user can claim after a sinister
    uint256 public immutable payoutAmount;

    /// @notice Whether a sinister has been declared by the owner
    bool public sinisterDeclared;

    /// @notice Tracks subscribed users: address => subscribed
    mapping(address => bool) public isSubscribed;

    /// @notice Tracks whether a user has already claimed their payout
    mapping(address => bool) public hasClaimed;

    /// @notice Ordered list of all insured addresses (for frontend display)
    address[] private insuredUsers;

    // ─── Events ─────────────────────────────────────────────────────────────

    event Subscribed(address indexed user, uint256 premium, uint256 timestamp);
    event SinisterDeclared(address indexed owner, uint256 timestamp);
    event PayoutClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event ContractFunded(address indexed sender, uint256 amount);

    // ─── Errors ─────────────────────────────────────────────────────────────

    error AlreadySubscribed();
    error IncorrectPremium(uint256 sent, uint256 required);
    error SinisterNotDeclared();
    error AlreadyClaimed();
    error NotSubscribed();
    error InsufficientContractBalance(uint256 available, uint256 required);
    error SinisterAlreadyDeclared();
    error TransferFailed();

    // ─── Constructor ────────────────────────────────────────────────────────

    /**
     * @param _premiumAmount  Amount in wei each user must pay to subscribe
     * @param _payoutAmount   Amount in wei each insured user receives on claim
     * @param initialOwner    Address of the contract admin / oracle
     */
    constructor(
        uint256 _premiumAmount,
        uint256 _payoutAmount,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_premiumAmount > 0, "Premium must be > 0");
        require(_payoutAmount > 0, "Payout must be > 0");
        premiumAmount = _premiumAmount;
        payoutAmount = _payoutAmount;
    }

    // ─── User Functions ──────────────────────────────────────────────────────

    /**
     * @notice Subscribe to the insurance by paying the exact premium.
     * @dev Reverts if already subscribed or incorrect amount sent.
     */
    function subscribe() external payable {
        if (isSubscribed[msg.sender]) revert AlreadySubscribed();
        if (msg.value != premiumAmount) revert IncorrectPremium(msg.value, premiumAmount);

        isSubscribed[msg.sender] = true;
        insuredUsers.push(msg.sender);

        emit Subscribed(msg.sender, msg.value, block.timestamp);
    }

    /**
     * @notice Claim payout after a sinister has been declared.
     * @dev Uses Pull over Push pattern. Protected by nonReentrant.
     *      Checks-Effects-Interactions order is strictly followed.
     */
    function claim() external nonReentrant {
        // ── CHECKS ──────────────────────────────────
        if (!sinisterDeclared) revert SinisterNotDeclared();
        if (!isSubscribed[msg.sender]) revert NotSubscribed();
        if (hasClaimed[msg.sender]) revert AlreadyClaimed();
        if (address(this).balance < payoutAmount)
            revert InsufficientContractBalance(address(this).balance, payoutAmount);

        // ── EFFECTS ─────────────────────────────────
        hasClaimed[msg.sender] = true;

        // ── INTERACTIONS ────────────────────────────
        (bool success, ) = payable(msg.sender).call{value: payoutAmount}("");
        if (!success) revert TransferFailed();

        emit PayoutClaimed(msg.sender, payoutAmount, block.timestamp);
    }

    // ─── Admin Functions ─────────────────────────────────────────────────────

    /**
     * @notice Declare a sinister, enabling all insured users to claim their payout.
     * @dev Restricted to owner (oracle / admin). Can only be called once.
     */
    function declareSinister() external onlyOwner {
        if (sinisterDeclared) revert SinisterAlreadyDeclared();
        sinisterDeclared = true;
        emit SinisterDeclared(msg.sender, block.timestamp);
    }

    /**
     * @notice Fund the contract with ETH to cover payouts (owner only).
     */
    function fundContract() external payable onlyOwner {
        emit ContractFunded(msg.sender, msg.value);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    /**
     * @notice Returns the list of all insured user addresses.
     * @dev Only addresses — no personal data stored (GDPR compliant).
     */
    function getInsuredUsers() external view returns (address[] memory) {
        return insuredUsers;
    }

    /**
     * @notice Returns the total number of insured users.
     */
    function getInsuredCount() external view returns (uint256) {
        return insuredUsers.length;
    }

    /**
     * @notice Returns the current ETH balance held by the contract.
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Returns all key contract parameters in a single call (gas efficient for frontend).
     */
    function getContractInfo()
        external
        view
        returns (
            uint256 premium,
            uint256 payout,
            bool sinister,
            uint256 insuredCount,
            uint256 balance
        )
    {
        return (
            premiumAmount,
            payoutAmount,
            sinisterDeclared,
            insuredUsers.length,
            address(this).balance
        );
    }

    // ─── Fallback ─────────────────────────────────────────────────────────────

    /// @notice Accept plain ETH transfers to fund the contract
    receive() external payable {
        emit ContractFunded(msg.sender, msg.value);
    }
}
