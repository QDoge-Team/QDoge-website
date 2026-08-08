/**
 * QDOGE Move-to-Earn — reward engine.
 *
 * Pure functions only: this module is the single source of truth for how
 * verified movement converts into a share of each epoch's QUBIC reward pool.
 * It runs today in the on-site simulator and is designed to be lifted
 * unchanged into the backend that settles real payouts per Qubic epoch.
 *
 * Model in one line: the mining rig earns a pool of QUBIC each epoch, and
 * every participant receives a slice proportional to their capped, verified
 * activity — payouts are always a share of real income, never a fixed rate
 * per step, so the program can never pay out more than the rig earned.
 */

/* ---------------- CONSTANTS ---------------- */

/** Human gait cadence band (steps per second). Sessions outside it earn nothing. */
export const CADENCE_MIN_HZ = 1.3;
export const CADENCE_MAX_HZ = 2.5;

/** Sustained speed above this is not walking/running for reward purposes (km/h). */
export const MAX_REWARDABLE_SPEED_KMH = 15;

/** Plausible human stride length derived from GPS distance / steps (meters). */
export const STRIDE_MIN_M = 0.5;
export const STRIDE_MAX_M = 1.2;

/** A single GPS jump longer than this within one session is a teleport (meters). */
export const TELEPORT_JUMP_M = 500;

/** Full credit up to this many steps per day. */
export const DAILY_FULL_CREDIT_STEPS = 10_000;
/** Steps between the full-credit line and the hard cap earn half credit. */
export const DAILY_HARD_CAP_STEPS = 20_000;

/** Indoor / no-GPS activity (e.g. treadmill) earns a reduced rate, not zero. */
export const INDOOR_RATE = 0.5;

/** Share of each epoch's rig income distributed to the community pool. */
export const DEFAULT_COMMUNITY_SHARE = 0.6;

/** Payouts smaller than this stay pending and roll into the next epoch (qus). */
export const MIN_PAYOUT_QUS = 1_000;

/* ---------------- TYPES ---------------- */

export interface SessionTelemetry {
  /** Steps reported by the device sensor pipeline for this session. */
  steps: number;
  /** Session duration in seconds. */
  durationSec: number;
  /** Total GPS displacement in meters, or null for indoor/no-GPS sessions. */
  gpsDistanceM: number | null;
  /** Largest single jump between consecutive GPS fixes, meters (0 if no GPS). */
  maxGpsJumpM: number;
  /** Coefficient of variation of inter-step intervals (0 = metronome-perfect). */
  cadenceVariation: number;
}

export type RejectionReason =
  | 'cadence_out_of_band'
  | 'speed_exceeded'
  | 'implausible_stride'
  | 'gps_teleport'
  | 'mechanical_cadence';

export interface SessionVerdict {
  /** Steps that count toward rewards (0 when rejected). */
  creditedSteps: number;
  /** Multiplier already applied to creditedSteps (INDOOR_RATE for no-GPS). */
  rate: number;
  rejected: boolean;
  reasons: RejectionReason[];
}

export interface ParticipantActivity {
  /** Stable participant id (attested device / account). */
  id: string;
  /** Sum of credited steps across the epoch, before daily-curve weighting. */
  effectiveSteps: number;
  /** Anti-cheat trust score in [0, 1]; scales the participant's share. */
  trustScore: number;
}

export interface EpochDistribution {
  /** Qus paid out this epoch, keyed by participant id. */
  payoutsQus: Map<string, number>;
  /** Qus held back for participants under the dust threshold. */
  carriedOverQus: number;
  /** Qus retained by the program (1 - communityShare). */
  retainedQus: number;
  /** The community pool actually divided this epoch. */
  poolQus: number;
}

/* ---------------- SESSION VALIDATION ---------------- */

/**
 * Server-side plausibility check for one activity session. The client never
 * submits a bare step total — it submits telemetry, and this decides what
 * (if anything) is credited.
 */
export function validateSession(t: SessionTelemetry): SessionVerdict {
  const reasons: RejectionReason[] = [];

  const cadenceHz = t.durationSec > 0 ? t.steps / t.durationSec : 0;
  if (cadenceHz < CADENCE_MIN_HZ || cadenceHz > CADENCE_MAX_HZ) {
    reasons.push('cadence_out_of_band');
  }

  // Real gait is irregular; a shaker rig is metronome-perfect.
  if (t.cadenceVariation < 0.02) {
    reasons.push('mechanical_cadence');
  }

  if (t.gpsDistanceM != null) {
    const speedKmh =
      t.durationSec > 0 ? (t.gpsDistanceM / t.durationSec) * 3.6 : 0;
    if (speedKmh > MAX_REWARDABLE_SPEED_KMH) {
      reasons.push('speed_exceeded');
    }

    if (t.maxGpsJumpM > TELEPORT_JUMP_M) {
      reasons.push('gps_teleport');
    }

    const strideM = t.steps > 0 ? t.gpsDistanceM / t.steps : 0;
    if (strideM < STRIDE_MIN_M || strideM > STRIDE_MAX_M) {
      reasons.push('implausible_stride');
    }
  }

  if (reasons.length > 0) {
    return { creditedSteps: 0, rate: 0, rejected: true, reasons };
  }

  const rate = t.gpsDistanceM == null ? INDOOR_RATE : 1;
  return {
    creditedSteps: Math.round(t.steps * rate),
    rate,
    rejected: false,
    reasons,
  };
}

/* ---------------- DAILY CREDIT CURVE ---------------- */

/**
 * Diminishing-returns curve over one day of credited steps: full credit to
 * 10k, half credit from 10k–20k, nothing beyond. Caps every account's daily
 * earning power, so even an undetected cheat has a bounded blast radius.
 */
export function dailyEffectiveSteps(creditedSteps: number): number {
  const steps = Math.max(0, creditedSteps);
  const fullBand = Math.min(steps, DAILY_FULL_CREDIT_STEPS);
  const halfBand =
    Math.min(Math.max(steps - DAILY_FULL_CREDIT_STEPS, 0), DAILY_HARD_CAP_STEPS - DAILY_FULL_CREDIT_STEPS) * 0.5;
  return Math.round(fullBand + halfBand);
}

/* ---------------- EPOCH DISTRIBUTION ---------------- */

/**
 * Split one epoch's rig income among participants, proportional to
 * trust-weighted effective steps. Integer qus, largest-remainder rounding,
 * dust threshold carried over — the sum of payouts never exceeds the pool.
 */
export function computeEpochDistribution(
  rigIncomeQus: number,
  participants: ParticipantActivity[],
  communityShare: number = DEFAULT_COMMUNITY_SHARE
): EpochDistribution {
  const poolQus = Math.floor(Math.max(0, rigIncomeQus) * communityShare);
  const retainedQus = Math.max(0, rigIncomeQus) - poolQus;
  const payoutsQus = new Map<string, number>();

  const weights = participants.map((p) => ({
    id: p.id,
    weight:
      Math.max(0, p.effectiveSteps) *
      Math.min(1, Math.max(0, p.trustScore)),
  }));
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);

  if (totalWeight <= 0 || poolQus <= 0) {
    return { payoutsQus, carriedOverQus: 0, retainedQus, poolQus };
  }

  // Largest-remainder apportionment so integer payouts sum exactly to poolQus.
  const exact = weights.map((w) => ({
    id: w.id,
    raw: (poolQus * w.weight) / totalWeight,
  }));
  const floored = exact.map((e) => ({
    id: e.id,
    qus: Math.floor(e.raw),
    remainder: e.raw - Math.floor(e.raw),
  }));
  let leftover = poolQus - floored.reduce((sum, f) => sum + f.qus, 0);
  for (const f of [...floored].sort((a, b) => b.remainder - a.remainder)) {
    if (leftover <= 0) break;
    f.qus += 1;
    leftover -= 1;
  }

  let carriedOverQus = 0;
  for (const f of floored) {
    if (f.qus >= MIN_PAYOUT_QUS) {
      payoutsQus.set(f.id, f.qus);
    } else {
      carriedOverQus += f.qus;
    }
  }

  return { payoutsQus, carriedOverQus, retainedQus, poolQus };
}

/**
 * Convenience for the on-site simulator: your estimated epoch payout given
 * average daily steps, the crowd's size and average activity, and the rig's
 * epoch income.
 */
export function estimateEpochPayoutQus(params: {
  rigIncomeQus: number;
  yourDailySteps: number;
  otherParticipants: number;
  othersAvgDailySteps: number;
  daysPerEpoch?: number;
  communityShare?: number;
}): number {
  const days = params.daysPerEpoch ?? 7;
  const you: ParticipantActivity = {
    id: 'you',
    effectiveSteps: dailyEffectiveSteps(params.yourDailySteps) * days,
    trustScore: 1,
  };
  const crowd: ParticipantActivity[] = Array.from(
    { length: Math.max(0, Math.floor(params.otherParticipants)) },
    (_, i) => ({
      id: `p${i}`,
      effectiveSteps: dailyEffectiveSteps(params.othersAvgDailySteps) * days,
      trustScore: 1,
    })
  );
  const result = computeEpochDistribution(
    params.rigIncomeQus,
    [you, ...crowd],
    params.communityShare
  );
  return result.payoutsQus.get('you') ?? 0;
}
