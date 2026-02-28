import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { MetamaskActions, MetaMaskContext } from "./MetamaskContext";
import { connectTypes, defaultSnapOrigin } from "./config";
import { useWalletConnect } from "./WalletConnectContext";
import { getSnap, connectSnap, removeSnap } from "./utils/snap";
import { transferViaSnap } from "./utils/transferViaSnap";
import { useAtom } from "jotai";
import { balancesAtom, walletBalancesAtom, WalletBalances } from "@/store/balances";
import toast from "react-hot-toast";
import axiosServices from "@/util/axios";
import { QUBIC_EXPLORER_URL } from "@/config";

interface Wallet {
  connectType: string;
  publicKey: string;
  alias?: string;
  privateKey?: string;
}

interface QubicConnectContextType {
  connected: boolean;
  wallet: Wallet | null;
  walletReady: boolean;
  showConnectModal: boolean;
  walletBalances: WalletBalances;
  fetchBalance: () => Promise<void>;
  setBalanceUpdatesPaused: (paused: boolean) => void;
  connect: (wallet: Wallet) => void;
  disconnect: () => Promise<void>;
  toggleConnectModal: (next?: boolean) => void;
  getMetaMaskPublicId: (accountIdx?: number, confirm?: boolean) => Promise<string>;
  getSignedTx: (tx: any) => Promise<{ tx: Uint8Array }>;
  transfer: (to: string, amount: number) => Promise<{ txId: string }>;
  waitForTxConfirmation: (txId: string, maxAttempts?: number, intervalMs?: number) => Promise<boolean>;
  mmSnapConnect: () => Promise<void>;
  privateKeyConnect: (privateSeed: string) => Promise<void>;
  vaultFileConnect: (selectedFile: File, password: string) => Promise<any>;
}

const QubicConnectContext = createContext<QubicConnectContextType | undefined>(undefined);

interface QubicConnectProviderProps {
  children: React.ReactNode;
}

export function QubicConnectProvider({ children }: QubicConnectProviderProps) {
  const [connected, setConnected] = useState<boolean>(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [walletReady, setWalletReady] = useState<boolean>(false);
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);
  const balanceUpdatesPausedRef = useRef(false);
  const walletConnectHook = useWalletConnect();
  const [state, dispatch] = useContext(MetaMaskContext);
  const [, setBalances] = useAtom(balancesAtom);
  const [walletBalances, setWalletBalances] = useAtom(walletBalancesAtom);

  // Helper function to get MetaMask public ID (defined early for use in useEffect)
  const getMetaMaskPublicIdHelper = useCallback(async (accountIdx: number = 0, confirm: boolean = false): Promise<string> => {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask is not available");
    }
    return await window.ethereum.request({
      method: "wallet_invokeSnap",
      params: {
        snapId: defaultSnapOrigin,
        request: {
          method: "getPublicId",
          params: {
            accountIdx,
            confirm,
          },
        },
      },
    });
  }, []);

  // Load wallet from localStorage on mount and verify connection
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    
    if (typeof window === "undefined") return;
    
    const loadAndVerifyWallet = async () => {
      try {
      // Wait a bit for MetaMask to be ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const storedWallet = localStorage.getItem("wallet");
      if (storedWallet) {
        try {
          const parsedWallet = JSON.parse(storedWallet);
          
          // Verify connection based on wallet type
          if (parsedWallet.connectType === "mmSnap") {
            try {
              // First, restore the wallet state optimistically
              setWallet(parsedWallet);
              setConnected(true);
              console.log("Wallet state restored (verifying connection...)");
              
              // Then verify connection in the background
              try {
                // Verify MetaMask Snap is still connected
                const installedSnap = await getSnap();
                if (installedSnap && installedSnap.id === defaultSnapOrigin) {
                  // Try to get public key to verify and update
                  try {
                    const publicKey = await getMetaMaskPublicIdHelper(0, false);
                    if (publicKey) {
                      // Update wallet with current public key
                      const updatedWallet = { ...parsedWallet, publicKey };
                      setWallet(updatedWallet);
                      if (typeof window !== "undefined") {
                        localStorage.setItem("wallet", JSON.stringify(updatedWallet));
                      }
                      dispatch({
                        type: MetamaskActions.SetInstalled,
                        payload: installedSnap,
                      });
                      console.log("Wallet connection verified and updated");
                      return;
                    }
                  } catch (error) {
                    console.warn("Could not get public key, but snap is installed:", error);
                  }
                  
                  // Snap is installed, just update the context
                  dispatch({
                    type: MetamaskActions.SetInstalled,
                    payload: installedSnap,
                  });
                  console.log("Wallet restored (snap verified but public key not available)");
                  return;
                } else {
                  // Snap not found - check if MetaMask is available and retry once
                  if (typeof window !== "undefined" && window.ethereum) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    const retrySnap = await getSnap();
                    if (retrySnap && retrySnap.id === defaultSnapOrigin) {
                      dispatch({
                        type: MetamaskActions.SetInstalled,
                        payload: retrySnap,
                      });
                      console.log("Wallet restored (snap found on retry)");
                      return;
                    }
                  }
                  // Snap really not found - clear wallet
                  console.log("MetaMask Snap not found, clearing stored wallet");
                  setWallet(null);
                  setConnected(false);
                  localStorage.removeItem("wallet");
                }
              } catch (error) {
                console.warn("Error verifying MetaMask connection, keeping wallet state:", error);
                // Keep the wallet state even if verification fails
                // The user can manually disconnect if needed
              }
            } catch (error) {
              console.error("Error during wallet restoration:", error);
              // On error, still try to restore - better UX
              console.log("Restoring wallet despite verification error");
            }
          } else {
            // For other connection types, just restore from localStorage
            setWallet(parsedWallet);
            setConnected(true);
            console.log("Wallet restored from localStorage");
          }
        } catch (error) {
          console.error("Failed to parse stored wallet:", error);
          localStorage.removeItem("wallet");
        }
      }
      } finally {
        setWalletReady(true);
      }
    };
    
    loadAndVerifyWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount - dispatch is stable from MetaMaskProvider

  // if there was an existing WalletConnect session (signClient) which is connected but our
  // context hasn't yet marked the wallet as connected, automatically fetch an account
  // and call our connect() helper so downstream consumers see a valid wallet object.
  useEffect(() => {
    if (!connected && walletConnectHook.isConnected) {
      (async () => {
        try {
          const accs = await walletConnectHook.requestAccounts();
          if (accs && accs.length > 0) {
            const first = accs[0];
            connect({
              connectType: "walletconnect",
              publicKey: first.address,
              alias: first.name,
            });
            toast.success(`Wallet reconnected: ${first.address.slice(0,8)}...${first.address.slice(-8)}`);
          }
        } catch (err) {
          console.error("Auto-connect from WalletConnect session failed:", err);
        }
      })();
    }
  }, [connected, walletConnectHook.isConnected, walletConnectHook]);

  // Track consecutive balance-fetch failures to throttle logging
  const balanceFetchFailCountRef = useRef(0);

  // Fetch wallet balance directly from wallet connection (not from backend)
  const fetchBalance = useCallback(async (): Promise<void> => {
    if (!wallet?.publicKey) {
      setWalletBalances({ qubic: 0, qdoge: 0 });
      return;
    }
    if (balanceUpdatesPausedRef.current) {
      return;
    }

    try {
      // Always use backend API for balance fetching (most reliable)
      const response = await axiosServices.get(`/wallet/balance/${wallet.publicKey}`);
      
      if (response && response.data) {
        const qubicBalance = Math.floor(response.data.qubic || 0);
        const qdogeBalance = Math.floor(response.data.qdoge || 0);
        
        // Only log on recovery or first success
        if (balanceFetchFailCountRef.current > 0) {
          console.log(`Balance fetch recovered after ${balanceFetchFailCountRef.current} failure(s): QU=${qubicBalance}, QDoge=${qdogeBalance}`);
        }
        balanceFetchFailCountRef.current = 0;
        
        setWalletBalances({
          qubic: qubicBalance,
          qdoge: qdogeBalance,
        });
      } else {
        console.warn("Empty or invalid response from balance API");
        setWalletBalances({ qubic: 0, qdoge: 0 });
      }
    } catch (error: any) {
      balanceFetchFailCountRef.current++;
      const failCount = balanceFetchFailCountRef.current;
      
      // Only log the first failure and then every 10th to avoid console spam
      if (failCount === 1) {
        const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || "Unknown error";
        console.warn("Balance fetch failed (will retry silently):", errorMessage);
      } else if (failCount % 10 === 0) {
        console.warn(`Balance fetch still failing after ${failCount} attempts`);
      }
      // Keep previous balances on error instead of resetting to 0
    }
  }, [wallet?.publicKey, setWalletBalances]);

  const setBalanceUpdatesPaused = useCallback((paused: boolean): void => {
    balanceUpdatesPausedRef.current = paused;
  }, []);

  const connect = useCallback((wallet: Wallet): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem("wallet", JSON.stringify(wallet));
    }
    setWallet(wallet);
    setConnected(true);
    console.log("Wallet connected:", wallet);
    // Fetch balance after connection
    setTimeout(() => {
      if (wallet.publicKey) {
        fetchBalance();
      }
    }, 500);
  }, [fetchBalance]);

  const disconnect = useCallback(async (): Promise<void> => {
    try {
      const walletType = wallet?.connectType;
      toast.loading("Disconnecting wallet...", { id: "disconnect" });
      
      // Disconnect based on wallet type
      if (walletType === "mmSnap") {
        try {
          // Attempt to remove/disable the snap
          const removed = await removeSnap(defaultSnapOrigin);
          if (removed) {
            console.log("MetaMask Snap removed/disabled successfully");
          } else {
            console.log("Note: MetaMask Snap could not be programmatically removed. This is normal - the snap remains in MetaMask but is disconnected from this app.");
          }
        } catch (error) {
          console.warn("Error during MetaMask Snap removal attempt:", error);
        }
      } else if (walletType === "walletconnect") {
        try {
          // Disconnect WalletConnect session
          await walletConnectHook.disconnect();
        } catch (error) {
          console.warn("Error disconnecting WalletConnect:", error);
        }
      }
      
      // Clear ALL local state
      if (typeof window !== "undefined") {
        localStorage.removeItem("wallet");
        // Also clear any snap-related data
        localStorage.removeItem("snapState");
        localStorage.removeItem("qubicWallet");
      }
      
      const disconnectedWallet = wallet;
      
      // Clear state immediately
      setWallet(null);
      setConnected(false);
      setBalances([]);
      setWalletBalances({ qubic: 0, qdoge: 0 });
      
      // Reset MetaMask context state completely
      // Note: The snap may still exist in MetaMask, but we clear our app's connection to it
      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: undefined,
      });
      
      toast.success("Wallet disconnected successfully!", { id: "disconnect", duration: 3000 });
      console.log("Wallet disconnected:", disconnectedWallet);
      
      // Small delay to ensure state updates propagate before UI re-renders
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error("Error during disconnect:", error);
      
      // Still clear local state even if disconnect fails
      if (typeof window !== "undefined") {
        localStorage.removeItem("wallet");
        localStorage.removeItem("snapState");
        localStorage.removeItem("qubicWallet");
      }
      setWallet(null);
      setConnected(false);
      setBalances([]);
      
      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: undefined,
      });
      
      toast.error("Wallet disconnected (local state cleared)", { id: "disconnect" });
    }
  }, [dispatch, setBalances, setWalletBalances, wallet?.connectType, walletConnectHook]);

  const toggleConnectModal = useCallback((next?: boolean): void => {
    setShowConnectModal(prev => (typeof next === "boolean" ? next : !prev));
  }, []);

  const getMetaMaskPublicId = getMetaMaskPublicIdHelper;

  const getSignedTx = useCallback(async (tx: any): Promise<{ tx: Uint8Array }> => {
    if (!wallet || !connectTypes.includes(wallet.connectType)) {
      throw new Error(`Unsupported connectType: ${wallet?.connectType}`);
    }

    // Simplified transaction signing - adjust based on actual Qubic transaction structure
    if (wallet.connectType === "walletconnect") {
      try {
        // Decode transaction to extract details
        const { decodeUint8ArrayTx, base64ToUint8Array } = await import("@/utils");
        const decodedTx = decodeUint8ArrayTx(tx);
        
        // Handle wallet connect signing
        toast("Sign the transaction in your wallet", {
          icon: "🔑",
        });
        
        const result = await walletConnectHook.signTransaction({
          from: wallet.publicKey,
          to: decodedTx.destinationPublicKey?.getIdentity?.() || "",
          amount: decodedTx.amount?.getNumber?.() || 0,
          tick: decodedTx.tick || 0,
          inputType: decodedTx.inputType || 0,
          payload: decodedTx.payload?.getPackageData?.() || null,
        });
        
        return { tx: base64ToUint8Array(result.signedTransaction || "") };
      } catch (error) {
        console.error("Error signing transaction:", error);
        toast.error("Failed to sign transaction. Please ensure QUBIC libraries are installed.");
        throw error;
      }
    }

    // For other connection types, implement signing logic here
    // Note: Full implementation requires @qubic-lib/qubic-ts-library
    throw new Error("Transaction signing requires QUBIC libraries. Please install @qubic-lib/qubic-ts-library when available.");
  }, [wallet, walletConnectHook]);

  /**
   * Poll transaction status until confirmed on-chain
   * @param txId - Transaction ID to check
   * @param maxAttempts - Maximum number of polling attempts (default: 20)
   * @param intervalMs - Interval between polls in milliseconds (default: 1000)
   * @returns true if confirmed, false if timeout
   */
  const waitForTransactionConfirmation = useCallback(async (
    txId: string,
    maxAttempts: number = 20,
    intervalMs: number = 1000
  ): Promise<boolean> => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await axiosServices.get(`/tx/status/${txId}`);
        
        // Check if transaction is confirmed
        // Different explorers/RPCs may return different response formats
        if (response?.data) {
          const data = response.data;

          const status = String(data.status || "").toLowerCase();
          const confirmations = Number(data.confirmations || 0);

          if (status.includes("pending") || status.includes("unknown") || status.includes("unconfirmed")) {
            // keep polling
          } else if (
            status === "confirmed" ||
            status === "success" ||
            data.confirmed === true ||
            data.executed === true ||
            confirmations > 0
          ) {
            return true;
          } else if (data.transactionId || data.id || data.hash || data.transaction) {
            // If the tx is visible in status lookup, treat as confirmed
            return true;
          }
        }
      } catch (error: any) {
        // 404 means transaction not found yet - continue polling
        if (error?.response?.status === 404) {
          // Transaction not found yet, continue polling
        } else {
          // Other errors - log but continue polling
          console.warn(`Error checking transaction status (attempt ${attempt + 1}):`, error?.message);
        }
      }
      
      // Wait before next attempt (except on last attempt)
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }
    
    return false; // Timeout - transaction not confirmed within maxAttempts
  }, []);

  /**
   * Transfer QUBIC tokens to a recipient address
   * @param to - Recipient public ID (60-character Qubic identity)
   * @param amount - Amount to transfer (integer)
   * @returns Transaction ID
   */
  const transfer = useCallback(async (to: string, amount: number): Promise<{ txId: string }> => {
    if (!wallet || !connected) {
      throw new Error("Wallet not connected");
    }

    const amountInt = Math.floor(amount);
    if (!Number.isInteger(amountInt) || amountInt <= 0) {
      throw new Error("Invalid transfer amount (must be positive integer)");
    }

    const normalizedTo = to.trim().toUpperCase();
    if (!/^[A-Z]{60}$/.test(normalizedTo)) {
      throw new Error(`Invalid recipient address (must be exactly 60 uppercase A-Z characters). Got: ${normalizedTo.length} characters: ${normalizedTo}`);
    }

    try {
      let txId: string;
      
      if (wallet.connectType === "walletconnect") {
        toast.loading("Signing transaction in your wallet...", { id: "transfer" });
        
        const result = await walletConnectHook.sendQubic({
          from: wallet.publicKey,
          to: to.trim().toUpperCase(),
          amount: amountInt,
        });

        // Only use real transaction IDs from the wallet response
        // DO NOT generate fake txIds - throw error if missing
        txId = result?.txId || result?.transactionId || result?.hash;
        
        if (!txId) {
          throw new Error('WalletConnect did not return a transaction ID');
        }
      } else if (wallet.connectType === "mmSnap") {
        // MetaMask Snap - Use proper signing flow: build → sign → broadcast
        toast.loading("Preparing transaction...", { id: "transfer" });
        
        try {
          const result = await transferViaSnap({
            fromPublicId: wallet.publicKey,
            toPublicId: normalizedTo,
            amount: amountInt,
            asset: "QU",
          });

          txId = result.txId;
        } catch (error: any) {
          console.error("MetaMask Snap transfer error:", error);
          
          // Check for 4200 error (Snaps not supported)
          if (error?.code === 4200 || error?.message?.includes("4200")) {
            toast.error(
              "Snaps are not supported. Use MetaMask browser extension with Snaps support (MetaMask Flask for dev).",
              { id: "transfer", duration: 8000 }
            );
          } else {
            toast.error(`Transfer failed: ${error?.message || "Unknown error"}`, { id: "transfer" });
          }
          throw error;
        }
      } else {
        throw new Error(`Transfer not supported for wallet type: ${wallet.connectType}`);
      }

      const toastId = `transfer-${txId}`;
      toast.dismiss("transfer");

      // Show pending notification with Explorer link
      toast.loading(
        <div>
          <div>Transaction submitted. Waiting for confirmation...</div>
          <a
            href={`${QUBIC_EXPLORER_URL}${txId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View on Explorer
          </a>
        </div>,
        { id: toastId }
      );

      const confirmed = await waitForTransactionConfirmation(txId, 30, 1000); // Poll up to 30 seconds

      if (confirmed) {
        // Refresh balance only after confirmation
        if (wallet.publicKey) {
          await fetchBalance();
        }

        toast.success(
          <div>
            Transaction confirmed!{" "}
            <a
              href={`${QUBIC_EXPLORER_URL}${txId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View on Explorer
            </a>
          </div>,
          { id: toastId, duration: 8000 }
        );
      } else {
        // Transaction not confirmed within timeout, leave as pending and continue polling
        toast(
          <div>
            <div>Transaction submitted (pending confirmation)</div>
            <a
              href={`${QUBIC_EXPLORER_URL}${txId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View on Explorer
            </a>
          </div>,
          { id: toastId, duration: 8000, icon: "⏳" }
        );

        (async () => {
          const confirmedLater = await waitForTransactionConfirmation(txId, 300, 1000);
          if (confirmedLater) {
            if (wallet.publicKey) {
              await fetchBalance();
            }
            toast.success(
              <div>
                Transaction confirmed!{" "}
                <a
                  href={`${QUBIC_EXPLORER_URL}${txId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  View on Explorer
                </a>
              </div>,
              { id: toastId, duration: 8000 }
            );
          }
        })();
      }
      
      return { txId };
    } catch (error: any) {
      console.error("Transfer error:", error);
      toast.error(`Transfer failed: ${error?.message || "Unknown error"}`, { id: "transfer" });
      throw error;
    }
  }, [connected, fetchBalance, wallet, walletConnectHook, waitForTransactionConfirmation]);

  const mmSnapConnect = useCallback(async () => {
    try {
      toast.loading("Connecting to MetaMask Snap...", { id: "mm-connect" });
      
      // First, ensure snap detection is enabled
      if (!state.snapsDetected) {
        const { detectSnaps } = await import("./utils/metamask");
        const detected = await detectSnaps();
        dispatch({
          type: MetamaskActions.SetSnapsDetected,
          payload: detected,
        });
        if (!detected) {
          throw new Error("MetaMask Snaps are not available. Please ensure you're using MetaMask Flask or a compatible version.");
        }
      }
      
      // Check if snap is already installed
      let installedSnap = await getSnap();
      
      if (!installedSnap) {
        // Snap not installed, request installation/connection
        console.log("Requesting MetaMask Snap installation...");
        await connectSnap(!state.isFlask ? "npm:@qubic-lib/qubic-mm-snap" : undefined);
        
        // Verify installation
        installedSnap = await getSnap();
        
        if (!installedSnap) {
          throw new Error("Failed to install MetaMask Snap. Please check MetaMask and try again.");
        }
        console.log("MetaMask Snap installed successfully");
      } else {
        console.log("MetaMask Snap already installed, reconnecting to existing snap...");
      }
      
      // Get publicId from snap (this will reconnect/re-authenticate)
      // This may prompt the user in MetaMask
      const publicKey = await getMetaMaskPublicId(0, true);
      
      if (!publicKey || publicKey.trim() === "") {
        throw new Error("Failed to get public key from MetaMask Snap. Please try again.");
      }
      
      const wallet = {
        connectType: "mmSnap",
        publicKey,
      };
      
      // Save wallet state
      connect(wallet);
      
      // Update MetaMask context to reflect connection
      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: installedSnap,
      });
      dispatch({
        type: MetamaskActions.SetSnapsDetected,
        payload: true,
      });
      
      toast.success(`Wallet connected: ${publicKey.slice(0, 8)}...${publicKey.slice(-8)}`, { id: "mm-connect" });
      console.log("MetaMask Snap connected successfully:", publicKey);
    } catch (error: any) {
      console.error("Error connecting to MetaMask Snap:", error);
      const errorMessage = error?.message || error?.toString() || "Failed to connect to MetaMask Snap";
      toast.error(errorMessage, { id: "mm-connect", duration: 5000 });
      dispatch({
        type: MetamaskActions.SetError,
        payload: error,
      });
      throw error;
    }
  }, [connect, dispatch, getMetaMaskPublicId, state.isFlask, state.snapsDetected]);

  const privateKeyConnect = useCallback(async (privateSeed: string) => {
    // Note: Full implementation requires @qubic-lib/qubic-ts-library
    // For now, we'll use a simplified version that stores the private key
    // In production, you should use QubicHelper to generate public key from private seed
    try {
      // Basic validation
      if (privateSeed.length !== 55) {
        throw new Error("Private seed must be 55 characters long");
      }
      
      // For now, create a basic wallet object
      // TODO: When QUBIC libraries are available, use QubicHelper to generate publicKey
      connect({
        connectType: "privateKey",
        privateKey: privateSeed,
        publicKey: "NOT_IMPLEMENTED_YET", // Will be generated when QUBIC libraries are available
      });
      
      toast.success("Wallet connected (basic mode - full functionality requires QUBIC libraries)");
    } catch (error: any) {
      toast.error(error.message || "Failed to connect with private key");
      throw error;
    }
  }, [connect]);

  const vaultFileConnect = useCallback(async (selectedFile: File, password: string): Promise<any> => {
    // Simplified vault file handling
    // You'll need to implement proper QubicVault import and unlock
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = async () => {
        try {
          // Implement vault unlock logic here
          resolve({ getSeeds: () => [] });
        } catch (error) {
          console.error("Error unlocking vault:", error);
          reject(error);
        }
      };
      fileReader.onerror = (error) => {
        console.error("Error reading file:", error);
        reject(error);
      };
      fileReader.readAsArrayBuffer(selectedFile);
    });
  }, []);

  // Auto-fetch balance when wallet is connected
  useEffect(() => {
    if (connected && wallet?.publicKey) {
      fetchBalance();
      // Refresh balance every 30 seconds
      const interval = setInterval(fetchBalance, 30000);
      return () => clearInterval(interval);
    } else {
      setWalletBalances({ qubic: 0, qdoge: 0 });
    }
  }, [connected, wallet?.publicKey]);

  const contextValue = useMemo((): QubicConnectContextType => ({
    connected,
    wallet,
    walletReady,
    showConnectModal,
    walletBalances,
    fetchBalance,
    setBalanceUpdatesPaused,
    connect,
    disconnect,
    toggleConnectModal,
    getMetaMaskPublicId,
    getSignedTx,
    transfer,
    waitForTxConfirmation: waitForTransactionConfirmation,
    mmSnapConnect,
    privateKeyConnect,
    vaultFileConnect,
  }), [
    connected,
    wallet,
    walletReady,
    showConnectModal,
    walletBalances,
    fetchBalance,
    setBalanceUpdatesPaused,
    connect,
    disconnect,
    toggleConnectModal,
    getMetaMaskPublicId,
    getSignedTx,
    transfer,
    mmSnapConnect,
    privateKeyConnect,
    vaultFileConnect,
  ]);

  return (
    <QubicConnectContext.Provider value={contextValue}>{children}</QubicConnectContext.Provider>
  );
}

export function useQubicConnect(): QubicConnectContextType {
  const context = useContext(QubicConnectContext);
  if (context === undefined) {
    throw new Error("useQubicConnect() hook must be used within a <QubicConnectProvider>");
  }
  return context;
}
