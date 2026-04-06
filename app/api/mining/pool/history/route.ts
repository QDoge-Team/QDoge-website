import { STATS_SERVICE } from '@/lib/mining/constants';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const now = Math.floor(Date.now() / 1000);
  const to = Number(searchParams.get('to')) || now;
  const from =
    Number(searchParams.get('from')) || now - 60 * 60 * 48; /* 48h default */

  try {
    const url = `${STATS_SERVICE}/api/pool/history?from=${from}&to=${to}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Pool history upstream error', status: res.status },
        { status: 502 }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch pool history' }, { status: 500 });
  }
}
