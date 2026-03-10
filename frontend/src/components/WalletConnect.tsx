// src/components/WalletConnect.tsx

import type { WalletState } from "../types";

interface Props {
  wallet: WalletState;
  onConnect: () => void;
  onSwitch: () => void;
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function WalletConnect({ wallet, onConnect, onSwitch }: Props) {
  if (!wallet.isConnected) {
    return (
      <button className="btn btn-primary" onClick={onConnect}>
        🦊 Connect MetaMask
      </button>
    );
  }

  if (wallet.wrongNetwork) {
    return (
      <div className="wallet-bar wrong-network">
        <span>⚠️ Wrong network</span>
        <button className="btn btn-warning" onClick={onSwitch}>
          Switch to Sepolia
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-bar connected">
      <span className="dot" />
      <span className="addr">{shortAddr(wallet.address!)}</span>
      {wallet.isOwner && <span className="badge-admin">Admin</span>}
    </div>
  );
}
