'use client';

import { cn } from '@/lib/utils';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type HashrateChartPoint = {
  label: string;
  dogeThs: number;
  workers: number;
};

const axisStyle = { fill: '#9ca3af', fontSize: 11 };
const gridColor = 'rgba(34, 211, 238, 0.08)';
const tooltipStyle = {
  backgroundColor: 'rgba(10, 10, 10, 0.95)',
  border: '1px solid rgba(34, 211, 238, 0.35)',
  borderRadius: 8,
  color: '#e5e7eb',
  fontSize: 12,
};

function MiningTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: HashrateChartPoint }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className='rounded-lg px-3 py-2 shadow-lg' style={tooltipStyle}>
      <div className='font-mono text-[11px] text-cyan-300/90 mb-1'>{label}</div>
      <div className='font-mono text-xs text-amber-200'>
        DOGE: {row.dogeThs.toFixed(2)} TH/s
      </div>
      <div className='font-mono text-xs text-purple-300/90 mt-1'>
        Workers: {formatCompactInt(row.workers)}
      </div>
    </div>
  );
}

function formatCompactInt(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(Math.round(n));
}

type MiningPoolChartsProps = {
  data: HashrateChartPoint[];
  className?: string;
};

export function MiningPoolCharts({ data, className }: MiningPoolChartsProps) {
  const empty = !data.length;

  return (
    <div className={cn('grid grid-cols-1 gap-6 lg:grid-cols-1', className)}>
      <div className='rounded-2xl border border-cyan-400/20 bg-black/50 p-4 sm:p-6 backdrop-blur-sm'>
        <div className='mb-4 flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h3 className='font-mono text-xs uppercase tracking-[0.2em] text-gray-400'>
              Pool hashrate
            </h3>
            <p className='mt-1 text-sm text-cyan-100/70 font-mono'>
              Qubic.li DOGE — rolling buckets (TH/s)
            </p>
          </div>
        </div>
        <div className='h-[300px] w-full min-h-[260px]'>
          {empty ? (
            <div className='flex h-full items-center justify-center font-mono text-sm text-gray-500'>
              No history samples yet.
            </div>
          ) : (
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id='dogeHashFill' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='0%' stopColor='rgb(251, 191, 36)' stopOpacity={0.45} />
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
                  minTickGap={28}
                />
                <YAxis
                  tick={axisStyle}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                  width={44}
                  tickFormatter={(v) => `${Number(v).toFixed(0)}`}
                  label={{
                    value: 'TH/s',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fill: '#6b7280', fontSize: 10 },
                  }}
                />
                <Tooltip content={<MiningTooltip />} />
                <Area
                  type='monotone'
                  dataKey='dogeThs'
                  name='DOGE TH/s'
                  stroke='rgb(251, 191, 36)'
                  strokeWidth={2}
                  fill='url(#dogeHashFill)'
                  dot={false}
                  activeDot={{ r: 4, fill: '#22d3ee', stroke: '#fff', strokeWidth: 1 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className='rounded-2xl border border-purple-400/20 bg-black/50 p-4 sm:p-6 backdrop-blur-sm'>
        <div className='mb-4'>
          <h3 className='font-mono text-xs uppercase tracking-[0.2em] text-gray-400'>
            Pool workers
          </h3>
          <p className='mt-1 text-sm text-cyan-100/70 font-mono'>
            Reported workers per sample (Qubic.li)
          </p>
        </div>
        <div className='h-[260px] w-full'>
          {empty ? (
            <div className='flex h-full items-center justify-center font-mono text-sm text-gray-500'>
              No history samples yet.
            </div>
          ) : (
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray='3 6' stroke={gridColor} />
                <XAxis
                  dataKey='label'
                  tick={axisStyle}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                  interval='preserveStartEnd'
                  minTickGap={28}
                />
                <YAxis
                  tick={axisStyle}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                  width={48}
                  tickFormatter={(v) => formatCompactInt(Number(v))}
                />
                <Tooltip content={<MiningTooltip />} />
                <Line
                  type='monotone'
                  dataKey='workers'
                  name='Workers'
                  stroke='rgb(196, 181, 253)'
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#a78bfa' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
