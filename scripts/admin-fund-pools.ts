// Deposits qu into one of QTREAT's reward pools (Dividend / Staking / Mining
// Fund). These three procedures take no admin check and no input payload --
// any caller can top them up, they just add whatever qu is attached
// (qpi.invocationReward()) straight to the named pool. (QTREAT's other two
// deposit procedures -- the QTREAT Bonus Pool and Drip QDOGE Pool -- pull
// actual tokens from the admin wallet instead of qu, and are a separate,
// more involved flow; ask if you need those too.)
//
// Usage:
//   npx tsx --env-file=.env scripts/admin-fund-pools.ts <pool> <amountQu>
//
// <pool> is one of: dividends | staking | mining
//
// Needs QTREAT_ADMIN_SEED in your .env -- a raw 55-character lowercase seed.
// This signs and broadcasts a real mainnet transaction moving real qu out of
// that wallet. Double-check the pool name and amount before running.

import { QubicHelper } from '@qubic-lib/qubic-ts-library/dist/qubicHelper';
import { QTREAT_CONTRACT_INDEX, getFundsInfo, type FundsInfo } from '../lib/qubic/qtreat-contract';
import { createSCTx } from '../lib/qubic/tx-utils';
import { broadcastTx, fetchTickInfo, fetchTxStatus } from '../lib/qubic/rpc';

const TICK_OFFSET = 15;
const CONFIRM_TIMEOUT_MS = 90_000;
const CONFIRM_POLL_INTERVAL_MS = 3_000;

const POOLS = {
  dividends: { procedure: 1, fundKey: 'dividendFund', label: 'Dividend Fund' },
  staking: { procedure: 2, fundKey: 'stakingFund', label: 'Staking Fund' },
  mining: { procedure: 11, fundKey: 'miningFund', label: 'Mining Fund' },
} as const satisfies Record<string, { procedure: number; fundKey: keyof FundsInfo; label: string }>;

type PoolName = keyof typeof POOLS;

function parseArgs() {
  const [poolArg, amountArg] = process.argv.slice(2);
  if (!poolArg || !(poolArg in POOLS)) {
    console.error(`Usage: npx tsx --env-file=.env scripts/admin-fund-pools.ts <${Object.keys(POOLS).join('|')}> <amountQu>`);
    process.exit(1);
  }
  const amount = Number(amountArg);
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
    console.error(`Invalid amount "${amountArg}" -- must be a positive whole number of qu.`);
    process.exit(1);
  }
  return { pool: poolArg as PoolName, amount };
}

async function waitForConfirmation(txId: string): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < CONFIRM_TIMEOUT_MS) {
    try {
      const status = await fetchTxStatus(txId);
      if (status?.moneyFlew) return true;
    } catch {
      // Not indexed yet -- keep polling rather than treating this as failure.
    }
    await new Promise((r) => setTimeout(r, CONFIRM_POLL_INTERVAL_MS));
  }
  return false;
}

async function main() {
  const { pool, amount } = parseArgs();
  const { procedure, fundKey, label } = POOLS[pool];

  const seed = process.env.QTREAT_ADMIN_SEED;
  if (!seed || seed.length !== 55) {
    console.error('Missing or invalid QTREAT_ADMIN_SEED env var -- must be a 55-character seed.');
    process.exit(1);
  }

  const qHelper = new QubicHelper();
  const idPackage = await qHelper.createIdPackage(seed);
  const sourceId = idPackage.publicId;
  console.log(`Wallet: ${sourceId}`);
  console.log(`Depositing ${amount.toLocaleString('en-US')} qu into the ${label}...`);

  const before = await getFundsInfo();
  console.log(`${label} before: ${before ? before[fundKey].toLocaleString('en-US') : 'unknown'} qu`);

  const tick = await fetchTickInfo();
  const targetTick = tick.tick + TICK_OFFSET;
  const tx = await createSCTx({
    sourceId,
    contractIndex: QTREAT_CONTRACT_INDEX,
    inputType: procedure,
    amount,
    tick: targetTick,
  });

  const signed = await tx.build(seed);
  if (!signed) throw new Error('Failed to sign transaction');

  console.log(`Broadcasting for tick ${targetTick}...`);
  const result = await broadcastTx(signed);
  if (!result.transactionId) throw new Error('Broadcast did not return a transaction ID');
  console.log(`Transaction ID: ${result.transactionId}`);

  console.log('Waiting for confirmation...');
  const confirmed = await waitForConfirmation(result.transactionId);
  if (!confirmed) {
    console.error(
      `Did not confirm within ${CONFIRM_TIMEOUT_MS / 1000}s. Check the transaction ID above before retrying --\n` +
        `it may still land; don't resubmit blindly.`
    );
    process.exit(1);
  }

  const after = await getFundsInfo();
  console.log(`${label} after: ${after ? after[fundKey].toLocaleString('en-US') : 'unknown'} qu`);

  const gained = (after?.[fundKey] ?? 0) - (before?.[fundKey] ?? 0);
  if (gained >= amount) {
    console.log(`Done -- ${label} increased by ${gained.toLocaleString('en-US')} qu.`);
  } else {
    console.error(
      `Transaction confirmed, but ${label} only increased by ${gained.toLocaleString('en-US')} of the requested ` +
        `${amount.toLocaleString('en-US')} qu. Double-check the contract state before assuming this worked.`
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
