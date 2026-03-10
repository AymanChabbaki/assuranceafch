// src/pages/AdminPage.tsx
// Admin interface — restricted to owner wallet address.
// Only the declareSinister() function is available here.

import { useState } from "react";
import { ethers } from "ethers";
import { useContractInfo } from "../hooks/useContractInfo";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../config/contract";
import type { WalletState } from "../types";

interface Props {
  wallet: WalletState;
  getSigner: () => Promise<ethers.Signer | null>;
}

export default function AdminPage({ wallet, getSigner }: Props) {
  const { info, loading, refetch } = useContractInfo();
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Access control — non-admin sees nothing useful
  if (!wallet.isConnected) {
    return (
      <div className="page">
        <div className="card error">
          <p>🔒 Connect your admin wallet to access this page.</p>
        </div>
      </div>
    );
  }

  if (!wallet.isOwner) {
    return (
      <div className="page">
        <div className="card error">
          <p>⛔ Access denied — this page is reserved for the contract admin.</p>
          <p className="hint">Connected: {wallet.address}</p>
        </div>
      </div>
    );
  }

  if (wallet.wrongNetwork) {
    return (
      <div className="page">
        <div className="card error">
          <p>⚠️ Please switch to Sepolia network.</p>
        </div>
      </div>
    );
  }

  async function handleDeclareSinister() {
    setBusy(true);
    setTxStatus(null);
    try {
      const signer = await getSigner();
      if (!signer) return;
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.declareSinister();
      setTxStatus("⏳ Transaction submitted — waiting for confirmation...");
      await tx.wait();
      setTxStatus(`✅ Sinister declared! TxHash: ${tx.hash}`);
      refetch();
    } catch (err: unknown) {
      const msg = (err as { reason?: string; message?: string }).reason || (err as { message?: string }).message || "Transaction failed";
      setTxStatus(`❌ ${msg}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <h2>🔐 Admin Panel</h2>
      <p className="hint">Connected as: <strong>{wallet.address}</strong></p>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <>
          {/* Contract state */}
          <div className="card info-grid">
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
                {info?.sinisterDeclared ? "⚠️ YES — Payouts are open" : "✅ Not yet"}
              </span>
            </div>
          </div>

          {/* Declare Sinister */}
          <div className="card">
            <h3>Declare a Sinister</h3>
            <p>
              This will enable all insured users to claim their payout of{" "}
              <strong>{info?.payoutEth} ETH</strong> each.
            </p>
            <p className="hint warning">
              ⚠️ This action is <strong>irreversible</strong>. Make sure the contract
              has enough ETH to cover all {info?.insuredCount} insured users (
              {info ? (parseFloat(info.payoutEth) * parseInt(info.insuredCount)).toFixed(4) : "…"} ETH needed).
            </p>

            {info?.sinisterDeclared ? (
              <p className="hint safe">✅ Sinister already declared. Users can now claim.</p>
            ) : (
              <button
                className="btn btn-danger"
                onClick={handleDeclareSinister}
                disabled={busy}
              >
                {busy ? "Processing…" : "⚡ Declare Sinister"}
              </button>
            )}
          </div>
        </>
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
