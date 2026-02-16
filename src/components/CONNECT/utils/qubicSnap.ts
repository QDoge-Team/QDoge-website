/**
 * Qubic MetaMask Snap Utility
 * Handles MetaMask Snap installation and invocation
 */

export const QUBIC_SNAP_ID = "npm:@qubic-lib/qubic-mm-snap";

type SnapRequest = { method: string; params?: Record<string, any> };

function getEthereum() {
  if (typeof window === "undefined") {
    throw new Error("Snap calls must run in the browser (window is undefined).");
  }
  const eth = (window as any).ethereum;
  if (!eth?.request) {
    throw new Error("MetaMask not found (window.ethereum is missing).");
  }
  return eth;
}

/**
 * Request Qubic Snap installation/permission
 */
export async function requestQubicSnap(): Promise<void> {
  const ethereum = getEthereum();
  
  await ethereum.request({
    method: "wallet_requestSnaps",
    params: {
      [QUBIC_SNAP_ID]: {},
    },
  });
}

/**
 * Invoke a method on the Qubic Snap
 * IMPORTANT: params MUST be an object: { snapId, request }
 * Common mistake: using array [ { snapId, request } ] causes -32000 Invalid input
 */
export async function invokeQubicSnap<T = any>(request: SnapRequest): Promise<T> {
  const ethereum = getEthereum();
  
  // IMPORTANT: params MUST be an object: { snapId, request }
  return (await ethereum.request({
    method: "wallet_invokeSnap",
    params: {
      snapId: QUBIC_SNAP_ID,
      request,
    },
  })) as T;
}

// Export alias for compatibility
export const ensureSnapInstalled = requestQubicSnap;
export const ensureQubicSnapInstalled = requestQubicSnap;
export const invokeSnap = invokeQubicSnap;
