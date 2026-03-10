// src/pages/UserPage.tsx
// Assuré interface: shows contract details, subscribe button, claim button.

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useContractInfo } from "../hooks/useContractInfo";
import { useContract } from "../hooks/useContract";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../config/contract";
import type { WalletState } from "../types";

interface Props {
  wallet: WalletState;
  getSigner: () => Promise<ethers.Signer | null>;
}

export default function UserPage({ wallet, getSigner }: Props) {
  const { info, loading, error, refetch } = useContractInfo();
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [loadingState, setLoadingState] = useState(false);

  // Fetch user-specific state from chain
  useEffect(() => {
    if (!wallet.address || !window.ethereum) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    Promise.all([
      contract.isSubscribed(wallet.address),
      contract.hasClaimed(wallet.address),
    ]).then(([sub, claimed]) => {
      setIsSubscribed(sub as boolean);
      setHasClaimed(claimed as boolean);
    }).catch(() => {});
  }, [wallet.address, txStatus]);

  async function handleSubscribe() {
    if (!wallet.isConnected || wallet.wrongNetwork) return;
    setLoadingState(true);
    setTxStatus(null);
    try {
      const signer = await getSigner();
      if (!signer || !info) return;
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.subscribe({ value: BigInt(info.premiumAmount) });
      setTxStatus("⏳ Transaction submitted — waiting for confirmation...");
      await tx.wait();
      setTxStatus(`✅ Subscribed! TxHash: ${tx.hash}`);
      setIsSubscribed(true);
      refetch();
    } catch (err: unknown) {
      const msg = (err as { reason?: string; message?: string }).reason || (err as { message?: string }).message || "Transaction failed";
      setTxStatus(`❌ ${msg}`);
    } finally {
      setLoadingState(false);
    }
  }

  async function handleClaim() {
    if (!wallet.isConnected || wallet.wrongNetwork) return;
    setLoadingState(true);
    setTxStatus(null);
    try {
      const signer = await getSigner();
      if (!signer) return;
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.claim();
      setTxStatus("⏳ Claim submitted — waiting for confirmation...");
      await tx.wait();
      setTxStatus(`✅ Payout received! TxHash: ${tx.hash}`);
      setHasClaimed(true);
      refetch();
    } catch (err: unknown) {
      const msg = (err as { reason?: string; message?: string }).reason || (err as { message?: string }).message || "Transaction failed";
      setTxStatus(`❌ ${msg}`);
    } finally {
      setLoadingState(false);
    }
  }

  if (loading) return <div className="card"><p>Loading contract info…</p></div>;
  if (error)   return <div className="card error"><p>{error}</p></div>;

  return (
    <div className="page">
      <h2>🛡️ Insurance Contract</h2>

      {/* Contract Details */}
      <div className="card info-grid">
        <div className="info-item">
          <span className="label">Premium</span>
          <span className="value">{info?.premiumEth} ETH</span>
        </div>
        <div className="info-item">
          <span className="label">Payout</span>
          <span className="value">{info?.payoutEth} ETH</span>
        </div>
        <div className="info-item">
          <span className="label">Insured users</span>
          <span className="value">{info?.insuredCount}</span>
        </div>
        <div className="info-item">
          <span className="label">Contract balance</span>
          <span className="value">{info?.contractBalanceEth} ETH</span>
        </div>
        <div className="info-item">
          <span className="label">Sinister declared</span>
          <span className={`value ${info?.sinisterDeclared ? "danger" : "safe"}`}>
            {info?.sinisterDeclared ? "⚠️ YES" : "✅ No"}
          </span>
        </div>
        <div className="info-item">
          <span className="label">Network</span>
          <span className="value">Sepolia Testnet</span>
        </div>
      </div>

      {/* User Status */}
      {wallet.isConnected && !wallet.wrongNetwork && (
        <div className="card status-card">
          <h3>Your Status</h3>
          <p>
            Subscribed:{" "}
            <strong>{isSubscribed ? "✅ Yes" : "❌ No"}</strong>
          </p>
          {isSubscribed && (
            <p>
              Payout claimed:{" "}
              <strong>{hasClaimed ? "✅ Yes" : "⏳ Not yet"}</strong>
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      {!wallet.isConnected ? (
        <p className="hint">Connect your wallet to subscribe.</p>
      ) : wallet.wrongNetwork ? (
        <p className="hint warning">Switch to Sepolia to interact.</p>
      ) : (
        <div className="actions">
          {!isSubscribed && (
            <button
              className="btn btn-primary"
              onClick={handleSubscribe}
              disabled={loadingState}
            >
              {loadingState ? "Processing…" : `Subscribe — Pay ${info?.premiumEth} ETH`}
            </button>
          )}
          {isSubscribed && info?.sinisterDeclared && !hasClaimed && (
            <button
              className="btn btn-success"
              onClick={handleClaim}
              disabled={loadingState}
            >
              {loadingState ? "Processing…" : `Claim Payout — ${info?.payoutEth} ETH`}
            </button>
          )}
          {isSubscribed && !info?.sinisterDeclared && (
            <p className="hint">You are insured. You can claim your payout once a sinister is declared.</p>
          )}
          {hasClaimed && (
            <p className="hint safe">✅ You have already received your payout.</p>
          )}
        </div>
      )}

      {/* Transaction status */}
      {txStatus && (
        <div className={`tx-status ${txStatus.startsWith("✅") ? "success" : txStatus.startsWith("❌") ? "error" : "pending"}`}>
          <p>{txStatus}</p>
          {txStatus.includes("TxHash:") && (
            <a
              href={`https://sepolia.etherscan.io/tx/${txStatus.split("TxHash: ")[1]}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Etherscan ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}
