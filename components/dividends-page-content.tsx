'use client';

import { MagicCard } from '@/components/ui/magic-card';
import {
  DIVIDEND_PROJECTS,
  EPOCH_FROM,
  EPOCH_TO,
  QTREAT_MAX_SUPPLY,
  QTREAT_SUPPLY_BY_EPOCH,
  type DividendProject,
} from '@/lib/dividends/data';
import { formatCompact } from '@/lib/mining/format';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  ChevronDown,
  Coins,
  Crown,
  Download,
  Hourglass,
  PiggyBank,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const axisStyle = { fill: '#9ca3af', fontSize: 11 };
const gridColor = 'rgba(34, 211, 238, 0.08)';
const tooltipStyle = {
  backgroundColor: 'rgba(10, 10, 10, 0.95)',
  border: '1px solid rgba(34, 211, 238, 0.35)',
  borderRadius: 8,
  color: '#e5e7eb',
  fontSize: 12,
};

function formatQu(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return Math.round(n).toLocaleString('en-US');
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  gradientFrom,
}: {
  label: string;
  value: string;
  sub?: ReactNode;
  icon: typeof Coins;
  gradientFrom: string;
}) {
  return (
    <div className='flex h-full min-h-[120px] flex-col rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_24px_rgba(0,243,255,0.06)]'>
      <MagicCard
        className='h-full min-h-[120px] flex-1 flex flex-col rounded-2xl p-5 md:p-6'
        gradientFrom={gradientFrom}
        gradientTo='rgba(10, 10, 10, 0.95)'
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
          <p className='text-[11px] text-gray-300 font-mono mt-2 leading-snug'>{sub}</p>
        ) : null}
      </MagicCard>
    </div>
  );
}

type EpochPoint = { epoch: string; payout: number };

function EpochTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className='rounded-lg px-3 py-2 shadow-lg' style={tooltipStyle}>
      <div className='font-mono text-[11px] text-cyan-300/90 mb-1'>Epoch {label}</div>
      <div className='font-mono text-xs text-amber-200'>
        {formatQu(payload[0]?.value)} qu / token
      </div>
    </div>
  );
}

type YieldPoint = { name: string; weekly: number; isQtreat: boolean };

function YieldTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: YieldPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className='rounded-lg px-3 py-2 shadow-lg' style={tooltipStyle}>
      <div className='font-mono text-[11px] text-cyan-300/90 mb-1'>{row.name}</div>
      <div className='font-mono text-xs text-amber-200'>
        {row.weekly.toFixed(2)}% weekly yield
      </div>
    </div>
  );
}

const ALL_EPOCHS_DESC = Array.from(
  { length: EPOCH_TO - EPOCH_FROM + 1 },
  (_, i) => EPOCH_TO - i
);

export function DividendsPageContent() {
  const qtreat = DIVIDEND_PROJECTS.find((p) => p.name === 'QTREAT') as DividendProject;
  const [showRaw, setShowRaw] = useState(false);

  const ranked = useMemo(
    () =>
      [...DIVIDEND_PROJECTS]
        .filter((p) => p.totalDividends > 0)
        .sort((a, b) => b.weeklyYieldPct - a.weeklyYieldPct),
    []
  );
  const inactive = useMemo(
    () => DIVIDEND_PROJECTS.filter((p) => p.totalDividends <= 0),
    []
  );

  const epochChart: EpochPoint[] = useMemo(
    () =>
      qtreat.epochs
        .map((payout, i) => ({ epoch: String(EPOCH_FROM + i), payout }))
        .filter((p): p is EpochPoint => p.payout != null),
    [qtreat]
  );

  const yieldChart: YieldPoint[] = useMemo(
    () =>
      ranked.map((p) => ({
        name: p.name,
        weekly: p.weeklyYieldPct,
        isQtreat: p.name === 'QTREAT',
      })),
    [ranked]
  );

  const firstPayoutEpoch = EPOCH_FROM + qtreat.epochs.findIndex((v) => v != null);
  const epochsPaid = qtreat.epochs.filter((v) => v != null).length;
  const latestPerToken = epochChart.at(-1)?.payout ?? 0;
  const latestEpoch = epochChart.at(-1)?.epoch ?? '—';
  const latestSupply = QTREAT_SUPPLY_BY_EPOCH[Number(latestEpoch)] ?? 0;
  const latestTotal = latestPerToken * latestSupply;

  // Cumulative qu paid across all holders: payout per token times that
  // epoch's actual circulating supply, summed only over epochs where both
  // are known (supply history is tracked from epoch 198 onward).
  const totalDistributed = epochChart.reduce((sum, { epoch, payout }) => {
    const supply = QTREAT_SUPPLY_BY_EPOCH[Number(epoch)];
    return supply ? sum + payout * supply : sum;
  }, 0);

  const exportCsv = useCallback(() => {
    const header = [
      'project',
      'kind',
      'sc_index',
      'price_qu',
      'avg_weekly_qu',
      'total_paid_qu',
      'weekly_yield_pct',
      'annual_yield_pct',
      'payback_weeks',
      ...ALL_EPOCHS_DESC.map((e) => `epoch_${e}`),
    ];
    const rows = DIVIDEND_PROJECTS.map((p) => {
      const byEpoch = new Map(p.epochs.map((v, i) => [EPOCH_FROM + i, v]));
      return [
        p.name,
        p.kind,
        p.scIndex ?? '',
        p.price,
        p.avgWeekly,
        p.totalDividends,
        p.weeklyYieldPct,
        p.annualYieldPct,
        p.paybackWeeks ?? '',
        ...ALL_EPOCHS_DESC.map((e) => byEpoch.get(e) ?? ''),
      ].join(',');
    });
    const blob = new Blob([[header.join(','), ...rows].join('\n')], {
      type: 'text/csv',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qubic-dividends-comparison-epoch${EPOCH_FROM}-${EPOCH_TO}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

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

        <div className='flex flex-wrap items-end justify-between gap-6 mb-10'>
          <div className='max-w-3xl'>
            <p className='inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-black/70 px-4 py-1 text-[11px] tracking-[0.28em] uppercase text-cyan-300 font-mono mb-5'>
              <span className='h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse' />
              Weekly payouts
            </p>
            <h1 className='text-4xl sm:text-5xl md:text-6xl font-bold font-mono text-white tracking-tight mb-3'>
              QTREAT{' '}
              <span className='bg-linear-to-r from-cyan-400 via-purple-400 to-amber-300 bg-clip-text text-transparent'>
                Dividends
              </span>
            </h1>
            <p className='text-gray-400 text-sm font-mono'>
              Every epoch, QTREAT holders receive QUBIC dividends — the highest yield of
              any dividend-paying project on the network.
            </p>
          </div>
          <button
            onClick={exportCsv}
            className='inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/55 px-4 py-2 font-mono text-xs uppercase tracking-wider text-gray-300 hover:text-cyan-300 hover:border-cyan-400/40 transition-colors shrink-0'
          >
            <Download className='h-3.5 w-3.5' />
            Export raw data (CSV)
          </button>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5 mb-10'>
          <StatCard
            label='Total distributed'
            value={`${formatCompact(totalDistributed)} qu`}
            sub={`Across all holders, ${epochsPaid} epochs since ${firstPayoutEpoch}`}
            icon={PiggyBank}
            gradientFrom='rgba(251, 191, 36, 0.24)'
          />
          <StatCard
            label='Paid per token'
            value={`${formatQu(qtreat.totalDividends)} qu`}
            sub={`Avg ${formatQu(qtreat.avgWeekly)} qu / week`}
            icon={Coins}
            gradientFrom='rgba(0, 243, 255, 0.22)'
          />
          <StatCard
            label={`Latest epoch (${latestEpoch})`}
            value={`${formatQu(latestPerToken)} qu`}
            sub={`≈ ${formatCompact(latestTotal)} qu across ${latestSupply.toLocaleString('en-US')} circulating of ${QTREAT_MAX_SUPPLY.toLocaleString('en-US')} max`}
            icon={Sparkles}
            gradientFrom='rgba(0, 243, 255, 0.22)'
          />
          <StatCard
            label='Annual yield'
            value={`${qtreat.annualYieldPct.toFixed(2)}%`}
            sub={`${qtreat.weeklyYieldPct.toFixed(2)}% weekly · #1 on Qubic`}
            icon={Crown}
            gradientFrom='rgba(168, 85, 247, 0.24)'
          />
          <StatCard
            label='Payback period'
            value={`${Math.round(qtreat.paybackWeeks ?? 0)} weeks`}
            sub={`At ${formatCompact(qtreat.price)} qu / token (QX)`}
            icon={Hourglass}
            gradientFrom='rgba(34, 197, 94, 0.2)'
          />
        </div>

        <div className='rounded-2xl border border-cyan-400/20 bg-black/50 p-4 sm:p-6 backdrop-blur-sm mb-10'>
          <div className='mb-4'>
            <h2 className='font-mono text-xs uppercase tracking-[0.2em] text-gray-400'>
              QTREAT payout per epoch
            </h2>
            <p className='mt-1 text-sm text-cyan-100/70 font-mono'>
              qu per token · one epoch = one week
            </p>
          </div>
          <div className='h-64 sm:h-72'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={epochChart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={gridColor} vertical={false} />
                <XAxis dataKey='epoch' tick={axisStyle} tickLine={false} axisLine={false} />
                <YAxis
                  tick={axisStyle}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => formatCompact(v)}
                  width={52}
                />
                <Tooltip content={<EpochTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey='payout' fill='#fbbf24' radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className='rounded-2xl border border-white/10 bg-black/50 p-4 sm:p-6 backdrop-blur-sm mb-10'>
          <div className='mb-4'>
            <h2 className='font-mono text-xs uppercase tracking-[0.2em] text-gray-400'>
              Weekly yield vs other Qubic projects
            </h2>
            <p className='mt-1 text-sm text-cyan-100/70 font-mono'>
              Average weekly dividend as % of share price
            </p>
          </div>
          <div className='h-80 sm:h-96'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart
                data={yieldChart}
                layout='vertical'
                margin={{ top: 4, right: 40, left: 8, bottom: 0 }}
              >
                <CartesianGrid stroke={gridColor} horizontal={false} />
                <XAxis
                  type='number'
                  tick={axisStyle}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <YAxis
                  type='category'
                  dataKey='name'
                  tick={{ ...axisStyle, fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  interval={0}
                />
                <Tooltip content={<YieldTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey='weekly' radius={[0, 3, 3, 0]}>
                  {yieldChart.map((row) => (
                    <Cell
                      key={row.name}
                      fill={row.isQtreat ? '#fbbf24' : 'rgba(34, 211, 238, 0.45)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className='rounded-2xl border border-white/10 bg-black/55 backdrop-blur-sm overflow-hidden mb-6'>
          <div className='overflow-x-auto'>
            <table className='w-full font-mono text-sm'>
              <thead>
                <tr className='border-b border-white/10 text-[10px] uppercase tracking-[0.18em] text-gray-500'>
                  <th className='px-4 py-3 text-left font-medium'>Rank</th>
                  <th className='px-4 py-3 text-left font-medium'>Project</th>
                  <th className='px-4 py-3 text-right font-medium'>Price (qu)</th>
                  <th className='px-4 py-3 text-right font-medium'>Avg / week</th>
                  <th className='px-4 py-3 text-right font-medium'>Total paid</th>
                  <th className='px-4 py-3 text-right font-medium'>Weekly yield</th>
                  <th className='px-4 py-3 text-right font-medium'>Annual yield</th>
                  <th className='px-4 py-3 text-right font-medium'>Payback</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((p, i) => {
                  const isQtreat = p.name === 'QTREAT';
                  return (
                    <tr
                      key={p.name}
                      className={cn(
                        'border-b border-white/5 transition-colors',
                        isQtreat
                          ? 'bg-amber-400/[0.07] hover:bg-amber-400/[0.1]'
                          : 'hover:bg-white/[0.03]'
                      )}
                    >
                      <td className='px-4 py-3 text-gray-500 tabular-nums'>
                        {isQtreat ? (
                          <span className='text-amber-300 font-bold'>#{i + 1}</span>
                        ) : (
                          `#${i + 1}`
                        )}
                      </td>
                      <td className='px-4 py-3'>
                        <span
                          className={cn(
                            'font-bold',
                            isQtreat ? 'text-amber-300' : 'text-gray-200'
                          )}
                        >
                          {p.name}
                        </span>
                        <span
                          className={cn(
                            'ml-2 rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-wider',
                            p.kind === 'token'
                              ? 'border-cyan-400/40 text-cyan-300 bg-cyan-400/10'
                              : 'border-purple-400/40 text-purple-300 bg-purple-400/10'
                          )}
                        >
                          {p.kind === 'token' ? 'Token' : `SC #${p.scIndex}`}
                        </span>
                      </td>
                      <td className='px-4 py-3 text-right tabular-nums text-gray-300'>
                        {formatCompact(p.price)}
                      </td>
                      <td className='px-4 py-3 text-right tabular-nums text-gray-300'>
                        {formatQu(p.avgWeekly)}
                      </td>
                      <td className='px-4 py-3 text-right tabular-nums text-white'>
                        {formatQu(p.totalDividends)}
                      </td>
                      <td
                        className={cn(
                          'px-4 py-3 text-right tabular-nums',
                          isQtreat ? 'text-amber-300 font-bold' : 'text-cyan-200/90'
                        )}
                      >
                        {p.weeklyYieldPct.toFixed(2)}%
                      </td>
                      <td
                        className={cn(
                          'px-4 py-3 text-right tabular-nums',
                          isQtreat ? 'text-amber-300 font-bold' : 'text-cyan-200/90'
                        )}
                      >
                        {p.annualYieldPct.toFixed(2)}%
                      </td>
                      <td className='px-4 py-3 text-right tabular-nums text-gray-300'>
                        {p.paybackWeeks != null ? `${Math.round(p.paybackWeeks)} wk` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className='px-4 py-3 font-mono text-[11px] text-gray-500 border-t border-white/10'>
            Per-share figures in qu · epochs {EPOCH_FROM}–{EPOCH_FROM + qtreat.epochs.length - 1}{' '}
            · prices are a QX snapshot, yields move with price
          </p>
        </div>

        <div className='rounded-2xl border border-white/10 bg-black/55 backdrop-blur-sm overflow-hidden mb-6'>
          <button
            onClick={() => setShowRaw((v) => !v)}
            className='flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 text-left'
          >
            <div>
              <h2 className='font-mono text-xs uppercase tracking-[0.2em] text-gray-400'>
                Raw per-epoch data
              </h2>
              <p className='mt-1 text-sm text-cyan-100/70 font-mono'>
                Every project, every epoch — the actual source behind the numbers above
              </p>
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-gray-400 shrink-0 transition-transform',
                showRaw ? 'rotate-180' : ''
              )}
            />
          </button>
          {showRaw ? (
            <div className='overflow-x-auto border-t border-white/10'>
              <table className='w-full font-mono text-xs'>
                <thead>
                  <tr className='border-b border-white/10 text-[9px] uppercase tracking-[0.12em] text-gray-500'>
                    <th className='sticky left-0 bg-black/95 px-4 py-2 text-left font-medium'>
                      Project
                    </th>
                    {ALL_EPOCHS_DESC.map((e) => (
                      <th key={e} className='px-3 py-2 text-right font-medium whitespace-nowrap'>
                        E{e}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DIVIDEND_PROJECTS.map((p) => {
                    const isQtreat = p.name === 'QTREAT';
                    const byEpoch = new Map(p.epochs.map((v, i) => [EPOCH_FROM + i, v]));
                    return (
                      <tr
                        key={p.name}
                        className={cn(
                          'border-b border-white/5',
                          isQtreat && 'bg-amber-400/[0.06]'
                        )}
                      >
                        <td
                          className={cn(
                            'sticky left-0 px-4 py-2 text-left whitespace-nowrap',
                            isQtreat ? 'bg-black/95 text-amber-300 font-bold' : 'bg-black/95 text-gray-300'
                          )}
                        >
                          {p.name}
                        </td>
                        {ALL_EPOCHS_DESC.map((e) => {
                          const v = byEpoch.get(e);
                          return (
                            <td
                              key={e}
                              className='px-3 py-2 text-right tabular-nums text-gray-400 whitespace-nowrap'
                            >
                              {v != null ? formatQu(v) : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
          <p className='px-4 py-3 font-mono text-[11px] text-gray-500 border-t border-white/10'>
            qu paid per share, per epoch · dashes mean no dividend paid that epoch ·{' '}
            <button onClick={exportCsv} className='underline hover:text-cyan-300'>
              download full CSV
            </button>
          </p>
        </div>

        {inactive.length ? (
          <div className='rounded-xl border border-white/10 bg-black/30 px-4 py-4 font-mono text-[11px] text-gray-500 leading-relaxed'>
            <span className='text-gray-400 uppercase tracking-wider mr-2'>
              No dividends paid yet:
            </span>
            {inactive.map((p) => p.name).join(' · ')}
          </div>
        ) : null}
      </div>
    </div>
  );
}
