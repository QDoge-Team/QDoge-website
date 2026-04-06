import { STATS_SERVICE } from '@/lib/mining/constants';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Ctx) {
  const { id } = await context.params;
  if (!id || id.length < 8) {
    return NextResponse.json({ error: 'Invalid identity' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const resolution = searchParams.get('resolution') ?? 'auto';
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const qs = new URLSearchParams();
  if (resolution) qs.set('resolution', resolution);
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);

  try {
    const url = `${STATS_SERVICE}/api/pool/address/${encodeURIComponent(id)}/history?${qs}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Address history upstream error', status: res.status },
        { status: 502 }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch address history' }, { status: 500 });
  }
}
