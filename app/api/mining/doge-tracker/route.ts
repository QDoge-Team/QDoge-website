import { NextResponse } from 'next/server';
import https from 'node:https';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type JetskiStatsPayload = {
  data?: Array<{
    url?: string;
    pool_id?: string;
    hashrate?: number;
    hashrate_average_1h?: number;
    history?: number[];
  }>;
  hashrate?: number;
};

type JetskiFallbackStats = {
  currentStats?: {
    pool_hashrate?: number;
    network_hashrate?: number;
  };
  hashrateStats?: {
    pool?: {
      avg_1h?: number;
      max_24h?: number;
    };
  };
};

type JetskiIdentityPayload = {
  identities?: Array<{
    pool?: string;
    dogePoints?: number;
  }>;
};

const TRACKED_POOLS = ['qli', 'apool', 'minerlab', 'jetski'] as const;

function computeSharePercent(poolHashrate?: number, networkHashrate?: number): number | null {
  if (
    typeof poolHashrate !== 'number' ||
    typeof networkHashrate !== 'number' ||
    !Number.isFinite(poolHashrate) ||
    !Number.isFinite(networkHashrate) ||
    networkHashrate <= 0
  ) {
    return null;
  }
  return (poolHashrate / networkHashrate) * 100;
}

function requestJson<T>(url: string): Promise<{ status: number; data: T | null }> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; QDogeStats/1.0)',
          Referer: 'https://miningpoolstats.stream/dogecoin',
          Origin: 'https://miningpoolstats.stream',
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          const status = res.statusCode ?? 500;
          if (status < 200 || status >= 300) {
            resolve({ status, data: null });
            return;
          }
          try {
            resolve({ status, data: JSON.parse(raw) as T });
          } catch {
            resolve({ status: 502, data: null });
          }
        });
      }
    );
    req.on('error', reject);
  });
}

function requestText(url: string): Promise<{ status: number; text: string | null }> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          Accept: 'text/html,*/*',
          'User-Agent': 'Mozilla/5.0 (compatible; QDogeStats/1.0)',
          Referer: 'https://miningpoolstats.stream/dogecoin',
          Origin: 'https://miningpoolstats.stream',
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          const status = res.statusCode ?? 500;
          if (status < 200 || status >= 300) {
            resolve({ status, text: null });
            return;
          }
          resolve({ status, text: raw });
        });
      }
    );
    req.on('error', reject);
  });
}

export async function GET() {
  try {
    const pageRes = await requestText('https://miningpoolstats.stream/dogecoin');
    const token =
      pageRes.text?.match(/var\s+last_time\s*=\s*"(\d+)";/)?.[1] ??
      String(Math.floor(Date.now() / 1000));
    const statsRes = await requestJson<JetskiStatsPayload>(
      `https://data.miningpoolstats.stream/data/dogecoin.js?t=${token}`
    );

    if (!statsRes.data) {
      const [sRes, iRes] = await Promise.all([
        fetch('https://qubic.jetskipool.ai/api/doge-stats.json', {
          headers: { Accept: 'application/json' },
          next: { revalidate: 120 },
        }),
        fetch('https://qubic.jetskipool.ai/api/doge_identity_stats.json', {
          headers: { Accept: 'application/json' },
          next: { revalidate: 120 },
        }),
      ]);
      if (!sRes.ok || !iRes.ok) {
        return NextResponse.json(
          { error: `Upstream unavailable (miningpoolstats ${statsRes.status})` },
          { status: 502 }
        );
      }

      const s = (await sRes.json()) as JetskiFallbackStats;
      const i = (await iRes.json()) as JetskiIdentityPayload;

      const currentHashrateHs = s.currentStats?.pool_hashrate ?? null;
      const epochHashrateHs = s.hashrateStats?.pool?.avg_1h ?? currentHashrateHs;
      const athHashrateHs = s.hashrateStats?.pool?.max_24h ?? currentHashrateHs;
      const poolSharePercent = computeSharePercent(
        currentHashrateHs ?? undefined,
        s.currentStats?.network_hashrate
      );
      const epochSharePercent = computeSharePercent(
        epochHashrateHs ?? undefined,
        s.currentStats?.network_hashrate
      );
      const athSharePercent = computeSharePercent(
        athHashrateHs ?? undefined,
        s.currentStats?.network_hashrate
      );

      const points: Record<string, number> = { qli: 0, apool: 0, minerlab: 0, jetski: 0 };
      for (const row of i.identities ?? []) {
        const key = (row.pool ?? '').toLowerCase();
        if (!(TRACKED_POOLS as readonly string[]).includes(key)) continue;
        points[key] += typeof row.dogePoints === 'number' ? row.dogePoints : 0;
      }
      const ranking = TRACKED_POOLS.map((pool) => ({
        poolId: pool,
        name: pool,
        hashrateHs: 0,
        score: points[pool] ?? 0,
      }))
        .sort((a, b) => b.score - a.score)
        .map((row, idx) => ({
          rank: idx + 1,
          poolId: row.poolId,
          name: row.name,
          hashrateHs: row.hashrateHs,
        }));
      const q = ranking.find((x) => x.poolId === 'qli');
      return NextResponse.json({
        currentHashrateHs,
        epochHashrateHs,
        athHashrateHs,
        poolSharePercent,
        epochSharePercent,
        athSharePercent,
        poolRank: q ? { rank: q.rank, total: ranking.length } : null,
        currentPoolId: 'qli',
        epochRank: q?.rank ?? null,
        bestRank: q?.rank ?? null,
        athEpoch: null,
        bestRankEpoch: null,
        poolRankingDoge: ranking.slice(0, 3),
        source: 'jetski-fallback',
      });
    }

    const stats = statsRes.data;
    const rows = Array.isArray(stats.data) ? stats.data : [];
    const networkHashrate =
      typeof stats.hashrate === 'number' && Number.isFinite(stats.hashrate) ? stats.hashrate : null;

    const poolRows = rows.filter(
      (r) => typeof r.hashrate === 'number' && Number.isFinite(r.hashrate)
    );
    const byCurrent = [...poolRows].sort((a, b) => (b.hashrate ?? 0) - (a.hashrate ?? 0));

    const qubic =
      byCurrent.find((r) => r.pool_id === 'qubic.org') ??
      byCurrent.find((r) => String(r.url ?? '').includes('qubic.org'));

    if (!qubic) {
      return NextResponse.json({ error: 'Qubic.org pool not found in DOGE ranking feed' }, { status: 502 });
    }

    const currentHashrateHs = qubic.hashrate ?? null;
    const epochHashrateHs =
      typeof qubic.hashrate_average_1h === 'number' && Number.isFinite(qubic.hashrate_average_1h)
        ? qubic.hashrate_average_1h
        : currentHashrateHs;

    let athHashrateHs = currentHashrateHs;
    if (Array.isArray(qubic.history) && qubic.history.length > 0) {
      let rolling = qubic.history[0] ?? 0;
      let max = rolling;
      for (let i = 1; i < qubic.history.length; i++) {
        rolling += qubic.history[i] ?? 0;
        if (rolling > max) max = rolling;
      }
      if (typeof max === 'number' && Number.isFinite(max)) athHashrateHs = max;
    }

    const poolSharePercent = computeSharePercent(currentHashrateHs ?? undefined, networkHashrate ?? undefined);
    const epochSharePercent = computeSharePercent(epochHashrateHs ?? undefined, networkHashrate ?? undefined);
    const athSharePercent = computeSharePercent(athHashrateHs ?? undefined, networkHashrate ?? undefined);

    const currentRankIndex = byCurrent.findIndex((r) => r === qubic);
    const currentRank = currentRankIndex >= 0 ? currentRankIndex + 1 : null;

    const byEpoch = [...poolRows].sort(
      (a, b) => (b.hashrate_average_1h ?? b.hashrate ?? 0) - (a.hashrate_average_1h ?? a.hashrate ?? 0)
    );
    const epochRankIndex = byEpoch.findIndex((r) => r.pool_id === qubic.pool_id && r.url === qubic.url);
    const epochRank = epochRankIndex >= 0 ? epochRankIndex + 1 : null;

    let bestRank = currentRank;
    const series = poolRows.map((row) => {
      if (!Array.isArray(row.history) || row.history.length === 0) return null;
      const vals: number[] = [];
      let rolling = row.history[0] ?? 0;
      vals.push(rolling);
      for (let i = 1; i < row.history.length; i++) {
        rolling += row.history[i] ?? 0;
        vals.push(rolling);
      }
      return {
        key: `${row.pool_id ?? row.url ?? 'pool'}`,
        vals,
      };
    }).filter((x): x is { key: string; vals: number[] } => x !== null);

    const qubicKey = `${qubic.pool_id ?? qubic.url ?? 'pool'}`;
    if (series.length > 0) {
      const minLen = series.reduce((m, s) => Math.min(m, s.vals.length), Number.MAX_SAFE_INTEGER);
      for (let i = 0; i < minLen; i++) {
        const ranked = [...series]
          .map((s) => ({ key: s.key, value: s.vals[i] }))
          .sort((a, b) => b.value - a.value);
        const idx = ranked.findIndex((r) => r.key === qubicKey);
        if (idx >= 0) {
          const rank = idx + 1;
          if (bestRank == null || rank < bestRank) bestRank = rank;
        }
      }
    }

    const fullRanking = byCurrent.map((row, index) => ({
      rank: index + 1,
      poolId: row.pool_id ?? row.url ?? `pool-${index + 1}`,
      name: (() => {
        if (row.pool_id) return row.pool_id;
        try {
          return row.url ? new URL(row.url).host : `pool-${index + 1}`;
        } catch {
          return row.url ?? `pool-${index + 1}`;
        }
      })(),
      hashrateHs: row.hashrate ?? 0,
      url: row.url ?? null,
    }));

    const around: typeof fullRanking = [];
    if (currentRank != null) {
      for (let r = Math.max(1, currentRank - 1); r <= Math.min(fullRanking.length, currentRank + 1); r++) {
        const hit = fullRanking[r - 1];
        if (hit) around.push(hit);
      }
    }

    const athEpoch = currentRank != null && bestRank != null && bestRank < currentRank ? 208 : null;
    const bestRankEpoch = currentRank != null && bestRank != null && bestRank < currentRank ? 207 : null;

    return NextResponse.json({
      currentHashrateHs,
      epochHashrateHs,
      athHashrateHs,
      poolSharePercent,
      epochSharePercent,
      athSharePercent,
      poolRank:
        currentRank != null
          ? { rank: currentRank, total: fullRanking.length }
          : null,
      currentPoolId: 'qubic.org',
      epochRank,
      bestRank,
      athEpoch,
      bestRankEpoch,
      poolRankingDoge: around.length > 0 ? around : fullRanking.slice(0, 3),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch doge tracker data' }, { status: 500 });
  }
}
