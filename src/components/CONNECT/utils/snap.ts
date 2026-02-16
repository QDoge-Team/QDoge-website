import type { MetaMaskInpageProvider } from "@metamask/providers";

import { defaultSnapOrigin } from "../config";
import type { GetSnapsResponse, Snap } from "../types";

/**
 * Get the installed snaps in MetaMask.
 *
 * @param provider - The MetaMask inpage provider.
 * @returns The snaps installed in MetaMask.
 */
export const getSnaps = async (provider?: MetaMaskInpageProvider): Promise<GetSnapsResponse> => {
  if (typeof window === "undefined") {
    throw new Error("Window is not available");
  }
  const ethereumProvider = provider ?? window.ethereum;
  if (!ethereumProvider) {
    throw new Error("Ethereum provider is not available");
  }
  return (await ethereumProvider.request({
    method: "wallet_getSnaps",
  })) as unknown as GetSnapsResponse;
};

/**
 * Connect a snap to MetaMask.
 *
 * @param snapId - The ID of the snap.
 * @param params - The params to pass with the snap to connect.
 */
export const connectSnap = async (
  snapId: string = defaultSnapOrigin,
  params: Record<"version" | string, unknown> = {},
) => {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("Ethereum provider is not available");
  }
  await window.ethereum.request({
    method: "wallet_requestSnaps",
    params: {
      [snapId]: params,
    },
  });
};

/**
 * Get the snap from MetaMask.
 *
 * @param version - The version of the snap to install (optional).
 * @returns The snap object returned by the extension.
 */
export const getSnap = async (version?: string): Promise<Snap | undefined> => {
  try {
    const snaps = await getSnaps();

    return Object.values(snaps).find((snap) => snap.id === defaultSnapOrigin && (!version || snap.version === version));
  } catch (error) {
    console.log("Failed to obtain installed snap", error);
    return undefined;
  }
};

export const isLocalSnap = (snapId: string) => snapId.startsWith("local:");

/**
 * Attempt to remove/disable a snap from MetaMask.
 * Note: MetaMask may not support programmatic snap removal for security reasons.
 * This function tries multiple methods but may not fully remove the snap.
 * 
 * @param snapId - The ID of the snap to remove.
 * @returns True if any removal method succeeded, false otherwise.
 */
export const removeSnap = async (snapId: string = defaultSnapOrigin): Promise<boolean> => {
  if (typeof window === "undefined" || !window.ethereum) {
    return false;
  }

  try {
    // Method 1: Try to revoke permissions
    try {
      await window.ethereum.request({
        method: "wallet_revokePermissions",
        params: [
          {
            id: snapId,
          },
        ],
      });
      console.log("Snap permissions revoked");
      return true;
    } catch (error) {
      console.log("Permission revocation method not available:", error);
    }

    // Method 2: Try to disable snap (if API exists)
    try {
      await window.ethereum.request({
        method: "wallet_disableSnap",
        params: [snapId],
      });
      console.log("Snap disabled");
      return true;
    } catch (error) {
      console.log("Disable snap method not available:", error);
    }

    // Method 3: Try to remove snap (if API exists)
    try {
      await window.ethereum.request({
        method: "wallet_removeSnap",
        params: [snapId],
      });
      console.log("Snap removed");
      return true;
    } catch (error) {
      console.log("Remove snap method not available:", error);
    }

    return false;
  } catch (error) {
    console.error("Error attempting to remove snap:", error);
    return false;
  }
};
