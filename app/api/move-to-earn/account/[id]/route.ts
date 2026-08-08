import { dailyEffectiveSteps } from '@/lib/move-to-earn/engine';
import { getStore } from '@/lib/move-to-earn/store';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Account status: today's credit, pending payouts, trust standing. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const store = getStore();
    const account = await store.getAccount(id);
    if (!account) {
      return NextResponse.json({ error: 'unknown account' }, { status: 404 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const credit = await store.getDailyCredit(id, today);
    const payouts = await store.listPayoutsForAccount(id);

    return NextResponse.json({
      accountId: account.id,
      walletId: account.walletId,
      trustScore: account.trustScore,
      qdogeBalance: account.qdogeBalance,
      today: {
        day: today,
        creditedSteps: credit?.creditedSteps ?? 0,
        effectiveSteps: dailyEffectiveSteps(credit?.creditedSteps ?? 0),
        sessions: credit?.sessions ?? 0,
        rejectedSessions: credit?.rejectedSessions ?? 0,
      },
      payouts,
    });
  } catch {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }
}
