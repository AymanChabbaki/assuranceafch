// src/pages/UserPage.tsx

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  Shield, Coins, TrendingUp, Users, Wallet, Activity,
  CheckCircle, XCircle, Clock, AlertTriangle, ExternalLink,
  Loader, Globe, ArrowRight, Copy, Check,
} from "lucide-react";
import { useContractInfo } from "../hooks/useContractInfo";
import { CONTRACT_ADDRESS, CONTRACT_ABI, OWNER_ADDRESS } from "../config/contract";
import type { WalletState } from "../types";

interface Props {
  wallet: WalletState;
  getSigner: () => Promise<ethers.Signer | null>;
}

interface TxResult { type: "success" | "error" | "pending"; message: string; hash?: string; }

// Copyable address component
function CopyableAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <span 
      onClick={handleCopy}
      style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
      title={copied ? "Copied!" : "Click to copy full address"}
    >
      {address.slice(0, 10)}…{address.slice(-6)}
      {copied ? (
        <Check size={12} style={{ color: "var(--success)" }} />
      ) : (
        <Copy size={12} style={{ opacity: 0.5 }} />
      )}
    </span>
  );
}

export default function UserPage({ wallet, getSigner }: Props) {
  const { info, loading, error, refetch } = useContractInfo();
  const [tx, setTx] = useState<TxResult | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [busy, setBusy] = useState(false);

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
  }, [wallet.address, tx]);

  async function handleSubscribe() {
    setBusy(true); setTx(null);
    try {
      const signer = await getSigner();
      if (!signer || !info) return;
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const txObj = await contract.subscribe({ value: BigInt(info.premiumAmount) });
      setTx({ type: "pending", message: "Transaction submitted — waiting for confirmation…" });
      await txObj.wait();
      setTx({ type: "success", message: "Successfully subscribed!", hash: txObj.hash });
      setIsSubscribed(true);
      refetch();
    } catch (err: unknown) {
      const msg = (err as { reason?: string; message?: string }).reason || (err as { message?: string }).message || "Transaction failed";
      setTx({ type: "error", message: msg });
    } finally { setBusy(false); }
  }

  async function handleClaim() {
    setBusy(true); setTx(null);
    try {
      const signer = await getSigner();
      if (!signer) return;
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const txObj = await contract.claim();
      setTx({ type: "pending", message: "Claim submitted — waiting for confirmation…" });
      await txObj.wait();
      setTx({ type: "success", message: `Payout of ${info?.payoutEth} ETH received!`, hash: txObj.hash });
      setHasClaimed(true);
      refetch();
    } catch (err: unknown) {
      const msg = (err as { reason?: string; message?: string }).reason || (err as { message?: string }).message || "Transaction failed";
      setTx({ type: "error", message: msg });
    } finally { setBusy(false); }
  }

  if (loading) return (
    <div className="loading-container">
      <Loader size={18} className="spinner" />
      <span>Loading contract data…</span>
    </div>
  );
  if (error) return (
    <div className="alert alert-danger">
      <AlertTriangle size={16} className="alert-icon" />
      <p>{error}</p>
    </div>
  );

  return (
    <div className="page">

      {/* Page header */}
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Decentralized Insurance</p>
          <h2>Insurance Contract</h2>
          <p className="page-description">
            Pay a one-time premium and get covered. If a sinister is declared,<br />
            claim your payout directly from the smart contract.
          </p>
        </div>
        <div className="network-badge">
          <Globe size={11} />
          Sepolia Testnet
        </div>
      </div>

      {/* Stats grid */}
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-label"><Coins size={12} /> Premium</div>
          <div className="stat-value accent">{info?.premiumEth} ETH</div>
          <div className="stat-sub">one-time payment</div>
        </div>
        <div className="stat-item">
          <div className="stat-label"><TrendingUp size={12} /> Payout</div>
          <div className="stat-value safe">{info?.payoutEth} ETH</div>
          <div className="stat-sub">per insured user</div>
        </div>
        <div className="stat-item">
          <div className="stat-label"><Users size={12} /> Insured</div>
          <div className="stat-value">{info?.insuredCount}</div>
          <div className="stat-sub">active policies</div>
        </div>
        <div className="stat-item">
          <div className="stat-label"><Activity size={12} /> Balance</div>
          <div className="stat-value">{info?.contractBalanceEth} ETH</div>
          <div className="stat-sub">contract pool</div>
        </div>
        <div className="stat-item">
          <div className="stat-label"><AlertTriangle size={12} /> Sinister</div>
          <div className={`stat-value ${info?.sinisterDeclared ? "danger" : "safe"}`}>
            {info?.sinisterDeclared ? "Declared" : "None"}
          </div>
          <div className="stat-sub">{info?.sinisterDeclared ? "payouts open" : "all clear"}</div>
        </div>
      </div>

      {/* User status */}
      {wallet.isConnected && !wallet.wrongNetwork && (
        <div className="card">
          <div className="card-header">
            <div className="card-header-icon icon-blue"><Wallet size={17} /></div>
            <div>
              <div className="card-title">Your Status</div>
              <div className="card-subtitle">
                <CopyableAddress address={wallet.address!} />
                {wallet.isOwner && (
                  <span style={{ 
                    marginLeft: "0.5rem", 
                    background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)",
                    color: "#fff",
                    borderRadius: "4px",
                    padding: "2px 8px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}>
                    Owner
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="status-row">
            <div className="status-key"><Shield size={14} /> Subscription</div>
            <div className={`status-val ${isSubscribed ? "safe" : ""}`}>
              {isSubscribed
                ? <><CheckCircle size={14} /> Active</>
                : <><XCircle size={14} /> Not subscribed</>}
            </div>
          </div>
          {isSubscribed && (
            <div className="status-row">
              <div className="status-key"><TrendingUp size={14} /> Payout claim</div>
              <div className={`status-val ${hasClaimed ? "safe" : "muted"}`}>
                {hasClaimed
                  ? <><CheckCircle size={14} /> Claimed</>
                  : info?.sinisterDeclared
                    ? <><Clock size={14} /> Available now</>
                    : <><Clock size={14} /> Waiting for sinister</>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sinister warning banner */}
      {info?.sinisterDeclared && (
        <div className="alert alert-warning">
          <AlertTriangle size={16} className="alert-icon" />
          <p>
            A sinister has been declared. If you are subscribed and haven't claimed yet,
            you can now receive your payout of <strong>{info.payoutEth} ETH</strong>.
          </p>
        </div>
      )}

      {/* Actions */}
      {!wallet.isConnected ? (
        <div className="card">
          <div className="card-header">
            <div className="card-header-icon icon-blue"><Wallet size={17} /></div>
            <div className="card-title">Connect your wallet to get started</div>
          </div>
          <p className="action-description">
            Connect MetaMask to subscribe to the insurance contract and manage your coverage.
          </p>
        </div>
      ) : wallet.wrongNetwork ? (
        <div className="alert alert-warning">
          <AlertTriangle size={16} className="alert-icon" />
          <p>Please switch to the Sepolia testnet to interact with this contract.</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <div className="card-header-icon icon-blue"><ArrowRight size={17} /></div>
            <div>
              <div className="card-title">Actions</div>
              <div className="card-subtitle">Interact with the smart contract</div>
            </div>
          </div>

          <div className="action-card">
            {!isSubscribed && (
              <>
                <p className="action-description">
                  Subscribe by paying the premium of <strong>{info?.premiumEth} ETH</strong>.
                  Your address will be recorded on-chain and you'll be covered immediately.
                </p>
                <div className="action-meta">
                  <Coins size={13} />
                  You will send exactly {info?.premiumEth} ETH to the contract
                </div>
                <button className="btn btn-primary" onClick={handleSubscribe} disabled={busy}>
                  {busy ? <><Loader size={14} className="spinner" /> Processing…</> : <><Shield size={15} /> Subscribe — {info?.premiumEth} ETH</>}
                </button>
              </>
            )}

            {isSubscribed && info?.sinisterDeclared && !hasClaimed && (
              <>
                <p className="action-description">
                  You are eligible to claim your payout of <strong>{info?.payoutEth} ETH</strong>.
                  The funds will be sent directly to your wallet.
                </p>
                <button className="btn btn-success" onClick={handleClaim} disabled={busy}>
                  {busy ? <><Loader size={14} className="spinner" /> Processing…</> : <><TrendingUp size={15} /> Claim Payout — {info?.payoutEth} ETH</>}
                </button>
              </>
            )}

            {isSubscribed && !info?.sinisterDeclared && !hasClaimed && (
              <div className="alert alert-info">
                <CheckCircle size={16} className="alert-icon" />
                <p>You are subscribed and covered. No sinister has been declared yet.</p>
              </div>
            )}

            {isSubscribed && hasClaimed && (
              <div className="alert alert-success">
                <CheckCircle size={16} className="alert-icon" />
                <p>You have already claimed your payout for this contract cycle.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TX feedback */}
      {tx && (
        <div className={`tx-status ${tx.type}`}>
          {tx.type === "pending" && <Loader size={15} className="spinner" style={{ flexShrink: 0 }} />}
          {tx.type === "success" && <CheckCircle size={15} style={{ flexShrink: 0 }} />}
          {tx.type === "error"   && <XCircle size={15} style={{ flexShrink: 0 }} />}
          <div className="tx-status-body">
            <span>{tx.message}</span>
            {tx.hash && (
              <a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer">
                View on Etherscan <ExternalLink size={11} style={{ display: "inline", verticalAlign: "middle" }} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
