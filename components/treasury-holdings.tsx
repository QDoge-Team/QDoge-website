'use client';

import type { TreasuryAssetRow, TreasuryPayload } from '@/app/api/treasury/route';
import { formatCompact } from '@/lib/mining/format';
import { cn } from '@/lib/utils';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const COLLAPSED_ROWS = 10;

const KIND_LABEL: Record<TreasuryAssetRow['kind'], string> = {
  'sc-share': 'SC share',
  token: 'Token',
  qu: 'Cash',
};

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function formatAmount(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

function PriceCell({ asset }: { asset: TreasuryAssetRow }) {
  if (asset.kind === 'qu') return <span className='text-muted-text'>—</span>;
  if (asset.price == null) {
    return <span className='text-muted-text'>No recent trades</span>;
  }
  return (
    <div>
      <span title={`${asset.price.toLocaleString('en-US', { maximumFractionDigits: 2 })} qu`}>
        {formatCompact(asset.price)}
      </span>
      <p
        className={cn(
          'text-[10px] leading-tight',
          asset.priceBasis === 'last-trade' ? 'text-amber-600 dark:text-amber-400' : 'text-muted-text'
        )}
      >
        {asset.priceBasis === 'last-trade'
          ? `last trade ${formatDate(asset.lastTradeDate)}`
          : `7d avg · ${asset.trades7d} trade${asset.trades7d === 1 ? '' : 's'}`}
      </p>
    </div>
  );
}

export function TreasuryHoldings() {
  const [data, setData] = useState<TreasuryPayload | null>(null);
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await fetch('/api/treasury');
      const json = (await res.json()) as TreasuryPayload;
      if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load treasury holdings');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = data ? (showAll ? data.assets : data.assets.slice(0, COLLAPSED_ROWS)) : [];

  return (
    <div className='rounded-2xl border border-border bg-surface/55 backdrop-blur-sm overflow-hidden mb-10'>
      <div className='flex flex-col gap-3 p-4 sm:p-6 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h2 className='font-mono text-xs uppercase tracking-[0.2em] text-muted-text'>Treasury holdings</h2>
          <p className='mt-1 text-sm text-muted-text font-mono'>
            What the treasury wallet holds, valued at recent QX trade prices
          </p>
        </div>
        {data ? (
          <div className='sm:text-right'>
            <p className='font-mono text-[10px] uppercase tracking-[0.18em] text-muted-text'>Est. total value</p>
            <p
              className='font-mono text-2xl font-bold text-cyan-600 dark:text-cyan-300 tabular-nums'
              title={`${formatAmount(data.totalValue)} qu`}
            >
              ≈ {formatCompact(data.totalValue)} qu
            </p>
            {data.staleValue > 0 ? (
              <p className='font-mono text-[10px] text-amber-600 dark:text-amber-400'>
                {formatCompact(data.staleValue)} priced from older trades
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {!data && !error ? (
        <div className='flex items-center justify-center gap-2 border-t border-border py-10 font-mono text-sm text-muted-text'>
          <Loader2 className='h-4 w-4 animate-spin' /> Loading holdings…
        </div>
      ) : null}

      {error ? (
        <div className='border-t border-border px-4 py-6 font-mono text-sm text-muted-text sm:px-6'>
          Couldn&apos;t load holdings ({error}).{' '}
          <button onClick={() => void load()} className='font-bold text-cyan-600 hover:underline dark:text-cyan-300'>
            Retry
          </button>
        </div>
      ) : null}

      {data ? (
        <>
          <div className='overflow-x-auto border-t border-border'>
            <table className='w-full font-mono text-sm'>
              <thead>
                <tr className='border-b border-border text-[10px] uppercase tracking-[0.18em] text-muted-text'>
                  <th className='px-4 py-3 text-left font-medium'>Asset</th>
                  <th className='px-4 py-3 text-left font-medium'>Type</th>
                  <th className='px-4 py-3 text-right font-medium'>Amount</th>
                  <th className='px-4 py-3 text-right font-medium'>Price (qu)</th>
                  <th className='px-4 py-3 text-right font-medium'>Est. value (qu)</th>
                  <th className='px-4 py-3 text-right font-medium'>Share</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr
                    key={`${a.issuer}:${a.name}`}
                    className='border-b border-border/50 transition-colors hover:bg-surface-foreground/[0.03]'
                  >
                    <td className='px-4 py-3 font-bold text-surface-foreground'>{a.name}</td>
                    <td className='px-4 py-3 text-muted-text'>{KIND_LABEL[a.kind]}</td>
                    <td className='px-4 py-3 text-right tabular-nums text-surface-foreground'>
                      {formatAmount(a.amount)}
                    </td>
                    <td className='px-4 py-3 text-right tabular-nums text-surface-foreground'>
                      <PriceCell asset={a} />
                    </td>
                    <td
                      className='px-4 py-3 text-right tabular-nums text-surface-foreground'
                      title={a.value != null ? `${formatAmount(a.value)} qu` : undefined}
                    >
                      {a.value != null ? formatCompact(a.value) : '—'}
                    </td>
                    <td className='px-4 py-3 text-right tabular-nums text-muted-text'>
                      {a.value != null && data.totalValue > 0
                        ? `${((a.value / data.totalValue) * 100).toFixed(1)}%`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className='flex flex-col gap-2 border-t border-border px-4 py-3 font-mono text-[11px] leading-relaxed text-muted-text sm:flex-row sm:items-center sm:justify-between sm:px-6'>
            <div>
              {data.assets.length > COLLAPSED_ROWS ? (
                <button
                  onClick={() => setShowAll((v) => !v)}
                  className='mb-2 block font-bold text-cyan-600 hover:underline dark:text-cyan-300'
                >
                  {showAll ? 'Show fewer' : `Show all ${data.assets.length} holdings`}
                </button>
              ) : null}
              Estimates use the 7-day volume-weighted average of QX trades; assets with no trade that week fall back to
              their last trade (flagged in amber). Thin markets can move sharply, so treat this as an estimate, not a
              sale price.
            </div>
            <a
              href={`https://explorer.qubic.org/network/address/${data.wallet}`}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex shrink-0 items-center gap-1 font-bold text-cyan-600 hover:underline dark:text-cyan-300'
            >
              View wallet <ExternalLink className='h-3 w-3' />
            </a>
          </div>
        </>
      ) : null}
    </div>
  );
}
