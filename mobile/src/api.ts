/**
 * Typed client for the Move-to-Earn backend (app/api/move-to-earn in the
 * QDoge-website repo). SessionTelemetry mirrors lib/move-to-earn/engine.ts
 * on the server — keep the two in sync until the app is split into its own
 * package that can import the shared types directly.
 */

import { API_BASE } from './config';

export interface SessionTelemetry {
  steps: number;
  durationSec: number;
  gpsDistanceM: number | null;
  maxGpsJumpM: number;
  cadenceVariation: number;
}

export interface ActivityResult {
  credited: number;
  rate: number;
  rejected: boolean;
  reasons: string[];
}

export interface AccountStatus {
  accountId: string;
  walletId: string;
  trustScore: number;
  qdogeBalance: number;
  today: {
    day: string;
    creditedSteps: number;
    effectiveSteps: number;
    sessions: number;
    rejectedSessions: number;
  };
  payouts: Array<{
    epoch: number;
    amountQus: number;
    status: string;
  }>;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error ?? `request failed (${res.status})`);
  }
  return body as T;
}

export function register(walletId: string): Promise<{ accountId: string }> {
  return request('/register', {
    method: 'POST',
    body: JSON.stringify({ walletId }),
  });
}

export function submitActivity(
  accountId: string,
  day: string,
  session: SessionTelemetry
): Promise<ActivityResult> {
  return request('/activity', {
    method: 'POST',
    body: JSON.stringify({ accountId, day, session }),
  });
}

export function getAccount(accountId: string): Promise<AccountStatus> {
  return request(`/account/${accountId}`);
}
