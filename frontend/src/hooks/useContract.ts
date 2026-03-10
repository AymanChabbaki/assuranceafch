// src/hooks/useContract.ts
// Returns typed contract instances for reading (provider) and writing (signer via MetaMask)

import { useMemo } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../config/contract";

export function useContract(signerOrProvider: ethers.Signer | ethers.Provider | null) {
  return useMemo(() => {
    if (!signerOrProvider) return null;
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
  }, [signerOrProvider]);
}
