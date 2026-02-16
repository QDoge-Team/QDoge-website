import { atom } from 'jotai';

export interface Balance {
  currencyId: string;
  amount: number;
}

export interface WalletBalances {
  qubic: number; // Integer only
  qdoge: number; // Integer only
}

export const balancesAtom = atom<Balance[]>([]);
export const walletBalancesAtom = atom<WalletBalances>({ qubic: 0, qdoge: 0 });