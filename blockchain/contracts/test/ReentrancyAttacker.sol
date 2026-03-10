// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ─── Minimal interface for the insurance contract ────────────────────────────
interface IInsurance {
    function subscribe() external payable;
    function claim() external;
}

/**
 * @title ReentrancyAttacker
 * @notice Test contract used ONLY in unit tests to verify that InsuranceContract
 *         is protected against reentrancy attacks.
 *
 *         The attack pattern:
 *         1. Subscribe to the insurance
 *         2. Call claim()
 *         3. In the receive() fallback, try to call claim() again
 *
 *         Expected result: the second call reverts (AlreadyClaimed),
 *         proving the nonReentrant guard + CEI pattern works correctly.
 */
contract ReentrancyAttacker {
    IInsurance public target;
    uint256 public attackCount;

    function subscribe(address _target) external payable {
        target = IInsurance(_target);
        target.subscribe{value: msg.value}();
    }

    function attack(address _target) external {
        target = IInsurance(_target);
        target.claim();
    }

    // Called when this contract receives ETH during payout
    receive() external payable {
        attackCount++;
        // Attempt to re-enter — the nonReentrant guard should block this.
        // We use try/catch so the outer claim() call can still complete.
        // If this inner call somehow succeeds, reentrancy happened (very bad).
        try IInsurance(address(target)).claim() {
            // reentrancy succeeded — test should catch this
        } catch {
            // Expected: guard blocked re-entry
        }
    }
}
