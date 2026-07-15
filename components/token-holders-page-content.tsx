'use client';

import { MagicCard } from '@/components/ui/magic-card';
import { formatCompact } from '@/lib/mining/format';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Check,
  Coins,
  Copy,
  Database,
  Download,
  ExternalLink,
  Lock,
  Search,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

/* ---------------- TYPES ---------------- */

type TokenAsset = 'QDOGE' | 'QTREAT';

type HolderRow = {
  identity: string;
  balance: number;
  label?: string;
  isContract: boolean;
  isIssuer: boolean;
};

type HoldersPayload = {
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

const ASSETS: TokenAsset[] = ['QDOGE', 'QTREAT'];
const PAGE_SIZES = [50, 100, 200, 500, 'ALL'] as const;
const MAP_SIZES = [100, 200, 500, 'ALL'] as const;

/* ---------------- HELPERS ---------------- */

function formatUnits(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US');
}

function truncateId(identity: string): string {
  return `${identity.slice(0, 6)}...${identity.slice(-4)}`;
}

function explorerUrl(identity: string): string {
  return `https://explorer.qubic.org/network/address/${identity}`;
}

/** Rank-based cell tint: cyan for whales fading to deep purple for minnows. */
function cellTint(holder: HolderRow, t: number): { bg: string; border: string } {
  if (holder.isIssuer) {
    return { bg: 'hsl(40 60% 14%)', border: 'hsl(40 85% 45%)' };
  }
  if (holder.label?.includes('Locked')) {
    return { bg: 'hsl(150 45% 12%)', border: 'hsl(150 60% 38%)' };
  }
  const hue = 187 + (275 - 187) * t;
  return {
    bg: `hsl(${hue} 55% 13%)`,
    border: `hsl(${hue} 75% ${48 - 14 * t}%)`,
  };
}

/* ---------------- STAT CARD ---------------- */

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
  icon: typeof Users;
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

/* ---------------- TREEMAP ---------------- */

type TreemapCell = {
  x: number;
  y: number;
  w: number;
  h: number;
  holder: HolderRow;
  rank: number;
};

/** Squarified treemap layout (Bruls et al.) over a fixed-size canvas. */
function squarify(
  holders: HolderRow[],
  width: number,
  height: number
): TreemapCell[] {
  const total = holders.reduce((sum, h) => sum + h.balance, 0);
  if (total <= 0 || !holders.length) return [];
  const scale = (width * height) / total;
  const areas = holders.map((h) => h.balance * scale);

  const cells: TreemapCell[] = [];
  let x = 0;
  let y = 0;
  let w = width;
  let h = height;
  let index = 0;

  while (index < areas.length) {
    const row: number[] = [];
    let rowSum = 0;
    let worst = Infinity;
    const side = Math.min(w, h);

    for (let i = index; i < areas.length; i++) {
      const candidateSum = rowSum + areas[i];
      const candidate = [...row, areas[i]];
      const max = Math.max(...candidate);
      const min = Math.min(...candidate);
      const ratio = Math.max(
        (side * side * max) / (candidateSum * candidateSum),
        (candidateSum * candidateSum) / (side * side * min)
      );
      if (ratio > worst) break;
      row.push(areas[i]);
      rowSum = candidateSum;
      worst = ratio;
    }

    const along = rowSum / side;
    let offset = 0;
    for (let i = 0; i < row.length; i++) {
      const cellLength = row[i] / along;
      const holder = holders[index + i];
      if (w >= h) {
        cells.push({ x, y: y + offset, w: along, h: cellLength, holder, rank: index + i + 1 });
      } else {
        cells.push({ x: x + offset, y, w: cellLength, h: along, holder, rank: index + i + 1 });
      }
      offset += cellLength;
    }

    if (w >= h) {
      x += along;
      w -= along;
    } else {
      y += along;
      h -= along;
    }
    index += row.length;
  }

  return cells;
}

function DistributionTreemap({
  holders,
  supply,
  logoSrc,
}: {
  holders: HolderRow[];
  supply: number;
  logoSrc: string;
}) {
  const [mapSize, setMapSize] = useState<(typeof MAP_SIZES)[number]>(100);

  const shown = useMemo(
    () => (mapSize === 'ALL' ? holders : holders.slice(0, mapSize)),
    [holders, mapSize]
  );
  const cells = useMemo(() => squarify(shown, 1000, 420), [shown]);

  return (
    <div className='rounded-2xl border border-white/10 bg-black/55 p-4 sm:p-5 backdrop-blur-sm'>
      <div className='flex flex-wrap items-center justify-between gap-3 mb-4'>
        <h2 className='font-mono text-xs uppercase tracking-[0.25em] text-gray-400'>
          Distribution map
        </h2>
        <div className='flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-1'>
          {MAP_SIZES.map((size) => (
            <button
              key={String(size)}
              onClick={() => setMapSize(size)}
              className={cn(
                'rounded-md px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors',
                mapSize === size
                  ? 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/40'
                  : 'text-gray-500 hover:text-gray-300 border border-transparent'
              )}
            >
              {size === 'ALL' ? 'All' : `Top ${size}`}
            </button>
          ))}
        </div>
      </div>
      {cells.length ? (
        <svg
          viewBox='0 0 1000 420'
          className='w-full h-auto rounded-lg'
          role='img'
          aria-label='Holder distribution treemap'
        >
          {cells.map((cell) => {
            const pct = supply > 0 ? (cell.holder.balance / supply) * 100 : 0;
            const t = shown.length > 1 ? (cell.rank - 1) / (shown.length - 1) : 0;
            const tint = cellTint(cell.holder, t);
            const w = Math.max(cell.w - 1.5, 0.5);
            const h = Math.max(cell.h - 1.5, 0.5);
            const showText = w > 88 && h > 46;
            // Logo scales with the cell so area still reads as share size.
            const textPad = showText ? 30 : 0;
            const logoSize = Math.max(Math.min(w, h - textPad) * 0.78, 4);
            const logoX = cell.x + (w - logoSize) / 2;
            const logoY = cell.y + textPad + (h - textPad - logoSize) / 2;
            return (
              <g key={cell.holder.identity} className='transition-opacity hover:opacity-70'>
                <rect
                  x={cell.x}
                  y={cell.y}
                  width={w}
                  height={h}
                  rx={3}
                  fill={tint.bg}
                  stroke={tint.border}
                  strokeWidth={1}
                />
                <image
                  href={logoSrc}
                  x={logoX}
                  y={logoY}
                  width={logoSize}
                  height={logoSize}
                  pointerEvents='none'
                />
                {showText ? (
                  <>
                    <text
                      x={cell.x + 8}
                      y={cell.y + 17}
                      fill='rgba(255,255,255,0.92)'
                      fontSize='12'
                      fontFamily='monospace'
                      fontWeight='bold'
                      pointerEvents='none'
                    >
                      {cell.holder.label ?? truncateId(cell.holder.identity)}
                    </text>
                    <text
                      x={cell.x + 8}
                      y={cell.y + 32}
                      fill='rgba(255,255,255,0.6)'
                      fontSize='11'
                      fontFamily='monospace'
                      pointerEvents='none'
                    >
                      {pct.toFixed(2)}%
                    </text>
                  </>
                ) : null}
                <rect
                  x={cell.x}
                  y={cell.y}
                  width={w}
                  height={h}
                  fill='transparent'
                >
                  <title>
                    {`#${cell.rank} ${cell.holder.label ?? cell.holder.identity}\n${formatUnits(cell.holder.balance)} (${pct.toFixed(2)}%)`}
                  </title>
                </rect>
              </g>
            );
          })}
        </svg>
      ) : (
        <div className='h-48 flex items-center justify-center font-mono text-xs text-gray-500'>
          No holder data
        </div>
      )}
      <div className='mt-3 flex flex-wrap gap-4 font-mono text-[10px] text-gray-500'>
        <span className='flex items-center gap-1.5'>
          <span className='h-2.5 w-2.5 rounded-sm border border-[hsl(150_60%_38%)] bg-[hsl(150_45%_12%)]' />{' '}
          Locked (MsVault)
        </span>
        <span className='flex items-center gap-1.5'>
          <span className='h-2.5 w-2.5 rounded-sm border border-[hsl(40_85%_45%)] bg-[hsl(40_60%_14%)]' />{' '}
          Issuer
        </span>
        <span className='flex items-center gap-1.5'>
          <span className='h-2.5 w-2.5 rounded-sm bg-linear-to-r from-cyan-400 to-purple-500' />{' '}
          Holders (by rank) · logo scales with share
        </span>
      </div>
    </div>
  );
}

/* ---------------- HOLDER ROW ---------------- */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className='text-gray-600 hover:text-cyan-400 transition-colors'
      title='Copy address'
      aria-label='Copy address'
    >
      {copied ? <Check className='h-3.5 w-3.5 text-green-400' /> : <Copy className='h-3.5 w-3.5' />}
    </button>
  );
}

/* ---------------- MAIN ---------------- */

export function TokenHoldersPageContent() {
  const [asset, setAsset] = useState<TokenAsset>('QDOGE');
  const [data, setData] = useState<Partial<Record<TokenAsset, HoldersPayload>>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(50);
  const [whalesOnly, setWhalesOnly] = useState(false);

  const logoSrc = asset === 'QTREAT' ? '/qtreat-logo.png' : '/qdoge-logo.png';

  const load = useCallback(async (target: TokenAsset) => {
    setLoadError(null);
    try {
      const res = await fetch(`/api/tokens/holders?asset=${target}`);
      if (!res.ok) {
        setLoadError(`holders ${res.status}`);
        return;
      }
      const payload = (await res.json()) as HoldersPayload;
      setData((prev) => ({ ...prev, [target]: payload }));
      setUpdatedAt(new Date());
    } catch {
      setLoadError('Network error loading holder data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void load(asset);
    const id = setInterval(() => void load(asset), 120_000);
    return () => clearInterval(id);
  }, [asset, load]);

  const current = data[asset];
  const holders = useMemo(() => current?.holders ?? [], [current]);
  const supply = current?.onchainSupply ?? 0;

  const filtered = useMemo(() => {
    let rows = holders.map((holder, i) => ({ holder, rank: i + 1 }));
    const query = search.trim().toUpperCase();
    if (query) {
      rows = rows.filter(
        ({ holder }) =>
          holder.identity.includes(query) ||
          holder.label?.toUpperCase().includes(query)
      );
    }
    if (whalesOnly && supply > 0) {
      rows = rows.filter(({ holder }) => holder.balance / supply > 0.01);
    }
    return rows;
  }, [holders, search, whalesOnly, supply]);

  const visible = useMemo(
    () => (pageSize === 'ALL' ? filtered : filtered.slice(0, pageSize)),
    [filtered, pageSize]
  );

  const exportCsv = useCallback(() => {
    if (!holders.length) return;
    const lines = ['rank,identity,balance,percent_supply,label'];
    holders.forEach((holder, i) => {
      const pct = supply > 0 ? ((holder.balance / supply) * 100).toFixed(4) : '0';
      lines.push(
        `${i + 1},${holder.identity},${holder.balance},${pct},"${holder.label ?? ''}"`
      );
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${asset.toLowerCase()}-holders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [holders, supply, asset]);

  const circulatingPct =
    current && current.onchainSupply > 0
      ? ((current.circulating / current.onchainSupply) * 100).toFixed(1)
      : null;

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

        {/* Title + tabs */}
        <div className='flex flex-wrap items-end justify-between gap-6 mb-10'>
          <div className='max-w-2xl'>
            <p className='inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-black/70 px-4 py-1 text-[11px] tracking-[0.28em] uppercase text-cyan-300 font-mono mb-5'>
              <span className='h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse' />
              On-chain data
            </p>
            <h1 className='text-4xl sm:text-5xl md:text-6xl font-bold font-mono text-white tracking-tight mb-3'>
              Token{' '}
              <span className='bg-linear-to-r from-cyan-400 via-purple-400 to-amber-300 bg-clip-text text-transparent'>
                Holders
              </span>
            </h1>
            <p className='text-gray-400 text-sm font-mono'>
              Distribution of {asset} across the Qubic network.
            </p>
            {updatedAt ? (
              <p className='mt-3 text-[11px] font-mono text-gray-500'>
                Last refresh: {updatedAt.toLocaleTimeString()}
                {current?.tick != null ? ` · Tick ${formatUnits(current.tick)}` : ''}
                {loadError ? (
                  <span className='text-amber-400 ml-2'>({loadError})</span>
                ) : null}
              </p>
            ) : null}
          </div>

          <div className='flex flex-wrap items-center gap-3'>
            <div className='flex items-center gap-1 rounded-xl border border-white/10 bg-black/55 p-1'>
              {ASSETS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAsset(a)}
                  className={cn(
                    'rounded-lg px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors',
                    asset === a
                      ? 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/40'
                      : 'text-gray-500 hover:text-gray-300 border border-transparent'
                  )}
                >
                  {a} Holders
                </button>
              ))}
            </div>
            <button
              onClick={exportCsv}
              disabled={!holders.length}
              className='inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/55 px-4 py-2 font-mono text-xs uppercase tracking-wider text-gray-300 hover:text-cyan-300 hover:border-cyan-400/40 transition-colors disabled:opacity-40'
            >
              <Download className='h-3.5 w-3.5' />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-10'>
          <StatCard
            label='Total holders'
            value={current ? formatUnits(current.totalHolders) : '—'}
            sub='Addresses with balance'
            icon={Users}
            gradientFrom='rgba(0, 243, 255, 0.22)'
          />
          <StatCard
            label='Circulating'
            value={current ? formatUnits(current.circulating) : '—'}
            sub={circulatingPct ? `${circulatingPct}% of supply` : undefined}
            icon={Coins}
            gradientFrom='rgba(168, 85, 247, 0.24)'
          />
          <StatCard
            label='Locked / Reserve'
            value={current ? formatUnits(current.locked) : '—'}
            sub='MsVault + issuer'
            icon={Lock}
            gradientFrom='rgba(34, 197, 94, 0.2)'
          />
          <StatCard
            label='Total supply'
            value={current ? formatUnits(current.onchainSupply) : '—'}
            sub={
              current?.maxSupply
                ? `${formatCompact(current.maxSupply)} issued`
                : 'On-chain supply'
            }
            icon={Database}
            gradientFrom='rgba(251, 191, 36, 0.22)'
          />
        </div>

        {/* Treemap */}
        <div className='mb-10'>
          <DistributionTreemap holders={holders} supply={supply} logoSrc={logoSrc} />
        </div>

        {/* Controls */}
        <div className='mb-4 rounded-2xl border border-white/10 bg-black/55 p-3 sm:p-4 backdrop-blur-sm'>
          <div className='flex flex-wrap items-center gap-3'>
            <div className='relative flex-1 min-w-[220px]'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500' />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Search address...'
                className='w-full rounded-xl border border-white/10 bg-black/40 py-2 pl-10 pr-3 font-mono text-sm text-gray-200 placeholder:text-gray-600 focus:border-cyan-400/50 focus:outline-none'
              />
            </div>
            <div className='flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-1'>
              {PAGE_SIZES.map((size) => (
                <button
                  key={String(size)}
                  onClick={() => setPageSize(size)}
                  className={cn(
                    'rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors',
                    pageSize === size
                      ? 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/40'
                      : 'text-gray-500 hover:text-gray-300 border border-transparent'
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
            <div className='flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-1 ml-auto'>
              <button
                onClick={() => setWhalesOnly(false)}
                className={cn(
                  'rounded-md px-3 py-1 font-mono text-[11px] transition-colors',
                  !whalesOnly
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-gray-500 hover:text-gray-300 border border-transparent'
                )}
              >
                All
              </button>
              <button
                onClick={() => setWhalesOnly(true)}
                className={cn(
                  'rounded-md px-3 py-1 font-mono text-[11px] transition-colors',
                  whalesOnly
                    ? 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/40'
                    : 'text-gray-500 hover:text-gray-300 border border-transparent'
                )}
              >
                Whales (&gt;1%)
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className='rounded-2xl border border-white/10 bg-black/55 backdrop-blur-sm overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full font-mono text-sm'>
              <thead>
                <tr className='border-b border-white/10 text-[10px] uppercase tracking-[0.18em] text-gray-500'>
                  <th className='px-4 py-3 text-left font-medium'>Rank</th>
                  <th className='px-4 py-3 text-left font-medium'>Holder</th>
                  <th className='px-4 py-3 text-right font-medium'>{asset}</th>
                  <th className='px-4 py-3 text-right font-medium'>% Supply</th>
                </tr>
              </thead>
              <tbody>
                {loading && !current ? (
                  <tr>
                    <td colSpan={4} className='px-4 py-10 text-center text-gray-500 text-xs'>
                      Loading on-chain holder data...
                    </td>
                  </tr>
                ) : visible.length === 0 ? (
                  <tr>
                    <td colSpan={4} className='px-4 py-10 text-center text-gray-500 text-xs'>
                      No holders match your filters.
                    </td>
                  </tr>
                ) : (
                  visible.map(({ holder, rank }) => {
                    const pct = supply > 0 ? (holder.balance / supply) * 100 : 0;
                    return (
                      <tr
                        key={holder.identity}
                        className='border-b border-white/5 hover:bg-white/[0.03] transition-colors'
                      >
                        <td className='px-4 py-3 text-gray-500 tabular-nums'>#{rank}</td>
                        <td className='px-4 py-3'>
                          <div className='flex items-center gap-2'>
                            <a
                              href={explorerUrl(holder.identity)}
                              target='_blank'
                              rel='noreferrer'
                              title={holder.identity}
                              className={cn(
                                'hover:underline inline-flex items-center gap-1.5',
                                holder.isIssuer
                                  ? 'text-amber-300'
                                  : holder.label?.includes('Locked')
                                    ? 'text-green-300'
                                    : holder.isContract
                                      ? 'text-purple-300'
                                      : 'text-gray-200'
                              )}
                            >
                              {truncateId(holder.identity)}
                              <ExternalLink className='h-3 w-3 opacity-50' />
                            </a>
                            {holder.label ? (
                              <span
                                className={cn(
                                  'rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-wider',
                                  holder.isIssuer
                                    ? 'border-amber-400/40 text-amber-300 bg-amber-400/10'
                                    : holder.label.includes('Locked')
                                      ? 'border-green-400/40 text-green-300 bg-green-400/10'
                                      : 'border-purple-400/40 text-purple-300 bg-purple-400/10'
                                )}
                              >
                                {holder.label}
                              </span>
                            ) : null}
                            <CopyButton text={holder.identity} />
                          </div>
                        </td>
                        <td className='px-4 py-3 text-right tabular-nums text-white'>
                          {formatUnits(holder.balance)}
                        </td>
                        <td className='px-4 py-3'>
                          <div className='flex items-center justify-end gap-2'>
                            <div className='h-1.5 w-16 rounded-full bg-gray-800 overflow-hidden'>
                              <div
                                className='h-full rounded-full bg-linear-to-r from-cyan-400 to-purple-500'
                                style={{ width: `${Math.min(Math.max(pct, 1), 100)}%` }}
                              />
                            </div>
                            <span className='tabular-nums text-cyan-200/90 w-16 text-right'>
                              {pct.toFixed(2)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {current ? (
            <p className='px-4 py-3 font-mono text-[11px] text-gray-500 border-t border-white/10'>
              Showing {visible.length} of {current.totalHolders} holders
              {search || whalesOnly ? ' (filtered)' : ''} · Data from rpc.qubic.org
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
