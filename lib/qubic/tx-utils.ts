import { QubicTransaction } from '@qubic-lib/qubic-ts-library/dist/qubic-types/QubicTransaction';
import { PublicKey } from '@qubic-lib/qubic-ts-library/dist/qubic-types/PublicKey';
import { Long } from '@qubic-lib/qubic-ts-library/dist/qubic-types/Long';
import { DynamicPayload } from '@qubic-lib/qubic-ts-library/dist/qubic-types/DynamicPayload';
import { Signature } from '@qubic-lib/qubic-ts-library/dist/qubic-types/Signature';
import { PUBLIC_KEY_LENGTH, SIGNATURE_LENGTH } from '@qubic-lib/qubic-ts-library/dist/crypto';
import { QubicHelper } from '@qubic-lib/qubic-ts-library/dist/qubicHelper';
import { QubicDefinitions } from '@qubic-lib/qubic-ts-library/dist/QubicDefinitions';

const qHelper = new QubicHelper();

export function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  let binary = '';
  for (const byte of uint8Array) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

/** Rebuilds a QubicTransaction from raw signed bytes (used to hand a tx to WalletConnect for signing). */
export function decodeUint8ArrayTx(tx: Uint8Array): QubicTransaction {
  const newTx = new QubicTransaction();
  const inputSize =
    new DataView(tx.slice(PUBLIC_KEY_LENGTH * 2 + 14, PUBLIC_KEY_LENGTH * 2 + 16).buffer).getUint16(0, true) || 0;
  const payloadStart = PUBLIC_KEY_LENGTH * 2 + 16;
  const payloadEnd = payloadStart + inputSize;
  const signatureEnd = payloadEnd + SIGNATURE_LENGTH;

  newTx
    .setSourcePublicKey(new PublicKey(tx.slice(0, PUBLIC_KEY_LENGTH)))
    .setDestinationPublicKey(new PublicKey(tx.slice(PUBLIC_KEY_LENGTH, PUBLIC_KEY_LENGTH * 2)))
    .setAmount(new Long(tx.slice(PUBLIC_KEY_LENGTH * 2, PUBLIC_KEY_LENGTH * 2 + 8)))
    .setTick(new DataView(tx.slice(PUBLIC_KEY_LENGTH * 2 + 8, PUBLIC_KEY_LENGTH * 2 + 12).buffer).getUint32(0, true))
    .setInputType(
      new DataView(tx.slice(PUBLIC_KEY_LENGTH * 2 + 12, PUBLIC_KEY_LENGTH * 2 + 14).buffer).getUint16(0, true)
    )
    .setInputSize(inputSize);

  if (inputSize > 0) {
    const payload = new DynamicPayload(inputSize);
    payload.setPayload(tx.slice(payloadStart, payloadEnd));
    newTx.setPayload(payload);
  }
  newTx.signature = new Signature(tx.slice(payloadEnd, signatureEnd));
  return newTx;
}

type PayloadField =
  | { type: 'uint8' | 'uint16' | 'uint32'; data: number }
  | { type: 'bigint64'; data: number | bigint }
  | { type: 'id'; data: string | Uint8Array };

/** Packs typed fields (matching a contract's C++ input struct, in declaration order) into a DynamicPayload. */
export function createPayload(fields: PayloadField[]): DynamicPayload {
  const TYPE_SIZES = { uint8: 1, uint16: 2, uint32: 4, bigint64: 8, id: 32 } as const;
  const totalSize = fields.reduce((sum, f) => sum + TYPE_SIZES[f.type], 0);
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  let offset = 0;
  for (const field of fields) {
    switch (field.type) {
      case 'uint8':
        view.setUint8(offset, field.data);
        offset += 1;
        break;
      case 'uint16':
        view.setUint16(offset, field.data, true);
        offset += 2;
        break;
      case 'uint32':
        view.setUint32(offset, field.data, true);
        offset += 4;
        break;
      case 'bigint64':
        view.setBigUint64(offset, BigInt(field.data), true);
        offset += 8;
        break;
      case 'id': {
        const bytes =
          typeof field.data === 'string' ? qHelper.getIdentityBytes(field.data) : field.data;
        for (let i = 0; i < 32; i++) view.setUint8(offset + i, bytes[i] ?? 0);
        offset += 32;
        break;
      }
    }
  }

  const payload = new DynamicPayload(totalSize);
  payload.setPayload(new Uint8Array(buffer));
  return payload;
}

/** Derives a smart contract's synthetic identity from its numeric index (index becomes the first pubkey byte). */
export async function contractIdentity(contractIndex: number): Promise<string> {
  const destinationPublicKey = new Uint8Array(QubicDefinitions.PUBLIC_KEY_LENGTH);
  destinationPublicKey[0] = contractIndex;
  return qHelper.getIdentity(destinationPublicKey);
}

/**
 * Builds an unsigned smart-contract-call transaction. `amount` is the qu paid
 * with the call (the contract's `qpi.invocationReward()`) -- separate from any
 * asset transfer, which for QTREAT staking happens as its own QX transfer.
 */
export async function createSCTx(params: {
  sourceId: string;
  contractIndex: number;
  inputType: number;
  amount: number;
  tick: number;
  payload?: DynamicPayload;
}): Promise<QubicTransaction> {
  const { sourceId, contractIndex, inputType, amount, tick, payload } = params;
  const destinationId = await contractIdentity(contractIndex);
  const inputSize = payload ? payload.getPackageSize() : 0;

  const tx = new QubicTransaction()
    .setSourcePublicKey(sourceId)
    .setDestinationPublicKey(destinationId)
    .setAmount(amount)
    .setTick(tick)
    .setInputType(inputType)
    .setInputSize(inputSize);

  if (payload) tx.setPayload(payload);
  return tx;
}
