import {
  CONTRACT_NAMES,
  MSVAULT_CONTRACT_INDEX,
  QUBIC_RPC,
  TOKENS,
  contractIndexFromIdentity,
  type TokenAsset,
} from '@/lib/tokens/constants';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type OwnershipsPayload = {
  assets?: Array<{
    data?: {
      ownerIdentity?: string;
      numberOfUnits?: string;
      managingContractIndex?: number;
    };
    tick?: number;
  }>;
};

export type HolderRow = {
  identity: string;
  balance: number;
  /** Friendly name for known addresses (issuer, smart contracts). */
  label?: string;
  isContract: boolean;
  isIssuer: boolean;
};

export type HoldersPayload = {
  asset: TokenAsset;
  tick: number | null;
  totalHolders: number;
  onchainSupply: number;
  maxSupply: number | null;
  circulating: number;
  locked: number;
  holders: HolderRow[];
  error?: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const assetParam = (searchParams.get('asset') ?? 'QDOGE').toUpperCase();
  const config = TOKENS[assetParam as TokenAsset];
  if (!config) {
    return NextResponse.json(
      { error: `Unknown asset "${assetParam}"` },
      { status: 400 }
    );
  }

  const url =
    `${QUBIC_RPC}/v1/assets/ownerships` +
    `?issuerIdentity=${config.issuerIdentity}&assetName=${config.assetName}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 120 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Qubic RPC upstream error', status: res.status },
        { status: 502 }
      );
    }
    const payload = (await res.json()) as OwnershipsPayload;
    const records = payload.assets ?? [];

    // The RPC returns one record per (owner, managing contract); the same
    // identity can appear under QX, QSwap, etc. Aggregate per owner.
    const balances = new Map<string, number>();
    let tick: number | null = null;
    for (const record of records) {
      const identity = record.data?.ownerIdentity;
      const units = Number(record.data?.numberOfUnits ?? 0);
      if (!identity || !Number.isFinite(units)) continue;
      balances.set(identity, (balances.get(identity) ?? 0) + units);
      if (typeof record.tick === 'number') tick = record.tick;
    }

    const holders: HolderRow[] = [];
    let onchainSupply = 0;
    let locked = 0;
    for (const [identity, balance] of balances) {
      if (balance <= 0) continue;
      onchainSupply += balance;

      const contractIndex = contractIndexFromIdentity(identity);
      const isContract = contractIndex != null;
      const isIssuer = identity === config.issuerIdentity;
      let label: string | undefined;
      if (isIssuer) {
        label = 'QDoge Issuer';
      } else if (isContract) {
        const name = CONTRACT_NAMES[contractIndex] ?? `Contract #${contractIndex}`;
        label = contractIndex === MSVAULT_CONTRACT_INDEX ? `${name} (Locked)` : name;
      }
      if (isIssuer || contractIndex === MSVAULT_CONTRACT_INDEX) {
        locked += balance;
      }

      holders.push({ identity, balance, label, isContract, isIssuer });
    }
    holders.sort((a, b) => b.balance - a.balance || a.identity.localeCompare(b.identity));

    const body: HoldersPayload = {
      asset: config.assetName,
      tick,
      totalHolders: holders.length,
      onchainSupply,
      maxSupply: config.maxSupply ?? null,
      circulating: onchainSupply - locked,
      locked,
      holders,
    };
    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch token holders' },
      { status: 500 }
    );
  }
}
