import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const VIABTC_BASE = 'https://www.viabtc.com/res/openapi/v1';

type ViaBtcEnvelope<T> = {
  code?: number;
  message?: string;
  data?: T;
};

type AccountHashrateData = {
  coin?: string;
  hashrate_10min?: string;
  hashrate_1hour?: string;
  hashrate_24hour?: string;
  active_workers?: number;
  unactive_workers?: number;
};

type WorkerData = {
  worker_id?: number;
  worker_name?: string;
  worker_status?: string;
  hashrate_10min?: string;
  hashrate_1hour?: string;
  hashrate_24hour?: string;
  reject_rate?: string;
  last_active?: number;
};

type ChartPointData = {
  timestamp?: number;
  hashrate?: string;
  reject_rate?: string;
};

type ProfitData = {
  coin?: string;
  pplns_profit?: string;
  pps_profit?: string;
  solo_profit?: string;
  total_profit?: string;
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
  profit: Record<string, { totalProfit: string; pplnsProfit: string } | null>;
  error?: string;
};

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

async function viaBtcGet<T>(
  path: string,
  params: Record<string, string>,
  apiKey: string
): Promise<T | null> {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${VIABTC_BASE}${path}?${query}`, {
      headers: { 'X-API-KEY': apiKey, Accept: 'application/json' },
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
  const apiKey = process.env.VIABTC_API_KEY;
  // ASIC mines scrypt (LTC) with DOGE merged-mining rewards.
  const coin = process.env.VIABTC_COIN ?? 'LTC';

  if (!apiKey) {
    return NextResponse.json(
      { error: 'VIABTC_API_KEY is not configured' },
      { status: 503 }
    );
  }

  const [account, workersPage, chart, profitCoin, profitDoge] = await Promise.all([
    viaBtcGet<AccountHashrateData>('/hashrate', { coin }, apiKey),
    viaBtcGet<{ data?: WorkerData[] }>(
      '/hashrate/worker',
      { coin, limit: '50' },
      apiKey
    ),
    viaBtcGet<ChartPointData[]>(
      '/hashrate/chart',
      { coin, interval: 'hour' },
      apiKey
    ),
    viaBtcGet<ProfitData>('/profit', { coin }, apiKey),
    coin === 'DOGE'
      ? Promise.resolve(null)
      : viaBtcGet<ProfitData>('/profit', { coin: 'DOGE' }, apiKey),
  ]);

  if (!account && !workersPage && !chart) {
    return NextResponse.json(
      { error: 'ViaBTC upstream unavailable' },
      { status: 502 }
    );
  }

  const workers: ViaBtcWorker[] = (workersPage?.data ?? []).map((w) => ({
    name: w.worker_name ?? String(w.worker_id ?? '—'),
    status: w.worker_status ?? 'unknown',
    hashrate10minHs: toNumber(w.hashrate_10min),
    hashrate1hourHs: toNumber(w.hashrate_1hour),
    hashrate24hourHs: toNumber(w.hashrate_24hour),
    rejectRatePercent: toNumber(w.reject_rate) * 100,
    lastActive: typeof w.last_active === 'number' ? w.last_active : null,
  }));

  const profit: ViaBtcPayload['profit'] = {};
  if (profitCoin) {
    profit[coin] = {
      totalProfit: profitCoin.total_profit ?? '0',
      pplnsProfit: profitCoin.pplns_profit ?? '0',
    };
  }
  if (profitDoge) {
    profit.DOGE = {
      totalProfit: profitDoge.total_profit ?? '0',
      pplnsProfit: profitDoge.pplns_profit ?? '0',
    };
  }

  const body: ViaBtcPayload = {
    coin,
    hashrate: account
      ? {
          current10minHs: toNumber(account.hashrate_10min),
          hour1Hs: toNumber(account.hashrate_1hour),
          hour24Hs: toNumber(account.hashrate_24hour),
          activeWorkers: account.active_workers ?? 0,
          unactiveWorkers: account.unactive_workers ?? 0,
        }
      : null,
    workers,
    chart: (chart ?? [])
      .map((p) => ({
        timestamp: p.timestamp ?? 0,
        hashrateHs: toNumber(p.hashrate),
        rejectRatePercent: toNumber(p.reject_rate) * 100,
      }))
      .sort((a, b) => a.timestamp - b.timestamp),
    profit,
  };

  return NextResponse.json(body);
}
