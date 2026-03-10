// src/types/index.ts

export interface ContractInfo {
  address: string;
  network: string;
  premiumAmount: string;
  premiumEth: string;
  payoutAmount: string;
  payoutEth: string;
  sinisterDeclared: boolean;
  insuredCount: string;
  contractBalanceWei: string;
  contractBalanceEth: string;
}

export interface InsuredUser {
  address: string;
  hasClaimed: boolean;
}

export interface InsuredUsersResponse {
  count: number;
  users: InsuredUser[];
}

export interface BlockchainEvent {
  type: "SUBSCRIPTION" | "SINISTER_DECLARED" | "PAYOUT";
  user?: string;
  declaredBy?: string;
  premiumWei?: string;
  amountWei?: string;
  txHash: string;
  blockNumber: number;
  explorerUrl: string;
}

export interface TransactionsResponse {
  total: number;
  subscriptions: number;
  sinisters: number;
  payouts: number;
  lastScannedBlock: number;
  events: BlockchainEvent[];
}

export type WalletState = {
  address: string | null;
  isConnected: boolean;
  isOwner: boolean;
  chainId: number | null;
  wrongNetwork: boolean;
};
