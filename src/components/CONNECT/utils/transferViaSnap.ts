/**
 * Transfer QUBIC (QU) via MetaMask Snap
 * Flow: build unsigned tx → Snap signs → broadcast via backend/RPC
 */

import axios from "axios";
import { invokeQubicSnap, requestQubicSnap } from "./qubicSnap";
import { API_URL } from "@/config";

const SIG_LEN = 64;

/**
 * Convert Uint8Array to base64 string
 */
function uint8ToBase64(u8: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < u8.length; i += chunk) {
    bin += String.fromCharCode(...u8.subarray(i, i + chunk));
  }
  return btoa(bin);
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToUint8(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function padTxForSignature(tx: Uint8Array, signatureOffset: number, signatureLength = SIG_LEN): Uint8Array {
  const needed = signatureOffset + signatureLength;
  if (tx.length >= needed) return tx;

  const padded = new Uint8Array(needed); // zero-filled
  padded.set(tx, 0);
  return padded;
}

/**
 * Sign transaction via Snap
 * The Snap may return:
 *  - signature bytes (64 bytes) -> append to unsigned header
 *  - OR full signed transaction bytes
 */
async function signTxViaSnap(params: {
  txBytes: Uint8Array;          // usually 80 bytes unsigned header
  signatureOffset: number;      // usually 80
  signatureLength: number;      // usually 64
  accountIdx: number;
  confirm: boolean;
}): Promise<Uint8Array> {
  const { txBytes, signatureOffset, signatureLength, accountIdx, confirm } = params;

  const base64Tx = uint8ToBase64(txBytes);

  const res = await invokeQubicSnap<any>({
    method: "signTransaction",
    params: {
      base64Tx,
      offset: signatureOffset,
      accountIdx,
      confirm,
    },
  });

  // Some snaps return full signed tx, others return only signature.
  const maybeB64: string =
    res?.signedTx ||
    res?.signedTransactionBytes ||
    res?.signedTransaction ||
    res?.result?.signedTx ||
    res?.signature ||              // <--- add common alt names
    res?.sig ||
    res?.result?.signature;

  if (!maybeB64) {
    throw new Error("Snap did not return signed transaction or signature");
  }

  const returned = base64ToUint8(maybeB64);

  // Case A: Snap returned ONLY signature (64 bytes) -> append/insert into a buffer that is big enough
  if (returned.length === signatureLength) {
    const outLen = Math.max(txBytes.length, signatureOffset) + signatureLength; // typically 80+64=144
    const out = new Uint8Array(outLen);
    out.set(txBytes, 0);
    out.set(returned, signatureOffset);
    return out;
  }

  // Case B: Snap returned FULL signed tx bytes -> use as-is
  // common lengths: 144, but accept whatever Snap gives if it's larger than the unsigned header
  if (returned.length > txBytes.length) {
    return returned;
  }

  throw new Error(
    `Unexpected Snap return length=${returned.length} (expected signature=${signatureLength} or full tx > ${txBytes.length})`
  );
}

export async function transferViaSnap(params: {
  fromPublicId: string; // 60-char A-Z identity
  toPublicId: string;   // 60-char A-Z identity
  amount: number;       // integer
  asset?: "QU" | "QDoge";
  accountIdx?: number;
  confirm?: boolean;
}): Promise<{ txId: string }> {
  const { fromPublicId, toPublicId } = params;
  const amount = Math.floor(params.amount);
  const accountIdx = params.accountIdx ?? 0;
  const confirm = params.confirm ?? true;

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Amount must be a positive integer");
  }

  // NOTE: This function currently sends QU (native). Token transfers (QDoge)
  // require different inputType/payload on backend.
  if (params.asset && params.asset !== "QU") {
    throw new Error("Only QU transfers are implemented right now (asset=QDoge not supported yet).");
  }

  // 1) Ensure snap permission
  await requestQubicSnap();

  // 2) Backend builds unsigned tx bytes (binary)
  const { data: buildData } = await axios.post(`${API_URL}/api/tx/build-transfer`, {
    fromId: fromPublicId,
    toId: toPublicId,
    amount,
  });

  const unsignedTxBase64: string = buildData?.unsignedTxBase64;
  const signatureOffset: number = buildData?.signatureOffset;
  const signatureLength: number = buildData?.signatureLength ?? SIG_LEN;

  if (!unsignedTxBase64) throw new Error("Backend did not return unsignedTxBase64");
  if (!Number.isInteger(signatureOffset)) throw new Error("Backend did not return signatureOffset");
  if (!Number.isInteger(signatureLength)) throw new Error("Backend did not return signatureLength");

  const unsignedTxBytes = base64ToUint8(unsignedTxBase64);

  // 3) Snap signs (returns signature or full signed tx)
  const signedTxBytes = await signTxViaSnap({
    txBytes: unsignedTxBytes,
    signatureOffset,
    signatureLength,
    accountIdx,
    confirm,
  });

  const signedTxBase64 = uint8ToBase64(signedTxBytes);

  // 4) Broadcast via backend
  const { data: broadcasted } = await axios.post(`${API_URL}/api/tx/broadcast`, {
    signedTxBase64,
  });

  const txId = broadcasted?.txId || broadcasted?.transactionId || broadcasted?.hash;
  if (!txId) throw new Error("Broadcast did not return txId");

  return { txId };
}
