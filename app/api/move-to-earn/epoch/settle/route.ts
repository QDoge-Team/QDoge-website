import { epochDays, settleEpoch } from '@/lib/move-to-earn/settlement';
import { getStore } from '@/lib/move-to-earn/store';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Settle an epoch (admin only). Requires the M2E_ADMIN_TOKEN env var to be
 * configured and presented as a bearer token — with no token configured,
 * the endpoint is disabled entirely.
 *
 * rigIncomeQus is passed explicitly for now; production reads it from the
 * program's payout wallet on-chain, and a scheduled job calls this at each
 * epoch boundary.
 */
export async function POST(request: Request) {
  const adminToken = process.env.M2E_ADMIN_TOKEN;
  const auth = request.headers.get('authorization') ?? '';
  if (!adminToken || auth !== `Bearer ${adminToken}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const epoch = Number(body?.epoch);
    const rigIncomeQus = Number(body?.rigIncomeQus);
    const epochStart = new Date(String(body?.epochStartUtc ?? ''));

    if (
      !Number.isInteger(epoch) ||
      epoch <= 0 ||
      !Number.isFinite(rigIncomeQus) ||
      rigIncomeQus < 0 ||
      Number.isNaN(epochStart.getTime())
    ) {
      return NextResponse.json(
        { error: 'epoch, rigIncomeQus and epochStartUtc required' },
        { status: 400 }
      );
    }

    const result = await settleEpoch(getStore(), {
      epoch,
      rigIncomeQus,
      days: epochDays(epochStart),
      nowTick: Date.now(),
    });

    if (!result.ok) {
      const status = result.error === 'already_settled' ? 409 : 422;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({
      settlement: result.settlement,
      payouts: result.payouts.length,
    });
  } catch {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }
}
