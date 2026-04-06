import { DISPATCHER_JSON } from '@/lib/mining/constants';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch(DISPATCHER_JSON, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 10 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Dispatcher upstream error', status: res.status },
        { status: 502 }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch dispatcher' }, { status: 500 });
  }
}
