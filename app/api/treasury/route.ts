import { QUBIC_RPC } from '@/lib/tokens/constants';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Contract-issued shares (QX lists them under the zero identity). */
const NULL_ID = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB';

/** QTREAT treasury wallet (also the QTREAT contract admin). */
const TREASURY_WALLET = 'QTREATZZIVFYQAIBKCZPSHGLIRMALZKHEWAPFLFXJAMDAXMGTBKQVXHHDHUD';

const QUHUB = 'https://api.quhub.app/service/v1/qx';
const WINDOW_DAYS = 7;
/** A last-trade fallback older than this is too stale to call a market price. */
const STALE_MAX_DAYS = 60;
const CACHE_SECONDS = 300;
const CONCURRENCY = 6;

export type TreasuryAssetKind = 'sc-share' | 'token' | 'qu';
export type PriceBasis = '7d-vwap' | 'last-trade';

export type TreasuryAssetRow = {
  name: string;
  issuer: string;
  kind: TreasuryAssetKind;
  amount: number;
  price: number | null;
  priceBasis: PriceBasis | null;
  /** ISO date of the most recent QX trade, when one exists. */
  lastTradeDate: string | null;
  trades7d: number;
  value: number | null;
};

export type TreasuryPayload = {
  wallet: string;
  asOf: string;
  assets: TreasuryAssetRow[];
  /** Sum of every row that has a price (qu balance included). */
  totalValue: number;
  /** Part of totalValue priced from an older trade (nothing traded in the last 7 days). */
  staleValue: number;
  unpricedCount: number;
  error?: string;
};

type OwnedAsset = {
  data: {
    numberOfUnits: string;
    issuedAsset: { name: string; issuerIdentity: string };
  };
};

type DailyPrice = { time: string; totalShares: number; totalAmount: number; averagePrice: number; totalTrades: number };

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate: CACHE_SECONDS }, signal: AbortSignal.timeout(12_000) });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return (await res.json()) as T;
}

async function priceFor(issuer: string, name: string) {
  const days = await getJson<DailyPrice[]>(`${QUHUB}/issuer/${issuer}/asset/${name}/chart/average-price`);
  const traded = days.filter((d) => d.totalShares > 0 && d.totalAmount > 0);
  if (traded.length === 0) return null;

  const cutoff = Date.now() - WINDOW_DAYS * 86_400_000;
  const recent = traded.filter((d) => new Date(d.time).getTime() >= cutoff);
  const last = traded[traded.length - 1];
  if (recent.length > 0) {
    const shares = recent.reduce((s, d) => s + d.totalShares, 0);
    const amount = recent.reduce((s, d) => s + d.totalAmount, 0);
    return {
      price: amount / shares,
      basis: '7d-vwap' as const,
      lastTradeDate: last.time,
      trades7d: recent.reduce((s, d) => s + d.totalTrades, 0),
    };
  }
  if (new Date(last.time).getTime() < Date.now() - STALE_MAX_DAYS * 86_400_000) return null;
  return { price: last.averagePrice, basis: 'last-trade' as const, lastTradeDate: last.time, trades7d: 0 };
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    })
  );
  return out;
}

export async function GET() {
  try {
    const [owned, balance] = await Promise.all([
      getJson<{ ownedAssets?: OwnedAsset[] }>(`${QUBIC_RPC}/v1/assets/${TREASURY_WALLET}/owned`),
      getJson<{ balance?: { balance?: string } }>(`${QUBIC_RPC}/v1/balances/${TREASURY_WALLET}`),
    ]);

    // Same asset can be split across managing contracts (QX, staked, ...) -- sum by issuer + name.
    const held = new Map<string, { name: string; issuer: string; amount: number }>();
    for (const a of owned.ownedAssets ?? []) {
      const { name, issuerIdentity } = a.data.issuedAsset;
      const units = Number(a.data.numberOfUnits);
      if (!units) continue;
      const key = `${issuerIdentity}:${name}`;
      const cur = held.get(key);
      if (cur) cur.amount += units;
      else held.set(key, { name, issuer: issuerIdentity, amount: units });
    }

    const prices = await mapLimit([...held.values()], CONCURRENCY, async (h) => {
      try {
        return await priceFor(h.issuer, h.name);
      } catch {
        return null;
      }
    });

    const assets: TreasuryAssetRow[] = [...held.values()].map((h, i) => {
      const p = prices[i];
      return {
        name: h.name,
        issuer: h.issuer,
        kind: h.issuer === NULL_ID ? 'sc-share' : 'token',
        amount: h.amount,
        price: p?.price ?? null,
        priceBasis: p?.basis ?? null,
        lastTradeDate: p?.lastTradeDate ?? null,
        trades7d: p?.trades7d ?? 0,
        value: p ? p.price * h.amount : null,
      };
    });

    const qu = Number(balance.balance?.balance ?? 0);
    if (qu > 0) {
      assets.push({
        name: 'QU',
        issuer: '',
        kind: 'qu',
        amount: qu,
        price: 1,
        priceBasis: null,
        lastTradeDate: null,
        trades7d: 0,
        value: qu,
      });
    }

    assets.sort((a, b) => (b.value ?? -1) - (a.value ?? -1));

    const payload: TreasuryPayload = {
      wallet: TREASURY_WALLET,
      asOf: new Date().toISOString(),
      assets,
      totalValue: assets.reduce((s, a) => s + (a.value ?? 0), 0),
      staleValue: assets.reduce((s, a) => s + (a.priceBasis === 'last-trade' ? (a.value ?? 0) : 0), 0),
      unpricedCount: assets.filter((a) => a.value == null).length,
    };
    return NextResponse.json(payload, {
      headers: { 'Cache-Control': `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}` },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
