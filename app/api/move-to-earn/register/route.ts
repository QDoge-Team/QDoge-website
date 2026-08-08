import { getStore } from '@/lib/move-to-earn/store';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Qubic wallet IDs are 60 uppercase letters. */
const WALLET_ID_RE = /^[A-Z]{60}$/;

/** New accounts start in probation: reduced trust until history accrues. */
const PROBATION_TRUST = 0.5;

/**
 * Register an earning account for a payout wallet.
 *
 * Production hardening happens here before launch: Play Integrity /
 * App Attest verification gates registration, and the account id is
 * derived from the attested device so one device = one account.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const walletId = typeof body?.walletId === 'string' ? body.walletId : '';
    if (!WALLET_ID_RE.test(walletId)) {
      return NextResponse.json(
        { error: 'walletId must be a 60-letter Qubic wallet ID' },
        { status: 400 }
      );
    }

    const store = getStore();
    const existing = (await store.listAccounts()).find(
      (a) => a.walletId === walletId
    );
    if (existing) {
      return NextResponse.json(
        { error: 'wallet already registered', accountId: existing.id },
        { status: 409 }
      );
    }

    const account = {
      id: crypto.randomUUID(),
      walletId,
      trustScore: PROBATION_TRUST,
      qdogeBalance: 0,
      createdAtTick: Date.now(),
    };
    await store.upsertAccount(account);
    return NextResponse.json({ accountId: account.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }
}
