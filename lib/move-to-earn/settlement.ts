/**
 * QDOGE Move-to-Earn — epoch settlement.
 *
 * Turns one epoch's activity ledger + the rig's epoch income into pending
 * payouts, using the reward engine as the single source of math. Payouts
 * are recorded as 'pending' — the fraud-review window happens between
 * settlement and release, and release (actual Qubic transfers) is a
 * separate, explicitly triggered step.
 */

import {
  computeEpochDistribution,
  dailyEffectiveSteps,
  type ParticipantActivity,
} from './engine';
import type { EpochSettlement, PendingPayout, Store } from './store';

/** UTC day strings (YYYY-MM-DD) covered by an epoch, given its start. */
export function epochDays(epochStartUtc: Date, days = 7): string[] {
  const out: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(epochStartUtc.getTime() + i * 86_400_000);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export interface SettleEpochInput {
  epoch: number;
  /** QUBIC (qus) the rig earned this epoch, read from the payout wallet. */
  rigIncomeQus: number;
  /** UTC days the epoch covers. */
  days: string[];
  /** Timestamp (Qubic tick or ms) recorded on the settlement row. */
  nowTick: number;
}

export type SettleEpochResult =
  | { ok: true; settlement: EpochSettlement; payouts: PendingPayout[] }
  | { ok: false; error: 'already_settled' | 'no_participants' };

/**
 * Settle one epoch. Idempotent: refuses to settle the same epoch twice.
 * The daily diminishing-returns curve is applied per day, then summed —
 * matching how the simulator estimates.
 */
export async function settleEpoch(
  store: Store,
  input: SettleEpochInput
): Promise<SettleEpochResult> {
  if (await store.getSettlement(input.epoch)) {
    return { ok: false, error: 'already_settled' };
  }

  const credits = await store.listCreditsForDays(input.days);
  const stepsByAccount = new Map<string, number>();
  for (const c of credits) {
    stepsByAccount.set(
      c.accountId,
      (stepsByAccount.get(c.accountId) ?? 0) + dailyEffectiveSteps(c.creditedSteps)
    );
  }

  const participants: ParticipantActivity[] = [];
  for (const [accountId, effectiveSteps] of stepsByAccount) {
    const account = await store.getAccount(accountId);
    if (!account || effectiveSteps <= 0) continue;
    participants.push({
      id: accountId,
      effectiveSteps,
      trustScore: account.trustScore,
      qdogeBalance: account.qdogeBalance,
    });
  }
  if (participants.length === 0) {
    return { ok: false, error: 'no_participants' };
  }

  const dist = computeEpochDistribution(input.rigIncomeQus, participants);

  const payouts: PendingPayout[] = [];
  for (const [accountId, amountQus] of dist.payoutsQus) {
    const account = await store.getAccount(accountId);
    if (!account) continue;
    payouts.push({
      accountId,
      walletId: account.walletId,
      epoch: input.epoch,
      amountQus,
      status: 'pending',
    });
  }

  const settlement: EpochSettlement = {
    epoch: input.epoch,
    rigIncomeQus: input.rigIncomeQus,
    poolQus: dist.poolQus,
    retainedQus: dist.retainedQus,
    carriedOverQus: dist.carriedOverQus,
    participants: participants.length,
    settledAtTick: input.nowTick,
  };

  await store.addPayouts(payouts);
  await store.addSettlement(settlement);
  return { ok: true, settlement, payouts };
}
