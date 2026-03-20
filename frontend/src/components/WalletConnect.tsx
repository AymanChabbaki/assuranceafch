import { useState } from "react";
import { Wallet, AlertTriangle, Check, Copy } from "lucide-react";
import type { WalletState } from "../types";

interface Props {
  wallet: WalletState;
  onConnect: () => void;
  onSwitch: () => void;
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function WalletConnect({ wallet, onConnect, onSwitch }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!wallet.address) return;
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (!wallet.isConnected) {
    return (
      <button className="btn btn-primary" onClick={onConnect}>
        <Wallet size={15} />
        Connect Wallet
      </button>
    );
  }

  if (wallet.wrongNetwork) {
    return (
      <div className="wallet-bar">
        <button className="btn btn-warning" onClick={onSwitch}>
          <AlertTriangle size={14} />
          Switch to Sepolia
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-bar">
      <button 
        className="wallet-pill" 
        onClick={handleCopy}
        title={copied ? "Copied!" : "Click to copy full address"}
        style={{ cursor: "pointer" }}
      >
        <span className="wallet-dot" />
        <span>{shortAddr(wallet.address!)}</span>
        {copied ? (
          <Check size={12} style={{ color: "var(--success)" }} />
        ) : (
          <Copy size={12} style={{ opacity: 0.5 }} />
        )}
        {wallet.isOwner && <span className="badge-admin">Admin</span>}
      </button>
    </div>
  );
}
