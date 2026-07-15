'use client';

import { formatHashrateHs } from '@/lib/mining/format';
import { cn } from '@/lib/utils';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCallback, useEffect, useMemo, useState } from 'react';

type ViaBtcWorker = {
  name: string;
  status: string;
  hashrate10minHs: number;
  hashrate1hourHs: number;
  hashrate24hourHs: number;
  rejectRatePercent: number;
  lastActive: number | null;
};

type ViaBtcPayload = {
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

type ChartPoint = {
  label: string;
  hashrateHs: number;
  hashrateGhs: number;
  rejectRatePercent: number;
};

const axisStyle = { fill: '#9ca3af', fontSize: 11 };
const gridColor = 'rgba(34, 211, 238, 0.08)';
const tooltipBox = {
  backgroundColor: 'rgba(10, 10, 10, 0.95)',
  border: '1px solid rgba(34, 211, 238, 0.35)',
  borderRadius: 8,
  color: '#e5e7eb',
  fontSize: 12,
};

function formatProfit(value?: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
}

type ViaBtcTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: ChartPoint }>;
  label?: string;
};

function ViaBtcHashrateTooltip({ active, payload, label }: ViaBtcTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className='rounded-lg px-3 py-2 shadow-lg font-mono' style={tooltipBox}>
      <div className='text-[11px] text-cyan-300/90 mb-1'>{label}</div>
      <div className='text-xs text-amber-200'>{formatHashrateHs(row.hashrateHs)}</div>
      <div className='text-[10px] text-gray-500 mt-1'>
        Reject {row.rejectRatePercent.toFixed(2)}%
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className='rounded-xl border border-white/10 bg-black/40 p-4'>
      <p className='text-[10px] text-gray-500 font-mono uppercase tracking-wider'>
        {label}
      </p>
      <p className={cn('mt-2 text-lg font-mono tabular-nums', accent)}>{value}</p>
    </div>
  );
}

export function ViaBtcMinerSection() {
  const [data, setData] = useState<ViaBtcPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/mining/viabtc');
      const payload = (await res.json()) as ViaBtcPayload;
      if (!res.ok || payload.error) {
        setError(payload.error ?? `viabtc ${res.status}`);
        return;
      }
      setData(payload);
      setError(null);
    } catch {
      setError('Network error loading ViaBTC stats.');
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 60_000);
    return () => clearInterval(id);
  }, [load]);

  const chart: ChartPoint[] = useMemo(() => {
    if (!data?.chart?.length) return [];
    return data.chart.map((p) => ({
      label: new Date(p.timestamp * 1000).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      hashrateHs: p.hashrateHs,
      hashrateGhs: p.hashrateHs / 1e9,
      rejectRatePercent: p.rejectRatePercent,
    }));
  }, [data]);

  const dogeProfit = data?.profit?.DOGE;
  const coinProfit = data?.coin ? data.profit?.[data.coin] : null;

  return (
    <div className='mb-6'>
      <h2 className='font-mono text-xs uppercase tracking-[0.25em] text-gray-400 mb-4'>
        QDoge ASIC miner
      </h2>
      <div className='rounded-2xl border border-cyan-400/25 bg-black/50 p-5 sm:p-6 backdrop-blur-sm'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div>
            <p className='text-[10px] uppercase tracking-widest text-gray-500 font-mono'>
              Pool
            </p>
            <p className='mt-1 font-mono text-sm text-cyan-100/90'>
              ViaBTC · {data?.coin ?? 'LTC'} scrypt · DOGE merged mining
            </p>
            {error ? (
              <p className='mt-2 text-xs text-amber-300 font-mono'>{error}</p>
            ) : null}
          </div>
          <a
            href='https://www.viabtc.com/observer'
            target='_blank'
            rel='noreferrer'
            className='shrink-0 rounded-lg border border-cyan-400/40 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-cyan-300 hover:bg-cyan-400/10 transition-colors'
          >
            ViaBTC pool
          </a>
        </div>

        <div className='mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          <StatTile
            label='Hashrate (10 min)'
            value={
              data?.hashrate ? formatHashrateHs(data.hashrate.current10minHs) : '—'
            }
            accent='text-amber-200'
          />
          <StatTile
            label='Hashrate (1 hour)'
            value={data?.hashrate ? formatHashrateHs(data.hashrate.hour1Hs) : '—'}
            accent='text-cyan-200'
          />
          <StatTile
            label='Hashrate (24 hour)'
            value={data?.hashrate ? formatHashrateHs(data.hashrate.hour24Hs) : '—'}
            accent='text-purple-200'
          />
          <StatTile
            label='Workers'
            value={
              data?.hashrate
                ? `${data.hashrate.activeWorkers} active · ${data.hashrate.unactiveWorkers} offline`
                : '—'
            }
            accent='text-green-300'
          />
          <StatTile
            label='Total earned (DOGE)'
            value={dogeProfit ? `${formatProfit(dogeProfit.totalProfit)} DOGE` : '—'}
            accent='text-amber-200'
          />
          <StatTile
            label={`Total earned (${data?.coin ?? 'LTC'})`}
            value={
              coinProfit
                ? `${formatProfit(coinProfit.totalProfit)} ${data?.coin ?? 'LTC'}`
                : '—'
            }
            accent='text-cyan-200'
          />
        </div>

        <div className='mt-8 space-y-6'>
          <div>
            <h3 className='font-mono text-xs uppercase tracking-[0.2em] text-gray-400 mb-3'>
              Workers list
            </h3>
            {data?.workers?.length ? (
              <div className='overflow-x-auto rounded-xl border border-white/10 bg-black/40'>
                <table className='w-full min-w-[640px] text-left text-sm font-mono'>
                  <thead>
                    <tr className='border-b border-white/10 text-[10px] uppercase tracking-widest text-gray-500'>
                      <th className='px-4 py-3 font-medium'>Worker</th>
                      <th className='px-4 py-3 font-medium'>Status</th>
                      <th className='px-4 py-3 font-medium'>10 min</th>
                      <th className='px-4 py-3 font-medium'>1 hour</th>
                      <th className='px-4 py-3 font-medium'>24 hour</th>
                      <th className='px-4 py-3 font-medium'>Reject</th>
                      <th className='px-4 py-3 font-medium'>Last active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.workers.map((w, idx) => (
                      <tr
                        key={`${w.name}-${idx}`}
                        className='border-b border-white/5 text-gray-200 last:border-0 hover:bg-white/[0.03]'
                      >
                        <td className='px-4 py-3 text-cyan-100/95'>{w.name}</td>
                        <td className='px-4 py-3'>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider border',
                              w.status === 'active'
                                ? 'border-green-400/40 text-green-300/90 bg-green-400/10'
                                : 'border-amber-400/40 text-amber-300/90 bg-amber-400/10'
                            )}
                          >
                            {w.status}
                          </span>
                        </td>
                        <td className='px-4 py-3 tabular-nums text-amber-200/90'>
                          {formatHashrateHs(w.hashrate10minHs)}
                        </td>
                        <td className='px-4 py-3 tabular-nums text-gray-300'>
                          {formatHashrateHs(w.hashrate1hourHs)}
                        </td>
                        <td className='px-4 py-3 tabular-nums text-gray-400'>
                          {formatHashrateHs(w.hashrate24hourHs)}
                        </td>
                        <td className='px-4 py-3 tabular-nums text-red-300/80'>
                          {w.rejectRatePercent.toFixed(2)}%
                        </td>
                        <td className='px-4 py-3 text-xs text-gray-500'>
                          {w.lastActive
                            ? new Date(w.lastActive * 1000).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className='rounded-xl border border-white/10 bg-black/40 p-8 text-center font-mono text-sm text-gray-500'>
                {error ? 'Workers unavailable.' : 'No workers reported yet.'}
              </div>
            )}
          </div>

          <div className='rounded-xl border border-amber-400/15 bg-black/40 p-4 sm:p-5'>
            <div className='mb-3'>
              <h3 className='font-mono text-xs uppercase tracking-[0.2em] text-gray-400'>
                Hashrate history
              </h3>
              <p className='mt-1 text-[11px] text-gray-500 font-mono'>
                {data?.coin ?? 'LTC'} scrypt · ViaBTC · hourly
              </p>
            </div>
            <div className='h-[280px] w-full min-h-[220px]'>
              {chart.length ? (
                <ResponsiveContainer width='100%' height='100%'>
                  <AreaChart
                    data={chart}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id='viabtcHash' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='0%' stopColor='rgb(251, 191, 36)' stopOpacity={0.4} />
                        <stop offset='100%' stopColor='rgb(251, 191, 36)' stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray='3 6' stroke={gridColor} />
                    <XAxis
                      dataKey='label'
                      tick={axisStyle}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                      interval='preserveStartEnd'
                      minTickGap={36}
                    />
                    <YAxis
                      tick={axisStyle}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                      width={50}
                      tickFormatter={(v) => `${Number(v).toFixed(1)}`}
                      label={{
                        value: 'GH/s',
                        angle: -90,
                        position: 'insideLeft',
                        style: { fill: '#6b7280', fontSize: 10 },
                      }}
                    />
                    <Tooltip content={<ViaBtcHashrateTooltip />} />
                    <Area
                      type='monotone'
                      dataKey='hashrateGhs'
                      name='Hashrate'
                      stroke='rgb(251, 191, 36)'
                      strokeWidth={2}
                      fill='url(#viabtcHash)'
                      dot={false}
                      activeDot={{ r: 4, fill: '#22d3ee', stroke: '#fff', strokeWidth: 1 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className='flex h-full items-center justify-center font-mono text-sm text-gray-500'>
                  {error ? 'History unavailable.' : 'No history samples yet.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
