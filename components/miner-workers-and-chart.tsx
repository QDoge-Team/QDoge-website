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

export type MinerWorkerRow = {
  deviceId: string;
  type?: string | null;
  hashrate?: number;
  meanHashrate?: number;
  shares?: number;
  solutions?: number;
  rejects?: {
    lowDiff?: number;
    duplicate?: number;
    stale?: number;
    invalid?: number;
    total?: number;
  };
  lastSeen?: string | null;
  alias?: string | null;
};

export type MinerHistoryPoint = {
  label: string;
  dogeHs: number;
  dogeThs: number;
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

function rejectTotal(r: MinerWorkerRow['rejects']): number {
  if (!r) return 0;
  if (typeof r.total === 'number' && Number.isFinite(r.total)) return r.total;
  return (
    (r.lowDiff ?? 0) +
    (r.duplicate ?? 0) +
    (r.stale ?? 0) +
    (r.invalid ?? 0)
  );
}

/** Keeps charts responsive when upstream returns hundreds of buckets. */
function downsample<T>(rows: T[], maxPoints: number): T[] {
  if (rows.length <= maxPoints) return rows;
  const step = Math.ceil(rows.length / maxPoints);
  const out: T[] = [];
  for (let i = 0; i < rows.length; i += step) out.push(rows[i]!);
  if (out[out.length - 1] !== rows[rows.length - 1]) out.push(rows[rows.length - 1]!);
  return out;
}

type MinerTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: MinerHistoryPoint }>;
  label?: string;
};

function MinerHashrateTooltip({ active, payload, label }: MinerTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className='rounded-lg px-3 py-2 shadow-lg font-mono' style={tooltipBox}>
      <div className='text-[11px] text-cyan-300/90 mb-1'>{label}</div>
      <div className='text-xs text-amber-200'>{formatHashrateHs(row.dogeHs)}</div>
      <div className='text-[10px] text-gray-500 mt-1'>{row.dogeThs.toFixed(3)} TH/s</div>
    </div>
  );
}

export function MinerWorkersTable({
  workers,
  className,
}: {
  workers: MinerWorkerRow[];
  className?: string;
}) {
  if (!workers.length) {
    return (
      <div
        className={cn(
          'rounded-xl border border-white/10 bg-black/40 p-8 text-center font-mono text-sm text-gray-500',
          className
        )}
      >
        No workers reported for this identity yet.
      </div>
    );
  }

  return (
    <div
      className={cn(
        'overflow-x-auto rounded-xl border border-white/10 bg-black/40',
        className
      )}
    >
      <table className='w-full min-w-[640px] text-left text-sm font-mono'>
        <thead>
          <tr className='border-b border-white/10 text-[10px] uppercase tracking-widest text-gray-500'>
            <th className='px-4 py-3 font-medium'>Worker</th>
            <th className='px-4 py-3 font-medium'>Type</th>
            <th className='px-4 py-3 font-medium'>Hashrate</th>
            <th className='px-4 py-3 font-medium'>Mean</th>
            <th className='px-4 py-3 font-medium'>Shares</th>
            <th className='px-4 py-3 font-medium'>Rejects</th>
            <th className='px-4 py-3 font-medium'>Last seen</th>
          </tr>
        </thead>
        <tbody>
          {workers.map((w, idx) => {
            const name =
              (w.alias && String(w.alias).trim()) || w.deviceId || '—';
            const last = w.lastSeen
              ? new Date(w.lastSeen).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—';
            return (
              <tr
                key={`${w.deviceId ?? 'w'}-${idx}`}
                className='border-b border-white/5 text-gray-200 last:border-0 hover:bg-white/[0.03]'
              >
                <td className='px-4 py-3 text-cyan-100/95'>{name}</td>
                <td className='px-4 py-3 text-purple-300/90'>{w.type ?? '—'}</td>
                <td className='px-4 py-3 tabular-nums text-amber-200/90'>
                  {formatHashrateHs(w.hashrate ?? 0)}
                </td>
                <td className='px-4 py-3 tabular-nums text-gray-400'>
                  {formatHashrateHs(w.meanHashrate ?? 0)}
                </td>
                <td className='px-4 py-3 tabular-nums'>{w.shares ?? 0}</td>
                <td className='px-4 py-3 tabular-nums text-red-300/80'>
                  {rejectTotal(w.rejects)}
                </td>
                <td className='px-4 py-3 text-xs text-gray-500'>{last}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function MinerHashrateHistoryChart({
  data,
  resolution,
  className,
}: {
  data: MinerHistoryPoint[];
  resolution?: string;
  className?: string;
}) {
  const chart = downsample(data, 280);
  const empty = !chart.length;

  return (
    <div
      className={cn(
        'rounded-xl border border-amber-400/15 bg-black/40 p-4 sm:p-5',
        className
      )}
    >
      <div className='mb-3 flex flex-wrap items-end justify-between gap-2'>
        <div>
          <h3 className='font-mono text-xs uppercase tracking-[0.2em] text-gray-400'>
            Hashrate history
          </h3>
          <p className='mt-1 text-[11px] text-gray-500 font-mono'>
            DOGE · stats.service{resolution ? ` · ${resolution}` : ''}
          </p>
        </div>
      </div>
      <div className='h-[280px] w-full min-h-[220px]'>
        {empty ? (
          <div className='flex h-full items-center justify-center font-mono text-sm text-gray-500'>
            No history samples in this window.
          </div>
        ) : (
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id='minerDogeHash' x1='0' y1='0' x2='0' y2='1'>
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
                  value: 'TH/s',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: '#6b7280', fontSize: 10 },
                }}
              />
              <Tooltip content={<MinerHashrateTooltip />} />
              <Area
                type='monotone'
                dataKey='dogeThs'
                name='DOGE'
                stroke='rgb(251, 191, 36)'
                strokeWidth={2}
                fill='url(#minerDogeHash)'
                dot={false}
                activeDot={{ r: 4, fill: '#22d3ee', stroke: '#fff', strokeWidth: 1 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
