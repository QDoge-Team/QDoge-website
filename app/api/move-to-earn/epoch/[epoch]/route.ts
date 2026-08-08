import { getStore } from '@/lib/move-to-earn/store';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Public epoch summary: pool numbers and payout count, no account data. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ epoch: string }> }
) {
  try {
    const { epoch: epochParam } = await params;
    const epoch = Number(epochParam);
    if (!Number.isInteger(epoch) || epoch <= 0) {
      return NextResponse.json({ error: 'invalid epoch' }, { status: 400 });
    }

    const store = getStore();
    const settlement = await store.getSettlement(epoch);
    if (!settlement) {
      return NextResponse.json({ error: 'epoch not settled' }, { status: 404 });
    }
    const payouts = await store.listPayouts(epoch);

    return NextResponse.json({
      settlement,
      payoutCount: payouts.length,
      totalPaidQus: payouts.reduce((sum, p) => sum + p.amountQus, 0),
    });
  } catch {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }
}
