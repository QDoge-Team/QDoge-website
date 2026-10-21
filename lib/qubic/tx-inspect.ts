const HEADER_BYTES = 80;
const SIGNATURE_BYTES = 64;

export type SignedTxInfo = {
  length: number;
  /** Header (80) + payload + signature (64), computed from the tx's own inputSize. */
  expectedLength: number;
  tick: number;
  inputType: number;
  inputSize: number;
  amount: bigint;
  signatureIsZero: boolean;
};

/**
 * Reads the fixed-layout fields of a serialized Qubic transaction
 * (source 32, destination 32, amount 8, tick 4, inputType 2, inputSize 2,
 * payload, signature 64) so a bad wallet response can be caught before it is
 * broadcast. A node silently drops a transaction it can't validate, so an
 * unsigned or truncated one just never shows up.
 */
export function inspectSignedTx(bytes: Uint8Array): SignedTxInfo {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const hasHeader = bytes.length >= HEADER_BYTES;
  const inputSize = hasHeader ? view.getUint16(78, true) : 0;
  const signature = bytes.slice(Math.max(0, bytes.length - SIGNATURE_BYTES));
  return {
    length: bytes.length,
    expectedLength: HEADER_BYTES + inputSize + SIGNATURE_BYTES,
    tick: hasHeader ? view.getUint32(72, true) : 0,
    inputType: hasHeader ? view.getUint16(76, true) : 0,
    inputSize,
    amount: hasHeader ? view.getBigUint64(64, true) : BigInt(0),
    signatureIsZero: signature.length === 0 || signature.every((b) => b === 0),
  };
}
