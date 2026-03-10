import { Wallet, AlertTriangle, ChevronRight } from "lucide-react";
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
      <div className="wallet-pill">
        <span className="wallet-dot" />
        <span>{shortAddr(wallet.address!)}</span>
        {wallet.isOwner && <span className="badge-admin">Admin</span>}
      </div>
    </div>
  );
}
