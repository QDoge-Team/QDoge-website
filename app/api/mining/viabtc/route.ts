import {
  VIABTC_OBSERVER_ACCESS_KEY,
  VIABTC_OBSERVER_BASE,
  VIABTC_OBSERVER_COIN,
} from '@/lib/mining/constants';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type ViaBtcEnvelope<T> = {
  code?: number;
  message?: string;
  data?: T;
};

type ObserverHomeData = {
  hashrate_10min?: string;
  hashrate_1hour?: string;
  hashrate_1day?: string;
  total_active?: number;
  total_unactive?: number;
};

type ObserverWorkerRow = {
  name?: string;
  status?: string;
  hashrate_10min?: string;
  hashrate_1hour?: string;
  hashrate_1day?: string;
  reject_rate?: string;
  last_active?: number;
};

type ObserverWorkerList = {
  data?: ObserverWorkerRow[];
};

type ObserverHashrateChart = {
  start?: number;
  unit?: string;
  hashrate?: number[];
  reject_rate?: number[];
};

type ObserverCoinProfit = {
  coin?: string;
  profit_yesterday?: string;
  profit_total?: string;
};

type ObserverProfitSummary = {
  profit_yesterday?: string;
  profit_total?: string;
  gift_profits?: ObserverCoinProfit[];
};

export type ViaBtcWorker = {
  name: string;
  status: string;
  hashrate10minHs: number;
  hashrate1hourHs: number;
  hashrate24hourHs: number;
  rejectRatePercent: number;
  lastActive: number | null;
};

export type ViaBtcCoinProfit = {
  coin: string;
  profitYesterday: string;
  profitTotal: string;
};

export type ViaBtcPayload = {
  coin: string;
  hashrate: {
    current10minHs: number;
    hour1Hs: number;
    hour24Hs: number;
    activeWorkers: number;
    unactiveWorkers: number;
  } | null;
  workers: ViaBtcWorker[];
  chart: Array<{ timestamp: number; hashrateHs: number; rejectRatePercent: number }>;
  mainProfit: ViaBtcCoinProfit | null;
  giftProfits: ViaBtcCoinProfit[];
  error?: string;
};

const UNIT_MULTIPLIER: Record<string, number> = {
  K: 1e3,
  M: 1e6,
  G: 1e9,
  T: 1e12,
  P: 1e15,
};

/** Parses ViaBTC hashrate strings like "6.528G" or a raw H/s number string. */
function parseHashrate(value: string | undefined): number {
  if (!value) return 0;
  const match = /^([\d.]+)\s*([KMGTP])?$/i.exec(value.trim());
  if (!match) return 0;
  const n = Number(match[1]);
  if (!Number.isFinite(n)) return 0;
  const unit = match[2]?.toUpperCase();
  return unit ? n * (UNIT_MULTIPLIER[unit] ?? 1) : n;
}

async function observerGet<T>(
  path: string,
  params: Record<string, string>
): Promise<T | null> {
  try {
    const query = new URLSearchParams({
      access_key: VIABTC_OBSERVER_ACCESS_KEY,
      ...params,
    }).toString();
    const res = await fetch(`${VIABTC_OBSERVER_BASE}${path}?${query}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as ViaBtcEnvelope<T>;
    if (payload.code !== 0) return null;
    return payload.data ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  const coin = VIABTC_OBSERVER_COIN;

  const [home, workerList, chartRaw, profitSummary] = await Promise.all([
    observerGet<ObserverHomeData>('/home', { coin }),
    observerGet<ObserverWorkerList>('/worker', {
      coin,
      sort_by: 'hashrate_10min',
      sort_order: 'desc',
      page: '1',
      limit: '50',
      is_summary: 'false',
      group_id: '-1',
    }),
    observerGet<ObserverHashrateChart>('/hashrate/chart', {
      coin,
      interval: 'hour',
      utc: 'true',
    }),
    observerGet<ObserverProfitSummary>(`/profit/${coin}/summary/dashboard`, {
      utc: 'false',
    }),
  ]);

  if (!home && !workerList && !chartRaw) {
    return NextResponse.json(
      { error: 'ViaBTC upstream unavailable' },
      { status: 502 }
    );
  }

  const workers: ViaBtcWorker[] = (workerList?.data ?? []).map((w) => ({
    name: w.name ?? '—',
    status: w.status ?? 'unknown',
    hashrate10minHs: parseHashrate(w.hashrate_10min),
    hashrate1hourHs: parseHashrate(w.hashrate_1hour),
    hashrate24hourHs: parseHashrate(w.hashrate_1day),
    rejectRatePercent: Number(w.reject_rate ?? 0) * 100,
    lastActive: typeof w.last_active === 'number' ? w.last_active : null,
  }));

  const chartUnitMultiplier = UNIT_MULTIPLIER[chartRaw?.unit?.toUpperCase() ?? 'G'] ?? 1e9;
  const startSeconds = Math.floor((chartRaw?.start ?? 0) / 1000);
  const chart = (chartRaw?.hashrate ?? []).map((hs, i) => ({
    timestamp: startSeconds + i * 3600,
    hashrateHs: hs * chartUnitMultiplier,
    rejectRatePercent: (chartRaw?.reject_rate?.[i] ?? 0) * 100,
  }));

  const mainProfit: ViaBtcCoinProfit | null = profitSummary
    ? {
        coin,
        profitYesterday: profitSummary.profit_yesterday ?? '0',
        profitTotal: profitSummary.profit_total ?? '0',
      }
    : null;

  const giftProfits: ViaBtcCoinProfit[] = (profitSummary?.gift_profits ?? []).map(
    (g) => ({
      coin: g.coin ?? '—',
      profitYesterday: g.profit_yesterday ?? '0',
      profitTotal: g.profit_total ?? '0',
    })
  );

  const body: ViaBtcPayload = {
    coin,
    hashrate: home
      ? {
          current10minHs: parseHashrate(home.hashrate_10min),
          hour1Hs: parseHashrate(home.hashrate_1hour),
          hour24Hs: parseHashrate(home.hashrate_1day),
          activeWorkers: home.total_active ?? 0,
          unactiveWorkers: home.total_unactive ?? 0,
        }
      : null,
    workers,
    chart,
    mainProfit,
    giftProfits,
  };

  return NextResponse.json(body, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=180' },
  });
}
