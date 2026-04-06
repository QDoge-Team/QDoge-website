'use client';

import { MagicCard } from '@/components/ui/magic-card';
import {
  MinerHashrateHistoryChart,
  MinerWorkersTable,
  type MinerHistoryPoint,
  type MinerWorkerRow,
} from '@/components/miner-workers-and-chart';
import {
  MiningPoolCharts,
  type HashrateChartPoint,
} from '@/components/mining-pool-charts';
import { QDOGE_PUBLIC_MINER_ID } from '@/lib/mining/constants';
import { formatCompact, formatHashrateHs } from '@/lib/mining/format';
import { cn } from '@/lib/utils';
import {
  Activity,
  ArrowLeft,
  Cpu,
  Globe,
  Network,
  Pickaxe,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

type DispatcherPayload = {
  timestamp?: number;
  uptime_seconds?: number;
  mining?: {
    hashrate?: number;
    hashrate_display?: string;
    pool_difficulty?: number;
    tasks_distributed?: number;
  };
  network?: {
    connected_peers?: number;
    total_peers?: number;
    peers?: number;
    [key: string]: unknown;
  };
  pool?: {
    submitted?: number;
    accepted?: number;
    rejected?: number;
    [key: string]: unknown;
  };
  solutions?: {
    received?: number;
    accepted?: number;
    rejected?: number;
    stale?: number;
  };
  error?: string;
};

type PoolCurrent = {
  epoch?: number;
  totalHashrateByType?: Record<string, number>;
  totalWorkers?: number;
  activeUsers?: number;
  totalSharesByType?: Record<string, number>;
  error?: string;
};

type PoolHistoryPayload = {
  current?: PoolCurrent;
  history?: Array<{
    timestamp: number;
    epoch: number;
    totalHashrateByType?: Record<string, number>;
    totalWorkers?: number;
  }>;
  error?: string;
};

type AddressPayload = {
  userId?: string;
  hashrateByType?: Record<string, number>;
  stats?: {
    sharesByType?: Record<string, number>;
    workers?: number;
    solutions?: number;
    estimatedRevenueByType?: Record<string, number>;
  };
  workers?: MinerWorkerRow[];
  error?: string;
};

type AddressHistoryPayload = {
  userId?: string;
  resolution?: string;
  data?: Array<{
    timestamp: number;
    epoch: number;
    hashrateByType?: Record<string, number>;
  }>;
  error?: string;
};

type TickPayload = {
  tick?: number;
  epoch?: number;
  isIdling?: boolean;
  error?: string;
};

function MagicStat({
  label,
  value,
  sub,
  icon: Icon,
  gradientFrom,
  gradientTo,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof Activity;
  gradientFrom: string;
  gradientTo: string;
}) {
  return (
    <div className='rounded-2xl border border-white/10 bg-black/40 p-[1px] overflow-hidden shadow-[0_0_24px_rgba(0,243,255,0.06)]'>
      <MagicCard
        className='rounded-2xl p-5 md:p-6 min-h-[130px] flex flex-col'
        gradientFrom={gradientFrom}
        gradientTo={gradientTo}
        gradientColor='rgba(0, 243, 255, 0.12)'
        gradientOpacity={0.3}
      >
        <div className='flex items-center justify-between gap-2 mb-3'>
          <span className='text-[10px] uppercase tracking-[0.18em] text-gray-400 font-mono'>
            {label}
          </span>
          <Icon className='h-4 w-4 text-cyan-400/85 shrink-0' />
        </div>
        <p className='text-xl sm:text-2xl font-bold tabular-nums text-white font-mono leading-tight'>
          {value}
        </p>
        {sub ? (
          <p className='text-[11px] text-gray-500 font-mono mt-2 leading-snug'>{sub}</p>
        ) : null}
      </MagicCard>
    </div>
  );
}

export function DogeStatsPageContent() {
  const [dispatcher, setDispatcher] = useState<DispatcherPayload | null>(null);
  const [pool, setPool] = useState<PoolCurrent | null>(null);
  const [history, setHistory] = useState<PoolHistoryPayload | null>(null);
  const [address, setAddress] = useState<AddressPayload | null>(null);
  const [addressHistory, setAddressHistory] = useState<AddressHistoryPayload | null>(
    null
  );
  const [tick, setTick] = useState<TickPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const id = encodeURIComponent(QDOGE_PUBLIC_MINER_ID);
      const [dRes, pRes, hRes, aRes, ahRes, tRes] = await Promise.all([
        fetch('/api/mining/dispatcher'),
        fetch('/api/mining/pool'),
        fetch('/api/mining/pool/history'),
        fetch(`/api/mining/address/${id}`),
        fetch(`/api/mining/address/${id}/history?resolution=auto`),
        fetch('/api/mining/tick'),
      ]);

      if (dRes.ok) setDispatcher(await dRes.json());
      else setDispatcher({ error: `dispatcher ${dRes.status}` });

      if (pRes.ok) setPool(await pRes.json());
      else setPool({ error: `pool ${pRes.status}` });

      if (hRes.ok) setHistory(await hRes.json());
      else setHistory({ error: `history ${hRes.status}` });

      if (aRes.ok) setAddress(await aRes.json());
      else setAddress({ error: `address ${aRes.status}` });

      if (ahRes.ok) setAddressHistory(await ahRes.json());
      else setAddressHistory({ error: `address history ${ahRes.status}` });

      if (tRes.ok) setTick(await tRes.json());
      else setTick({ error: `tick ${tRes.status}` });

      setUpdatedAt(new Date());
    } catch {
      setLoadError('Network error loading mining data.');
      setUpdatedAt(new Date());
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 30_000);
    return () => clearInterval(id);
  }, [load]);

  const minerHistoryChart: MinerHistoryPoint[] = useMemo(() => {
    const rows = addressHistory?.data;
    if (!rows?.length) return [];
    const sorted = [...rows].sort((a, b) => a.timestamp - b.timestamp);
    return sorted.map((row) => {
      const dogeHs = row.hashrateByType?.DOGE ?? 0;
      const d = new Date(row.timestamp * 1000);
      return {
        label: d.toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        dogeHs,
        dogeThs: dogeHs / 1e12,
      };
    });
  }, [addressHistory]);

  const chartData: HashrateChartPoint[] = useMemo(() => {
    const rows = history?.history;
    if (!rows?.length) return [];
    const sorted = [...rows].sort((a, b) => a.timestamp - b.timestamp);
    return sorted.map((row) => {
      const dogeHs = row.totalHashrateByType?.DOGE ?? 0;
      const d = new Date(row.timestamp * 1000);
      return {
        label: d.toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        dogeThs: dogeHs / 1e12,
        workers: row.totalWorkers ?? 0,
      };
    });
  }, [history]);

  const epoch = tick?.epoch ?? pool?.epoch ?? history?.current?.epoch;
  const dogePoolHs =
    pool?.totalHashrateByType?.DOGE ??
    history?.current?.totalHashrateByType?.DOGE ??
    0;

  const dispatcherMining = dispatcher?.mining;
  const showDispatcherError = dispatcher?.error && !dispatcherMining;

  return (
    <div className='relative'>
      <div className='absolute inset-0 bg-linear-to-br from-gray-900 via-black to-gray-900 pointer-events-none' />
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(0,243,255,0.12),transparent_55%)] pointer-events-none' />
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(188,19,254,0.12),transparent_55%)] pointer-events-none' />

      <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 md:pt-32 md:pb-24'>
        <Link
          href='/'
          className='inline-flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors font-mono uppercase tracking-wider mb-8'
        >
          <ArrowLeft className='h-4 w-4' />
          Back to home
        </Link>

        <div className='max-w-4xl mb-10'>
          <p className='inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-black/70 px-4 py-1 text-[11px] tracking-[0.28em] uppercase text-cyan-300 font-mono mb-5'>
            <span className='h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse' />
            Live mining
          </p>
          <h1 className='text-4xl sm:text-5xl md:text-6xl font-bold font-mono text-white tracking-tight mb-3'>
            <span className='bg-linear-to-r from-cyan-400 via-purple-400 to-amber-300 bg-clip-text text-transparent'>
              Qubic × DOGE
            </span>
          </h1>
          {/* <p className='text-cyan-100/80 text-sm sm:text-base leading-relaxed font-mono max-w-2xl'>
            Dispatcher metrics from{' '}
            <a
              href='https://doge-stats.qubic.org/'
              className='text-cyan-400 hover:underline'
              target='_blank'
              rel='noreferrer'
            >
              doge-stats.qubic.org
            </a>
            , pool &amp; charts from{' '}
            <a
              href='https://stats.service.qubic.li/'
              className='text-cyan-400 hover:underline'
              target='_blank'
              rel='noreferrer'
            >
              stats.service.qubic.li
            </a>{' '}
            (server-derived via this site&apos;s API routes). Chart layout inspired by trackers
            like{' '}
            <a
              href='https://www.codedonqubic.com/doge'
              className='text-cyan-400 hover:underline'
              target='_blank'
              rel='noreferrer'
            >
              Coded on Qubic
            </a>
            .
          </p> */}
          {updatedAt ? (
            <p className='mt-3 text-[11px] font-mono text-gray-500'>
              Last refresh: {updatedAt.toLocaleTimeString()}
              {loadError ? (
                <span className='text-amber-400 ml-2'>({loadError})</span>
              ) : null}
            </p>
          ) : null}
        </div>

        {/* Epoch strip — tracker-style header band */}
        <div className='mb-10 rounded-2xl border border-white/10 bg-black/55 p-4 sm:p-5 backdrop-blur-sm overflow-hidden'>
          <div className='flex flex-wrap items-center justify-between gap-3 font-mono text-sm'>
            <div className='flex flex-wrap items-center gap-3'>
              <span className='text-gray-500 uppercase text-[10px] tracking-[0.25em]'>
                Epoch
              </span>
              <span className='text-white text-lg font-bold tabular-nums'>
                {epoch != null ? `EP ${epoch}` : '—'}
              </span>
              {tick?.tick != null ? (
                <span className='text-cyan-200/80 text-xs sm:text-sm'>
                  Tick {formatCompact(tick.tick)}
                </span>
              ) : null}
              {tick?.isIdling !== undefined ? (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider border',
                    tick.isIdling
                      ? 'border-amber-400/40 text-amber-300/90 bg-amber-400/10'
                      : 'border-green-400/40 text-green-300/90 bg-green-400/10'
                  )}
                >
                  {tick.isIdling ? 'Idling' : 'Active'}
                </span>
              ) : null}
            </div>
            <div className='text-xs text-gray-400'>
              Pool DOGE:{' '}
              <span className='text-amber-200'>{formatHashrateHs(dogePoolHs)}</span>
            </div>
          </div>
          <div className='mt-4 h-2 w-full rounded-full bg-gray-900 overflow-hidden border border-white/5'>
            <div className='h-full w-full rounded-full bg-linear-to-r from-cyan-500 via-purple-500 to-amber-400 opacity-90' />
          </div>
        </div>

        {showDispatcherError ? (
          <div className='mb-6 rounded-xl border border-amber-400/30 bg-amber-400/5 px-4 py-3 font-mono text-sm text-amber-200'>
            Dispatcher feed unavailable ({dispatcher?.error}). Pool charts may still load.
          </div>
        ) : null}

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mb-10'>
          <MagicStat
            label='Dispatcher hashrate'
            value={
              dispatcherMining?.hashrate_display ??
              (dispatcherMining?.hashrate
                ? formatHashrateHs(dispatcherMining.hashrate)
                : '—')
            }
            sub='doge-connect dispatcher'
            icon={Pickaxe}
            gradientFrom='rgba(251, 191, 36, 0.25)'
            gradientTo='rgba(10, 10, 10, 0.95)'
          />
          <MagicStat
            label='Pool difficulty'
            value={
              dispatcherMining?.pool_difficulty != null
                ? formatCompact(dispatcherMining.pool_difficulty)
                : '—'
            }
            sub='Live from dispatcher'
            icon={Cpu}
            gradientFrom='rgba(0, 243, 255, 0.22)'
            gradientTo='rgba(10, 10, 10, 0.95)'
          />
          <MagicStat
            label='Tasks distributed'
            value={
              dispatcherMining?.tasks_distributed != null
                ? formatCompact(dispatcherMining.tasks_distributed)
                : '—'
            }
            sub='Dispatcher pipeline'
            icon={Activity}
            gradientFrom='rgba(57, 255, 20, 0.18)'
            gradientTo='rgba(10, 10, 10, 0.95)'
          />
          <MagicStat
            label='Pool workers'
            value={pool?.totalWorkers != null ? formatCompact(pool.totalWorkers) : '—'}
            sub='stats.service — all algorithms'
            icon={Users}
            gradientFrom='rgba(188, 19, 254, 0.22)'
            gradientTo='rgba(10, 10, 10, 0.95)'
          />
          <MagicStat
            label='Active miners'
            value={pool?.activeUsers != null ? formatCompact(pool.activeUsers) : '—'}
            sub='Qubic.li pool'
            icon={Globe}
            gradientFrom='rgba(0, 128, 255, 0.2)'
            gradientTo='rgba(10, 10, 10, 0.95)'
          />
          <MagicStat
            label='Dispatcher peers'
            value={(() => {
              const n = dispatcher?.network;
              if (!n) return '—';
              const c = n.connected_peers ?? n.peers;
              if (typeof c === 'number' && Number.isFinite(c)) return String(c);
              return '—';
            })()}
            sub={
              dispatcher?.network?.total_peers != null &&
              typeof dispatcher.network.total_peers === 'number'
                ? `${dispatcher.network.total_peers} known · P2P`
                : 'P2P connectivity'
            }
            icon={Network}
            gradientFrom='rgba(34, 211, 238, 0.18)'
            gradientTo='rgba(10, 10, 10, 0.95)'
          />
        </div>

        <div className='mb-10'>
          <h2 className='font-mono text-xs uppercase tracking-[0.25em] text-gray-400 mb-4'>
            Pool history
          </h2>
          <MiningPoolCharts data={chartData} />
        </div>

        <div className='mb-6'>
          <h2 className='font-mono text-xs uppercase tracking-[0.25em] text-gray-400 mb-4'>
            QDoge public miner
          </h2>
          <div className='rounded-2xl border border-cyan-400/25 bg-black/50 p-5 sm:p-6 backdrop-blur-sm'>
            <div className='flex flex-wrap items-start justify-between gap-4'>
              <div>
                <p className='text-[10px] uppercase tracking-widest text-gray-500 font-mono'>
                  Identity
                </p>
                <p className='mt-1 font-mono text-xs sm:text-sm text-cyan-100/90 break-all max-w-xl'>
                  {address?.userId ?? QDOGE_PUBLIC_MINER_ID}
                </p>
                {address?.error ? (
                  <p className='mt-2 text-xs text-amber-300 font-mono'>{address.error}</p>
                ) : null}
              </div>
              <a
                href={`https://platform.qubic.li/public/id/${QDOGE_PUBLIC_MINER_ID}`}
                target='_blank'
                rel='noreferrer'
                className='shrink-0 rounded-lg border border-cyan-400/40 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-cyan-300 hover:bg-cyan-400/10 transition-colors'
              >
                Open on qubic.li
              </a>
            </div>
            <div className='mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4'>
              <div className='rounded-xl border border-white/10 bg-black/40 p-4'>
                <p className='text-[10px] text-gray-500 font-mono uppercase tracking-wider'>
                  DOGE hashrate
                </p>
                <p className='mt-2 text-lg font-mono text-amber-200'>
                  {address?.hashrateByType?.DOGE != null
                    ? formatHashrateHs(address.hashrateByType.DOGE)
                    : '—'}
                </p>
              </div>
              <div className='rounded-xl border border-white/10 bg-black/40 p-4'>
                <p className='text-[10px] text-gray-500 font-mono uppercase tracking-wider'>
                  DOGE shares (stats)
                </p>
                <p className='mt-2 text-lg font-mono text-cyan-200'>
                  {address?.stats?.sharesByType?.DOGE != null
                    ? formatCompact(address.stats.sharesByType.DOGE)
                    : '—'}
                </p>
              </div>
              <div className='rounded-xl border border-white/10 bg-black/40 p-4'>
                <p className='text-[10px] text-gray-500 font-mono uppercase tracking-wider'>
                  Workers
                </p>
                <p className='mt-2 text-lg font-mono text-purple-200'>
                  {address?.stats?.workers != null ? String(address.stats.workers) : '—'}
                </p>
              </div>
            </div>

            {addressHistory?.error ? (
              <p className='mt-4 text-xs font-mono text-amber-300'>
                Hashrate history: {addressHistory.error}
              </p>
            ) : null}

            <div className='mt-8 space-y-6'>
              <div>
                <h3 className='font-mono text-xs uppercase tracking-[0.2em] text-gray-400 mb-3'>
                  Workers list
                </h3>
                <MinerWorkersTable workers={address?.workers ?? []} />
              </div>
              <div>
                <MinerHashrateHistoryChart
                  data={minerHistoryChart}
                  resolution={addressHistory?.resolution}
                />
              </div>
            </div>
          </div>
        </div>

        {/* <div className='rounded-xl border border-white/10 bg-black/30 px-4 py-5 font-mono text-[11px] text-gray-500 leading-relaxed'>
          <p className='flex items-start gap-2'>
            Data is read from public endpoints aggregated on the Qubic network. This page uses
            Next.js server routes to avoid browser CORS limits on{' '}
            <code className='text-gray-400'>stats.service.qubic.li</code>. Not financial advice;
            metrics can lag or fail if upstreams change.
          </p>
        </div> */}
      </div>
    </div>
  );
}
