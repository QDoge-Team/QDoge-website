'use client';

import { MagicCard } from '@/components/ui/magic-card';
import { ConnectWalletButton } from '@/components/connect/ConnectWalletButton';
import { useQubicConnect } from '@/components/connect/QubicConnectContext';
import {
  QTREAT_MIN_STAKE,
  QTREAT_QX_TRANSFER_FEE,
  QTREAT_STAKE_ASSET,
  QTREAT_BONUS_ASSET,
  QTREAT_UNSTAKE_DELAY_EPOCHS,
  QX_CONTRACT_INDEX,
  buildClaimBonusTx,
  buildFinalizeUnstakeTx,
  buildRequestUnstakeTx,
  buildStakeTx,
  getFundsInfo,
  getPhaseInfo,
  getStakingInfo,
  type FundsInfo,
  type PhaseInfo,
  type StakingInfo,
} from '@/lib/qubic/qtreat-contract';
import { broadcastTx, fetchAssetBalance, fetchTickInfo, fetchTxStatus, type TickInfo } from '@/lib/qubic/rpc';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Coins,
  Gift,
  Loader2,
  Lock,
  PiggyBank,
  Timer,
  Unlock,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

function formatQu(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return Math.round(n).toLocaleString('en-US');
}

/** Comma-formats a raw digit string for display (e.g. "10000000" -> "10,000,000"). */
function formatAmountInput(value: string): string {
  if (!value) return '';
  return Number(value).toLocaleString('en-US');
}

/** Strips everything but digits, so pasted/typed commas don't end up in state. */
function parseAmountInput(value: string): string {
  return value.replace(/\D/g, '');
}

const TICK_OFFSET = 15;

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  gradientFrom,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof Coins;
  gradientFrom: string;
}) {
  return (
    <div className="flex h-full min-h-[110px] flex-col rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_24px_rgba(0,243,255,0.06)]">
      <MagicCard
        className="h-full min-h-[110px] flex-1 flex flex-col rounded-2xl p-5"
        gradientFrom={gradientFrom}
        gradientTo="rgba(10, 10, 10, 0.95)"
        gradientColor="rgba(0, 243, 255, 0.12)"
        gradientOpacity={0.3}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[10px] uppercase tracking-[0.18em] text-gray-400 font-mono">{label}</span>
          <Icon className="h-4 w-4 text-cyan-400/85 shrink-0" />
        </div>
        <p className="text-xl font-bold tabular-nums text-white font-mono leading-tight">{value}</p>
        {sub ? <p className="text-[11px] text-gray-400 font-mono mt-2 leading-snug">{sub}</p> : null}
      </MagicCard>
    </div>
  );
}

type ActionState = { status: 'idle' | 'signing' | 'broadcasting' | 'confirming' | 'ok' | 'error'; message?: string };

async function pollTxStatus(txId: string, onDone: (ok: boolean) => void) {
  const start = Date.now();
  const timeoutMs = 45_000;
  const tick = async () => {
    const status = await fetchTxStatus(txId);
    if (status?.moneyFlew) return onDone(true);
    if (Date.now() - start > timeoutMs) return onDone(false);
    setTimeout(tick, 3000);
  };
  void tick();
}

export function StakingPageContent() {
  const { connected, wallet, getSignedTx } = useQubicConnect();

  const [phase, setPhase] = useState<PhaseInfo | null>(null);
  const [funds, setFunds] = useState<FundsInfo | null>(null);
  const [staking, setStaking] = useState<StakingInfo | null>(null);
  const [qdogeBalance, setQdogeBalance] = useState<number | null>(null);
  const [qxManagedQdoge, setQxManagedQdoge] = useState<number | null>(null);
  const [qtreatBalance, setQtreatBalance] = useState<number | null>(null);
  const [tick, setTick] = useState<TickInfo | null>(null);
  const [hasCheckedActivation, setHasCheckedActivation] = useState(false);

  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [action, setAction] = useState<ActionState>({ status: 'idle' });

  const loadContractInfo = useCallback(async () => {
    try {
      const [p, f, t] = await Promise.all([getPhaseInfo(), getFundsInfo(), fetchTickInfo()]);
      setPhase(p);
      setFunds(f);
      setTick(t);
    } catch (err) {
      // Leave phase/funds as-is (don't clobber a previous good read with a
      // transient blip) -- the retry banner below covers the first-load case.
      console.error('Failed to load QTREAT contract info:', err);
    } finally {
      setHasCheckedActivation(true);
    }
  }, []);

  const loadWalletInfo = useCallback(async () => {
    if (!wallet) {
      setStaking(null);
      setQdogeBalance(null);
      setQxManagedQdoge(null);
      setQtreatBalance(null);
      return;
    }
    const [info, qdoge, qxManaged, qtreat] = await Promise.all([
      getStakingInfo(wallet.publicKey),
      fetchAssetBalance(wallet.publicKey, QTREAT_STAKE_ASSET.name),
      // Only QDOGE currently under QX's own management is eligible to stake --
      // QX's TransferShareManagementRights silently no-ops (transfers 0, no
      // error) for any amount beyond that, even though the tx still confirms.
      fetchAssetBalance(wallet.publicKey, QTREAT_STAKE_ASSET.name, QX_CONTRACT_INDEX),
      fetchAssetBalance(wallet.publicKey, QTREAT_BONUS_ASSET.name),
    ]);
    setStaking(info);
    setQdogeBalance(qdoge);
    setQxManagedQdoge(qxManaged);
    setQtreatBalance(qtreat);
  }, [wallet]);

  useEffect(() => {
    void loadContractInfo();
    const id = setInterval(() => void loadContractInfo(), 60_000);
    return () => clearInterval(id);
  }, [loadContractInfo]);

  useEffect(() => {
    void loadWalletInfo();
    const id = setInterval(() => void loadWalletInfo(), 30_000);
    return () => clearInterval(id);
  }, [loadWalletInfo]);

  const submit = useCallback(
    async (
      label: string,
      build: (sourceId: string, targetTick: number) => Promise<Parameters<typeof getSignedTx>[0]>,
      // Runs after the tx confirms, to check the state actually changed as
      // expected -- QX's share-management transfer silently no-ops (no
      // error, no revert) when the requested amount exceeds what it
      // currently manages, so a confirmed tx is NOT proof the action worked.
      verify?: () => Promise<{ ok: boolean; message: string }>
    ) => {
      if (!wallet) return;
      setAction({ status: 'signing', message: `Sign the ${label} transaction in your wallet…` });
      try {
        const t = await fetchTickInfo();
        const targetTick = t.tick + TICK_OFFSET;
        const tx = await build(wallet.publicKey, targetTick);
        const { tx: signed } = await getSignedTx(tx);
        setAction({ status: 'broadcasting', message: 'Broadcasting transaction…' });
        const result = await broadcastTx(signed);
        if (!result.transactionId) throw new Error('Broadcast did not return a transaction ID');
        setAction({ status: 'confirming', message: `Waiting for tick ${targetTick} to confirm…` });
        pollTxStatus(result.transactionId, async (ok) => {
          if (!ok) {
            setAction({ status: 'error', message: `${label} did not confirm in time. Check the explorer before retrying.` });
          } else if (verify) {
            const verification = await verify();
            setAction(
              verification.ok
                ? { status: 'ok', message: `${label} confirmed.` }
                : { status: 'error', message: verification.message }
            );
          } else {
            setAction({ status: 'ok', message: `${label} confirmed.` });
          }
          void loadWalletInfo();
          void loadContractInfo();
        });
      } catch (err) {
        setAction({ status: 'error', message: err instanceof Error ? err.message : String(err) });
      }
    },
    [wallet, getSignedTx, loadWalletInfo, loadContractInfo]
  );

  // Mirrors FinalizeUnstake's own guard (qpi.epoch() < unstakeEpoch + QTREAT_UNSTAKE_DELAY_EPOCHS -> revert).
  const canFinalize =
    !!staking &&
    staking.unstakeAmount > 0 &&
    tick != null &&
    tick.epoch >= staking.unstakeEpoch + QTREAT_UNSTAKE_DELAY_EPOCHS;

  const busy = action.status === 'signing' || action.status === 'broadcasting' || action.status === 'confirming';
  // The contract is in its IPO phase until it activates -- until then every
  // querySmartContract read comes back empty, not with real zeros.
  const isLive = phase !== null || funds !== null;

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-black to-gray-900 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(0,243,255,0.12),transparent_55%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(188,19,254,0.12),transparent_55%)] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 md:pt-32 md:pb-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors font-mono uppercase tracking-wider mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-black/70 px-4 py-1 text-[11px] tracking-[0.28em] uppercase text-cyan-300 font-mono mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              QTREAT Smart Contract
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-mono text-white tracking-tight mb-3">
              QDOGE{' '}
              <span className="bg-linear-to-r from-cyan-400 via-purple-400 to-amber-300 bg-clip-text text-transparent">
                Staking
              </span>
            </h1>
            <p className="text-gray-400 text-sm font-mono">
              Stake QDOGE into the QTREAT contract to earn QTREAT bonus rewards. Minimum stake{' '}
              {formatQu(QTREAT_MIN_STAKE)} QDOGE.
            </p>
          </div>
          <ConnectWalletButton />
        </div>

        {hasCheckedActivation && !isLive ? (
          <div className="mb-10 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5 sm:p-6 backdrop-blur-sm flex items-start gap-3">
            <Timer className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-mono text-sm font-bold text-amber-300">Couldn&apos;t load contract data</p>
              <p className="font-mono text-xs text-amber-200/80 mt-1 leading-relaxed">
                The QTREAT contract didn&apos;t respond just now — this page keeps retrying automatically every
                minute. Stats below will stay blank and actions disabled until it comes back.
              </p>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-10">
          <StatCard
            label="Total Staked"
            value={staking ? `${formatQu(staking.totalStaked)}` : '—'}
            sub="QDOGE, network-wide"
            icon={Lock}
            gradientFrom="rgba(0, 243, 255, 0.22)"
          />
          <StatCard
            label="Staking Fund"
            value={funds ? `${formatQu(funds.stakingFund)}` : '—'}
            sub="qu reserved for stakers"
            icon={PiggyBank}
            gradientFrom="rgba(34, 197, 94, 0.2)"
          />
          <StatCard
            label="QTREAT Bonus Pool"
            value={funds ? `${formatQu(funds.qtreatBonusPool)}` : '—'}
            sub="Available to claim"
            icon={Gift}
            gradientFrom="rgba(168, 85, 247, 0.24)"
          />
          <StatCard
            label="Phase"
            value={phase ? `Phase ${phase.currentPhase}` : '—'}
            sub={phase ? `${formatQu(phase.epochsRemaining)} epochs remaining` : undefined}
            icon={Timer}
            gradientFrom="rgba(251, 191, 36, 0.22)"
          />
        </div>

        {!connected ? (
          <div className="rounded-2xl border border-white/10 bg-black/50 p-8 text-center backdrop-blur-sm mb-10">
            <p className="font-mono text-sm text-gray-400">
              Connect your wallet to stake QDOGE, request an unstake, or claim your QTREAT bonus.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* Your position */}
            <div className="rounded-2xl border border-cyan-400/20 bg-black/50 p-5 sm:p-6 backdrop-blur-sm">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-gray-400 mb-4">Your Position</h2>
              <div className="space-y-3 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Wallet QDOGE</span>
                  <span className="text-white">{formatQu(qdogeBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Available to stake</span>
                  <span className={cn(
                    qxManagedQdoge != null && qdogeBalance != null && qxManagedQdoge < qdogeBalance
                      ? 'text-amber-300'
                      : 'text-white'
                  )}>
                    {formatQu(qxManagedQdoge)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Wallet QTREAT</span>
                  <span className="text-white">{formatQu(qtreatBalance)}</span>
                </div>
                <div className="h-px bg-white/10 my-2" />
                <div className="flex justify-between">
                  <span className="text-gray-500">Staked</span>
                  <span className="text-cyan-300 font-bold">{formatQu(staking?.staked)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Pending unstake</span>
                  <span className="text-amber-300">{formatQu(staking?.unstakeAmount)}</span>
                </div>
                {staking && staking.unstakeAmount > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Unstake requested at epoch</span>
                    <span className="text-gray-300">
                      {staking.unstakeEpoch}{' '}
                      {canFinalize ? (
                        <span className="text-green-400">(ready to finalize)</span>
                      ) : (
                        <span>(unlocks epoch {staking.unstakeEpoch + QTREAT_UNSTAKE_DELAY_EPOCHS})</span>
                      )}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <span className="text-gray-500">Pending QTREAT bonus</span>
                  <span className="text-purple-300 font-bold">{formatQu(staking?.pendingBonus)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Growth streak</span>
                  <span className="text-gray-300">{formatQu(staking?.growthStreak)} epochs</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="rounded-2xl border border-white/10 bg-black/50 p-5 sm:p-6 backdrop-blur-sm">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-gray-400 mb-4">Actions</h2>
              <div className="space-y-5">
                <div>
                  <label className="text-[11px] text-gray-500 font-mono uppercase tracking-wider">
                    Stake QDOGE
                  </label>
                  <div className="mt-1.5 flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatAmountInput(stakeAmount)}
                      onChange={(e) => setStakeAmount(parseAmountInput(e.target.value))}
                      placeholder={formatQu(QTREAT_MIN_STAKE)}
                      className="flex-1 rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white font-mono outline-none focus:border-cyan-400/50"
                    />
                    <button
                      disabled={
                        busy ||
                        !isLive ||
                        !stakeAmount ||
                        Number(stakeAmount) < QTREAT_MIN_STAKE ||
                        (qxManagedQdoge != null && Number(stakeAmount) > qxManagedQdoge)
                      }
                      onClick={() => {
                        const amount = Number(stakeAmount);
                        const baselineStaked = staking?.staked ?? 0;
                        void submit(
                          'Stake',
                          (sourceId, targetTick) => buildStakeTx({ sourceId, amount, tick: targetTick }),
                          async () => {
                            const fresh = await getStakingInfo(wallet!.publicKey);
                            const gained = (fresh?.staked ?? 0) - baselineStaked;
                            if (gained >= amount) return { ok: true, message: '' };
                            return {
                              ok: false,
                              message:
                                gained > 0
                                  ? `Only ${formatQu(gained)} of the ${formatQu(amount)} QDOGE actually staked -- the rest wasn't managed by QX at the time. Staked balance updated; try staking the remainder after moving it under QX.`
                                  : `Transaction confirmed, but nothing was staked -- that QDOGE wasn't managed by QX at the time (see "Available to stake" above). No funds moved; safe to retry with a lower amount.`,
                            };
                          }
                        );
                      }}
                      className="rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-cyan-300 hover:bg-cyan-400/20 disabled:opacity-40 font-mono"
                    >
                      Stake
                    </button>
                  </div>
                  {qxManagedQdoge != null && qdogeBalance != null && qxManagedQdoge < qdogeBalance ? (
                    <p className="mt-1.5 text-[11px] text-amber-400/80 font-mono leading-snug">
                      Only {formatQu(qxManagedQdoge)} of your {formatQu(qdogeBalance)} QDOGE is currently managed by
                      QX and eligible to stake -- the rest is managed elsewhere (e.g. another contract or listing)
                      and needs to move back under QX first.
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="text-[11px] text-gray-500 font-mono uppercase tracking-wider">
                    Request Unstake ({QTREAT_QX_TRANSFER_FEE} qu fee)
                  </label>
                  <div className="mt-1.5 flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatAmountInput(unstakeAmount)}
                      onChange={(e) => setUnstakeAmount(parseAmountInput(e.target.value))}
                      placeholder="Amount to unstake"
                      className="flex-1 rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white font-mono outline-none focus:border-amber-400/50"
                    />
                    <button
                      disabled={busy || !isLive || !unstakeAmount || !staking || staking.staked === 0}
                      onClick={() =>
                        submit('Request Unstake', (sourceId, targetTick) =>
                          buildRequestUnstakeTx({ sourceId, amount: Number(unstakeAmount), tick: targetTick })
                        )
                      }
                      className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-300 hover:bg-amber-400/20 disabled:opacity-40 font-mono"
                    >
                      Request
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    disabled={busy || !isLive || !canFinalize}
                    onClick={() => submit('Finalize Unstake', (sourceId, targetTick) => buildFinalizeUnstakeTx({ sourceId, tick: targetTick }))}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-green-400/40 bg-green-400/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-green-300 hover:bg-green-400/20 disabled:opacity-40 font-mono"
                  >
                    <Unlock className="h-3.5 w-3.5" />
                    Finalize Unstake
                  </button>
                  <button
                    disabled={busy || !isLive || !staking || staking.pendingBonus === 0}
                    onClick={() => submit('Claim Bonus', (sourceId, targetTick) => buildClaimBonusTx({ sourceId, tick: targetTick }))}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-purple-400/40 bg-purple-400/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-purple-300 hover:bg-purple-400/20 disabled:opacity-40 font-mono"
                  >
                    <Gift className="h-3.5 w-3.5" />
                    Claim Bonus
                  </button>
                </div>

                {action.status !== 'idle' ? (
                  <div
                    className={cn(
                      'flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs font-mono',
                      action.status === 'ok'
                        ? 'border-green-400/30 bg-green-400/5 text-green-300'
                        : action.status === 'error'
                          ? 'border-red-400/30 bg-red-400/5 text-red-300'
                          : 'border-cyan-400/30 bg-cyan-400/5 text-cyan-200'
                    )}
                  >
                    {busy ? (
                      <Loader2 className="h-3.5 w-3.5 shrink-0 mt-0.5 animate-spin" />
                    ) : action.status === 'ok' ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    )}
                    <span>{action.message}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-4 font-mono text-[11px] text-gray-500 leading-relaxed">
          <p>
            Staking moves management of your QDOGE to the QTREAT contract via QX — it isn&apos;t a transfer to a
            third party, and you keep full ownership. Unstaking has a {QTREAT_UNSTAKE_DELAY_EPOCHS}-epoch delay
            after you request it, and both Request Unstake and Claim Bonus require a small {QTREAT_QX_TRANSFER_FEE}{' '}
            qu fee attached to cover the network&apos;s share-transfer cost. Contract source: QTREAT.h.
          </p>
        </div>
      </div>
    </div>
  );
}
