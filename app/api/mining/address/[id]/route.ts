import { STATS_SERVICE } from '@/lib/mining/constants';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { id } = await context.params;
  if (!id || id.length < 8) {
    return NextResponse.json({ error: 'Invalid identity' }, { status: 400 });
  }

  try {
    const res = await fetch(`${STATS_SERVICE}/api/pool/address/${encodeURIComponent(id)}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 30 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Address stats upstream error', status: res.status },
        { status: 502 }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch address stats' }, { status: 500 });
  }
}
