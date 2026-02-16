/**
 * Generate QR code from a string
 * Client-side only - uses dynamic import
 */
export async function generateQRCode(text: string): Promise<string> {
  // Only run on client side
  if (typeof window === 'undefined') {
    return '';
  }
  
  try {
    // Dynamic import to ensure qrcode only loads on client side
    const QRCode = (await import('qrcode')).default;
    return await QRCode.toDataURL(text);
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

/**
 * Convert Uint8Array to base64
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decode Uint8Array transaction
 * Note: This is a simplified version. Adjust based on actual Qubic transaction structure
 */
export function decodeUint8ArrayTx(tx: Uint8Array | any): any {
  // If it's already a QubicTransaction object, return as is
  if (tx && typeof tx === 'object' && 'sourcePublicKey' in tx && 'destinationPublicKey' in tx) {
    return tx;
  }
  
  // Otherwise decode from Uint8Array
  if (!(tx instanceof Uint8Array)) {
    throw new Error('Invalid transaction format');
  }

  return {
    sourcePublicKey: { getIdentity: () => tx.slice(0, 32) },
    destinationPublicKey: { getIdentity: () => tx.slice(32, 64) },
    amount: { getNumber: () => {
      const amountBytes = tx.slice(64, 72);
      let amount = BigInt(0);
      for (let i = 0; i < 8; i++) {
        amount = (amount << BigInt(8)) | BigInt(amountBytes[i]);
      }
      return Number(amount);
    }},
    tick: new DataView(tx.buffer).getUint32(72, true),
    inputType: tx[76],
    payload: { getPackageData: () => tx.slice(77, tx.length - 64) }
  };
}
