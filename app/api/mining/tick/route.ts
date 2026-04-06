import { QUBIC_TICK } from '@/lib/mining/constants';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch(QUBIC_TICK, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 15 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Tick upstream error', status: res.status },
        { status: 502 }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tick' }, { status: 500 });
  }
}
