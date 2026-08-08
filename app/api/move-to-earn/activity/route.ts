import { validateSession, type SessionTelemetry } from '@/lib/move-to-earn/engine';
import { getStore } from '@/lib/move-to-earn/store';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseTelemetry(raw: unknown): SessionTelemetry | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const t = raw as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const steps = num(t.steps);
  const durationSec = num(t.durationSec);
  const maxGpsJumpM = num(t.maxGpsJumpM);
  const cadenceVariation = num(t.cadenceVariation);
  const gpsDistanceM = t.gpsDistanceM === null ? null : num(t.gpsDistanceM);
  if (
    steps === null ||
    durationSec === null ||
    maxGpsJumpM === null ||
    cadenceVariation === null ||
    (gpsDistanceM === undefined)
  ) {
    return null;
  }
  if (steps < 0 || durationSec <= 0) return null;
  return { steps, durationSec, gpsDistanceM, maxGpsJumpM, cadenceVariation };
}

/**
 * Submit one activity session. The client sends telemetry, never a bare
 * step count — the server decides what is credited.
 *
 * Production hardening before launch: per-device request signing and
 * attestation checks, plus rate limiting per account per day.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accountId = typeof body?.accountId === 'string' ? body.accountId : '';
    const day = typeof body?.day === 'string' ? body.day : '';
    const telemetry = parseTelemetry(body?.session);

    if (!accountId || !DAY_RE.test(day) || !telemetry) {
      return NextResponse.json(
        { error: 'accountId, day (YYYY-MM-DD) and session telemetry required' },
        { status: 400 }
      );
    }

    const store = getStore();
    const account = await store.getAccount(accountId);
    if (!account) {
      return NextResponse.json({ error: 'unknown account' }, { status: 404 });
    }

    const verdict = validateSession(telemetry);
    const existing = (await store.getDailyCredit(accountId, day)) ?? {
      accountId,
      day,
      creditedSteps: 0,
      sessions: 0,
      rejectedSessions: 0,
    };
    await store.upsertDailyCredit({
      ...existing,
      creditedSteps: existing.creditedSteps + verdict.creditedSteps,
      sessions: existing.sessions + 1,
      rejectedSessions: existing.rejectedSessions + (verdict.rejected ? 1 : 0),
    });

    return NextResponse.json({
      credited: verdict.creditedSteps,
      rate: verdict.rate,
      rejected: verdict.rejected,
      reasons: verdict.reasons,
    });
  } catch {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }
}
