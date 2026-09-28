import { QubicHelper } from '@qubic-lib/qubic-ts-library/dist/qubicHelper';
import { QDOGE_ISSUER_ID } from '@/lib/tokens/constants';
import { base64ToUint8Array, createPayload, createSCTx, uint8ArrayToBase64 } from './tx-utils';
import { fetchQuerySC } from './rpc';

const qHelper = new QubicHelper();

/**
 * QTREAT staking contract. Source verified against the exact commit merged
 * in qubic/core#973 (8d2e4bf, merged 2026-09-21) -- struct layouts and
 * function/procedure indices below match it byte-for-byte.
 *
 * The name is a little misleading: users STAKE QDOGE (not QTREAT) into this
 * contract, and earn QTREAT as a bonus. Both assets share the same issuer as
 * QDOGE_ISSUER_ID. Confirmed straight from the contract source:
 * `qdogeToken` is the asset checked in PRE/POST_ACQUIRE_SHARES (the staking
 * hook), while `qtreatToken` is only moved by admin deposits and
 * ClaimQtreatBonus payouts.
 *
 * As of 2026-09-27 the contract is still in its IPO phase -- querySmartContract
 * calls return an empty responseData until it activates (expected Wednesday
 * 12:30 UTC), which every read function below treats as "not live yet"
 * rather than an error.
 */
export const QTREAT_CONTRACT_INDEX = 30;
export const QX_CONTRACT_INDEX = 1;

export const QTREAT_MIN_STAKE = 10_000_000;
export const QTREAT_MAX_STAKERS = 65_536;
export const QTREAT_UNSTAKE_DELAY_EPOCHS = 2;
/** qu fee required as invocationReward on RequestUnstake/ClaimQtreatBonus (covers QX's release-shares fee). */
export const QTREAT_QX_TRANSFER_FEE = 100;

export const QTREAT_STAKE_ASSET = { name: 'QDOGE', issuer: QDOGE_ISSUER_ID };
export const QTREAT_BONUS_ASSET = { name: 'QTREAT', issuer: QDOGE_ISSUER_ID };

const FUNCTION = {
  GetStakingInfo: 1,
  GetPhaseInfo: 2,
  GetFunds: 3,
} as const;

const PROCEDURE = {
  RequestUnstake: 3,
  FinalizeUnstake: 4,
  ClaimQtreatBonus: 5,
} as const;

/** QX's own "transfer share management rights" procedure -- how staking (and unstaking-back-out) actually moves QDOGE. */
const QX_TRANSFER_SHARE_MANAGEMENT_RIGHTS_INPUT_TYPE = 9;

function assetNameToUint64(name: string): bigint {
  if (name.length > 7) throw new Error('Asset name too long');
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  for (let i = 0; i < name.length; i++) view.setUint8(i, name.charCodeAt(i));
  return view.getBigUint64(0, true);
}

function readResponse(base64: string) {
  const bytes = base64ToUint8Array(base64);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return {
    u64: (offset: number) => Number(view.getBigUint64(offset, true)),
    u32: (offset: number) => view.getUint32(offset, true),
    id: (offset: number) => qHelper.getIdentity(bytes.slice(offset, offset + 32)),
  };
}

export type StakingInfo = {
  staked: number;
  unstakeAmount: number;
  unstakeEpoch: number;
  bonusEpochs: number;
  bonusAwarded: number;
  pendingBonus: number;
  growthStreak: number;
  hwmHoldings: number;
  totalStaked: number;
  stakingFund: number;
  isStaker: boolean;
};

export async function getStakingInfo(staker: string): Promise<StakingInfo | null> {
  const requestData = uint8ArrayToBase64(qHelper.getIdentityBytes(staker));
  const res = await fetchQuerySC({
    contractIndex: QTREAT_CONTRACT_INDEX,
    inputType: FUNCTION.GetStakingInfo,
    inputSize: 32,
    requestData,
  });
  if (!res.responseData) return null;
  const r = readResponse(res.responseData);
  return {
    staked: r.u64(0),
    unstakeAmount: r.u64(8),
    unstakeEpoch: r.u64(16),
    bonusEpochs: r.u64(24),
    bonusAwarded: r.u64(32),
    pendingBonus: r.u64(40),
    growthStreak: r.u64(48),
    hwmHoldings: r.u64(56),
    totalStaked: r.u64(64),
    stakingFund: r.u64(72),
    isStaker: r.u32(80) !== 0,
  };
}

export type PhaseInfo = {
  stakingStartEpoch: number;
  currentPhase: number;
  epochsRemaining: number;
};

export async function getPhaseInfo(): Promise<PhaseInfo | null> {
  const res = await fetchQuerySC({
    contractIndex: QTREAT_CONTRACT_INDEX,
    inputType: FUNCTION.GetPhaseInfo,
    inputSize: 0,
    requestData: '',
  });
  if (!res.responseData) return null;
  const r = readResponse(res.responseData);
  return {
    stakingStartEpoch: r.u64(0),
    currentPhase: r.u64(8),
    epochsRemaining: r.u64(16),
  };
}

export type FundsInfo = {
  dividendFund: number;
  stakingFund: number;
  qtreatBonusPool: number;
  totalDividendsDistributed: number;
  totalStakingRewardsDistributed: number;
  totalBonusDelivered: number;
  totalShareholderDividends: number;
  miningFund: number;
  miningRewardRate: number;
  totalMiningRewardsDistributed: number;
  dripQdogePool: number;
  dripStartEpoch: number;
  totalDripQdogeDistributed: number;
};

export async function getFundsInfo(): Promise<FundsInfo | null> {
  const res = await fetchQuerySC({
    contractIndex: QTREAT_CONTRACT_INDEX,
    inputType: FUNCTION.GetFunds,
    inputSize: 0,
    requestData: '',
  });
  if (!res.responseData) return null;
  const r = readResponse(res.responseData);
  return {
    dividendFund: r.u64(0),
    stakingFund: r.u64(8),
    qtreatBonusPool: r.u64(16),
    totalDividendsDistributed: r.u64(24),
    totalStakingRewardsDistributed: r.u64(32),
    totalBonusDelivered: r.u64(40),
    totalShareholderDividends: r.u64(48),
    miningFund: r.u64(56),
    miningRewardRate: r.u64(64),
    totalMiningRewardsDistributed: r.u64(72),
    dripQdogePool: r.u64(80),
    dripStartEpoch: r.u64(88),
    totalDripQdogeDistributed: r.u64(96),
  };
}

/**
 * Stake: not a dedicated procedure call -- QTREAT.h's PRE/POST_ACQUIRE_SHARES
 * hooks credit `staked` automatically whenever QX hands the contract
 * management rights over some of your QDOGE. So "staking" is a QX
 * TransferShareManagementRights call (QX inputType 9) naming QTREAT
 * (contract index 29) as the new manager.
 */
export async function buildStakeTx(params: { sourceId: string; amount: number; tick: number }) {
  const { sourceId, amount, tick } = params;
  const issuerBytes = qHelper.getIdentityBytes(QTREAT_STAKE_ASSET.issuer);
  const payload = createPayload([
    ...Array.from(issuerBytes).map((byte) => ({ data: byte, type: 'uint8' as const })),
    { data: assetNameToUint64(QTREAT_STAKE_ASSET.name), type: 'bigint64' },
    { data: amount, type: 'bigint64' },
    { data: QTREAT_CONTRACT_INDEX, type: 'uint32' },
  ]);
  return createSCTx({
    sourceId,
    contractIndex: QX_CONTRACT_INDEX,
    inputType: QX_TRANSFER_SHARE_MANAGEMENT_RIGHTS_INPUT_TYPE,
    amount: 0,
    tick,
    payload,
  });
}

/** Starts the unstake timer for `amount` of your current stake. Requires the 100 qu QX fee attached. */
export async function buildRequestUnstakeTx(params: { sourceId: string; amount: number; tick: number }) {
  const { sourceId, amount, tick } = params;
  const payload = createPayload([{ data: amount, type: 'bigint64' }]);
  return createSCTx({
    sourceId,
    contractIndex: QTREAT_CONTRACT_INDEX,
    inputType: PROCEDURE.RequestUnstake,
    amount: QTREAT_QX_TRANSFER_FEE,
    tick,
    payload,
  });
}

/** Completes a pending unstake once QTREAT_UNSTAKE_DELAY_EPOCHS has elapsed; releases the QDOGE back to you. No fee needed. */
export async function buildFinalizeUnstakeTx(params: { sourceId: string; tick: number }) {
  const { sourceId, tick } = params;
  return createSCTx({
    sourceId,
    contractIndex: QTREAT_CONTRACT_INDEX,
    inputType: PROCEDURE.FinalizeUnstake,
    amount: 0,
    tick,
  });
}

/** Claims any pending QTREAT bonus. Requires the 100 qu QX fee attached. */
export async function buildClaimBonusTx(params: { sourceId: string; tick: number }) {
  const { sourceId, tick } = params;
  return createSCTx({
    sourceId,
    contractIndex: QTREAT_CONTRACT_INDEX,
    inputType: PROCEDURE.ClaimQtreatBonus,
    amount: QTREAT_QX_TRANSFER_FEE,
    tick,
  });
}
