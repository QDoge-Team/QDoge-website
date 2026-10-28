import {
  canonicalDappOrigin,
  createConnectRequest,
  createEnvelope,
  createScCallRequest,
  launchGlyphRequest,
  prepareRelaySession,
  subscribeViaRelayV2,
  type GlyphCallbackResponse,
  type GlyphPreparedRelaySession,
  type GlyphRequest,
  type GlyphSignedCallbackEnvelope,
} from '@glyph-oss/connect';
import { identityToPublicKey, k12, verify } from '@qubic.org/crypto';

/**
 * Glyph Wallet (desktop) connector.
 *
 * Unlike WalletConnect, Glyph signs AND broadcasts the transaction itself and
 * reports back the tx hash and target tick. The request travels to the wallet
 * through a glyph:// deep link and the signed reply comes back through
 * Glyph's relay (relay.glyphq.org), where it is verified here before use.
 *
 * Two rules from the Glyph docs shape this file:
 * - A relay session is single-use and must be registered BEFORE the click that
 *   launches the wallet (the launch itself must stay inside the user gesture,
 *   with no awaited network work in front of it).
 * - The dApp origin must be a public HTTPS origin, so this does not work on
 *   localhost.
 */

type Identity = Parameters<typeof identityToPublicKey>[0];

const MAINNET = { id: 'qubic:mainnet' } as const;
const DAPP_NAME = 'QDOGE';

export type GlyphErrorCode =
  | 'unavailable'
  | 'session_not_ready'
  | 'launch_failed'
  | 'wallet_rejected'
  | 'timeout'
  | 'relay_unavailable'
  | 'verification_failed'
  | 'invalid_response';

const MESSAGES: Record<GlyphErrorCode, string> = {
  unavailable: 'Glyph Wallet is not available here.',
  session_not_ready: 'Glyph is still preparing a secure session. Wait a moment, then try again.',
  launch_failed: "Couldn't open Glyph Wallet. Make sure the desktop app is installed and running.",
  wallet_rejected: 'The request was rejected in Glyph Wallet.',
  timeout: "Glyph Wallet didn't answer in time. Open the wallet, check for the request, then try again.",
  relay_unavailable: "Couldn't reach Glyph's relay. Check your connection and try again.",
  verification_failed: "The wallet's reply couldn't be verified, so nothing was used. Try again.",
  invalid_response: 'Glyph Wallet sent an unexpected reply. Try again.',
};

export class GlyphError extends Error {
  readonly code: GlyphErrorCode;
  constructor(code: GlyphErrorCode, message?: string) {
    super(message ?? MESSAGES[code]);
    this.name = 'GlyphError';
    this.code = code;
  }
}

/** Why Glyph can't be used right now, or null when it can. */
export function glyphUnavailableReason(): string | null {
  if (typeof window === 'undefined') return 'Glyph Wallet is only available in the browser.';
  if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    return 'Glyph Wallet is a desktop app (Windows, macOS, Linux).';
  }
  try {
    const origin = canonicalDappOrigin(window.location.origin);
    if (!origin.startsWith('https://')) throw new Error('not https');
  } catch {
    return 'Glyph needs the public HTTPS site, so it does not work on localhost.';
  }
  return null;
}

function dappMeta() {
  return { name: DAPP_NAME, origin: canonicalDappOrigin(window.location.origin) };
}

/* ---------------- relay session state (single-use sessions) ---------------- */

export type GlyphState = { ready: boolean; preparing: boolean; error: string | null };

let prepared: GlyphPreparedRelaySession | null = null;
let preparing: Promise<void> | null = null;
let prepareError: string | null = null;
let snapshot: GlyphState = { ready: false, preparing: false, error: null };
const listeners = new Set<() => void>();

function publish() {
  snapshot = { ready: prepared !== null, preparing: preparing !== null, error: prepareError };
  listeners.forEach((l) => l());
}

export function subscribeGlyphState(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getGlyphState(): GlyphState {
  return snapshot;
}

export const SERVER_GLYPH_STATE: GlyphState = { ready: false, preparing: false, error: null };

/** Registers a fresh single-use relay session. Safe to call repeatedly. */
export function prewarmGlyphSession(): Promise<void> {
  const blocked = glyphUnavailableReason();
  if (blocked) {
    prepareError = blocked;
    publish();
    return Promise.resolve();
  }
  if (prepared) return Promise.resolve();
  if (preparing) return preparing;
  prepareError = null;
  preparing = prepareRelaySession()
    .then((session) => {
      prepared = session;
    })
    .catch(() => {
      prepareError = MESSAGES.relay_unavailable;
    })
    .finally(() => {
      preparing = null;
      publish();
    });
  publish();
  return preparing;
}

function takeSession(): GlyphPreparedRelaySession {
  if (!prepared) throw new GlyphError('session_not_ready');
  const session = prepared;
  prepared = null;
  publish();
  return session;
}

/* ---------------- callback verification ---------------- */

function sameBytes(a: Uint8Array, b: Uint8Array) {
  return a.byteLength === b.byteLength && a.every((byte, i) => byte === b[i]);
}

function hasValidIdentity(value: unknown): value is Identity {
  if (typeof value !== 'string') return false;
  try {
    identityToPublicKey(value as Identity);
    return true;
  } catch {
    return false;
  }
}

/**
 * Verifies the wallet's signature over the callback and binds its public key to
 * the identity it claims, so a valid signature can't be paired with a
 * different identity.
 */
function verifyWalletCallbackSignature(input: {
  payload: Uint8Array;
  signature: Uint8Array;
  publicKey: Uint8Array;
  envelope?: GlyphSignedCallbackEnvelope;
}) {
  if (input.envelope) {
    try {
      const proofIdentity = input.envelope.proof.identity;
      if (!hasValidIdentity(proofIdentity)) return false;
      if (!sameBytes(identityToPublicKey(proofIdentity), input.publicKey)) return false;
      if (input.envelope.result.status !== 'rejected' && input.envelope.result.identity !== proofIdentity) {
        return false;
      }
    } catch {
      return false;
    }
  }
  return verify(k12(input.payload, 32), input.signature, input.publicKey);
}

function classify(error: unknown): GlyphError {
  if (error instanceof GlyphError) return error;
  const code = (error as { code?: string } | null)?.code;
  switch (code) {
    case 'stream_timeout':
    case 'poll_timeout':
    case 'poll_exhausted':
    case 'result_pending':
      return new GlyphError('timeout');
    case 'registration_timeout':
    case 'registration_failed':
    case 'stream_failed':
    case 'stream_interrupted':
    case 'poll_failed':
      return new GlyphError('relay_unavailable');
    case 'callback_invalid':
    case 'callback_verification_failed':
      return new GlyphError('verification_failed');
    default:
      return new GlyphError('invalid_response');
  }
}

/**
 * Subscribes to the reply and launches the wallet. Everything up to the first
 * await runs synchronously, so when the caller is a click handler the launch
 * stays inside the user's gesture.
 */
async function runRequest(request: GlyphRequest): Promise<GlyphCallbackResponse> {
  const session = takeSession();
  const envelope = createEnvelope(request, { callback: session.callbackUrl, network: MAINNET });

  let reply: Promise<GlyphCallbackResponse>;
  try {
    reply = subscribeViaRelayV2(request, session, {
      requestHash: envelope.request_hash,
      maxPollAttempts: 12,
      pollTimeoutMs: 2_000,
      pollIntervalMs: 250,
      recoveryTimeoutMs: 3_500,
      verification: {
        requireSigned: true,
        expectedRequestHash: envelope.request_hash,
        expectedNetwork: envelope.network,
        expectedDappOrigin: request.dapp.origin,
        expectedExp: request.exp ?? null,
        expectedCallbackUrl: session.callbackUrl,
        verifySignature: verifyWalletCallbackSignature,
      },
    });
    launchGlyphRequest(envelope);
  } catch {
    throw new GlyphError('launch_failed');
  }

  try {
    const result = await reply;
    window.focus();
    return result;
  } catch (error) {
    throw classify(error);
  } finally {
    // The session was single-use; line up the next one for the next action.
    void prewarmGlyphSession();
  }
}

/* ---------------- public actions ---------------- */

/** Ask Glyph Wallet to share an identity. Call directly from a click handler. */
export function connectGlyph(): Promise<{ identity: string }> {
  const request = createConnectRequest({ type: 'connect', dapp: dappMeta(), permissions: ['sc_call'] });
  return runRequest(request).then((result) => {
    if (result.status === 'rejected') throw new GlyphError('wallet_rejected');
    if (result.status !== 'connected') throw new GlyphError('invalid_response');
    if (!hasValidIdentity(result.identity)) throw new GlyphError('verification_failed');
    if (!result.permissions.includes('sc_call')) {
      throw new GlyphError('invalid_response', 'Glyph Wallet did not grant permission for contract calls.');
    }
    return { identity: result.identity };
  });
}

export type GlyphScCall = {
  /** The connected identity; the reply must come from this same identity. */
  from: string;
  contractIndex: number;
  inputType: number;
  /** Contract ABI payload as base64, passed to the wallet unchanged. */
  payloadBase64?: string;
  /** Whole qu attached to the call. */
  amount: string;
};

/**
 * Ask Glyph Wallet to sign and broadcast a smart-contract call. The wallet
 * picks the target tick when the user approves, so there is no tick to expire
 * while waiting. Call directly from a click handler.
 */
export function sendGlyphScCall(call: GlyphScCall): Promise<{ txId: string; targetTick: number }> {
  const request = createScCallRequest({
    type: 'sc_call',
    dapp: dappMeta(),
    from: call.from,
    contract_index: call.contractIndex,
    input_type: call.inputType,
    amount: call.amount,
    ...(call.payloadBase64 ? { payload: call.payloadBase64 } : {}),
  });
  return runRequest(request).then((result) => {
    if (result.status === 'rejected') throw new GlyphError('wallet_rejected');
    if (result.status !== 'signed' || result.type !== 'sc_call') throw new GlyphError('invalid_response');
    if (result.identity !== call.from) {
      throw new GlyphError('verification_failed', 'Glyph Wallet replied for a different identity.');
    }
    return { txId: result.tx_hash, targetTick: result.target_tick };
  });
}
