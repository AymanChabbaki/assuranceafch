// src/hooks/useWallet.ts
// Manages MetaMask connection state, network switching, and signer access.

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { OWNER_ADDRESS, SEPOLIA_CHAIN_ID } from "../config/contract";
import type { WalletState } from "../types";

declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider & {
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

const DEFAULT_STATE: WalletState = {
  address: null,
  isConnected: false,
  isOwner: false,
  chainId: null,
  wrongNetwork: false,
};

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>(DEFAULT_STATE);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  const updateState = useCallback(async (accounts: string[], chainId: number) => {
    if (accounts.length === 0) {
      setWallet(DEFAULT_STATE);
      setProvider(null);
      return;
    }
    const address = accounts[0].toLowerCase();
    const browserProvider = new ethers.BrowserProvider(window.ethereum!);
    setProvider(browserProvider);
    setWallet({
      address: accounts[0],
      isConnected: true,
      isOwner: address === OWNER_ADDRESS,
      chainId,
      wrongNetwork: chainId !== SEPOLIA_CHAIN_ID,
    });
  }, []);

  // Auto-detect already-connected wallet on load
  useEffect(() => {
    if (!window.ethereum) return;
    window.ethereum
      .request({ method: "eth_accounts" })
      .then(async (accounts) => {
        const chainIdHex = (await window.ethereum!.request({ method: "eth_chainId" })) as string;
        await updateState(accounts as string[], parseInt(chainIdHex, 16));
      })
      .catch(() => {});
  }, [updateState]);

  // Listen for account / chain changes
  useEffect(() => {
    if (!window.ethereum) return;
    const onAccounts = async (...args: unknown[]) => {
      const accounts = args[0] as string[];
      const chainIdHex = (await window.ethereum!.request({ method: "eth_chainId" })) as string;
      await updateState(accounts, parseInt(chainIdHex, 16));
    };
    const onChain = async (chainIdHex: unknown) => {
      const accounts = (await window.ethereum!.request({ method: "eth_accounts" })) as string[];
      await updateState(accounts, parseInt(chainIdHex as string, 16));
    };
    window.ethereum.on("accountsChanged", onAccounts);
    window.ethereum.on("chainChanged", onChain);
    return () => {
      window.ethereum!.removeListener("accountsChanged", onAccounts);
      window.ethereum!.removeListener("chainChanged", onChain);
    };
  }, [updateState]);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed. Please install it from metamask.io");
      return;
    }
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      const chainIdHex = (await window.ethereum.request({ method: "eth_chainId" })) as string;
      await updateState(accounts, parseInt(chainIdHex, 16));
    } catch {
      // User rejected the request
    }
  }, [updateState]);

  const switchToSepolia = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }], // Sepolia
      });
    } catch (err: unknown) {
      // Chain not added yet — add it
      if ((err as { code: number }).code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0xaa36a7",
              chainName: "Sepolia Testnet",
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              rpcUrls: ["https://rpc.sepolia.org"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ],
        });
      }
    }
  }, []);

  const getSigner = useCallback(async () => {
    if (!provider) return null;
    return provider.getSigner();
  }, [provider]);

  return { wallet, connect, switchToSepolia, getSigner };
}
