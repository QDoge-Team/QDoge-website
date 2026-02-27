import { createContext, useContext, useEffect, useMemo, useCallback, useState } from "react";
import SignClient from "@walletconnect/sign-client";
import { WalletConnectAccount } from "./types/account";
import toast from "react-hot-toast";

interface WalletConnectContextType {
  signClient: SignClient | null;
  sessionTopic: string;
  isConnecting: boolean;
  isConnected: boolean;
  isReady: boolean;
  initError: string | null;
  connect: () => Promise<{ uri: string; approve: () => Promise<void> }>;
  disconnect: () => Promise<void>;
  requestAccounts: () => Promise<WalletConnectAccount[]>;
  sendQubic: (params: { from: string; to: string; amount: number }) => Promise<any>;
  signTransaction: (params: {
    from: string;
    to: string;
    amount: number;
    tick: number;
    inputType: number;
    payload: string | null;
  }) => Promise<any>;
  signMessage: (params: { from: string; message: string }) => Promise<any>;
}

const WalletConnectContext = createContext<WalletConnectContextType | undefined>(undefined);

interface WalletConnectProviderProps {
  children: React.ReactNode;
}

export function WalletConnectProvider({ children }: WalletConnectProviderProps) {
  const [signClient, setSignClient] = useState<SignClient | null>(null);
  const [sessionTopic, setSessionTopic] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [initError, setInitError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (initError) {
      throw new Error(initError);
    }
    if (!signClient) {
      throw new Error("WalletConnect not ready yet");
    }
    setIsConnecting(true);
    try {
      const { uri, approval } = await signClient.connect({
        requiredNamespaces: {
          qubic: {
            chains: ["qubic:mainnet"],
            methods: [
              "qubic_requestAccounts",
              "qubic_sendQubic",
              "qubic_sendAsset",
              "qubic_signTransaction",
              "qubic_sign",
            ],
            events: ["amountChanged", "assetAmountChanged", "accountsChanged"],
          },
        },
      });

      console.log("Generated URL:", uri);

      const approve = async () => {
        try {
          const session = await approval();
          console.log("Connection approved", session);
          setSessionTopic(session.topic);
          setIsConnected(true);
          localStorage.setItem("sessionTopic", session.topic);
        } catch (e) {
          console.error("Connection rejected:", e);
        }
      };

      return { uri: uri || "", approve };
    } catch (error) {
      console.error("Failed to connect:", error);
      toast.error("WalletConnect connection failed. Check console for details.");
      return { uri: "", approve: async () => {} };
    } finally {
      setIsConnecting(false);
    }
  }, [signClient]);

  const disconnect = useCallback(async () => {
    if (!signClient || !sessionTopic) return;

    try {
      await signClient.disconnect({
        topic: sessionTopic,
        reason: { code: 6000, message: "User disconnected" },
      });

      setSessionTopic("");
      setIsConnected(false);
      localStorage.removeItem("sessionTopic");
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  }, [signClient, sessionTopic]);

  const requestAccounts = useCallback(async () => {
    if (!signClient || !sessionTopic) throw new Error("Not connected");

    try {
      const result = await signClient.request({
        topic: sessionTopic,
        chainId: "qubic:mainnet",
        request: {
          method: "qubic_requestAccounts",
          params: {
            nonce: Date.now().toString(),
          },
        },
      });
      console.log("Requested accounts:", result);
      return result as WalletConnectAccount[];
    } catch (error) {
      console.error("Failed to request accounts:", error);
      throw error;
    }
  }, [signClient, sessionTopic]);

  const sendQubic = useCallback(async (params: { from: string; to: string; amount: number }) => {
    if (!signClient || !sessionTopic) throw new Error("Not connected");

    return await signClient.request({
      topic: sessionTopic,
      chainId: "qubic:mainnet",
      request: {
        method: "qubic_sendQubic",
        params: {
          ...params,
          nonce: Date.now().toString(),
        },
      },
    });
  }, [signClient, sessionTopic]);

  const signTransaction = useCallback(async (params: {
    from: string;
    to: string;
    amount: number;
    tick: number;
    inputType: number;
    payload: string | null;
  }) => {
    if (!signClient || !sessionTopic) throw new Error("Not connected");

    try {
      return await signClient.request({
        topic: sessionTopic,
        chainId: "qubic:mainnet",
        request: {
          method: "qubic_signTransaction",
          params: {
            from: params.from,
            to: params.to,
            amount: params.amount,
            inputType: params.inputType,
            payload: params.payload,
            nonce: Date.now().toString(),
          },
        },
      });
    } catch (error) {
      console.error("Failed to sign transaction:", error);
      throw error;
    }
  }, [signClient, sessionTopic]);

  const signMessage = useCallback(async (params: { from: string; message: string }) => {
    if (!signClient || !sessionTopic) throw new Error("Not connected");

    return await signClient.request({
      topic: sessionTopic,
      chainId: "qubic:mainnet",
      request: {
        method: "qubic_sign",
        params,
      },
    });
  }, [signClient, sessionTopic]);

  useEffect(() => {
    const metadataUrl =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "https://www.qxboard.com";

    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "05f3ef5522b55744ca04b03108e134a2";

    SignClient.init({
      projectId,
      metadata: {
        name: "QXBoard",
        description: "QXBoard",
        url: metadataUrl,
        icons: ["https://walletconnect.com/walletconnect-logo.png"],
      },
    }).then((client) => {
      setSignClient(client);
      setInitError(null);

      const storedTopic = localStorage.getItem("sessionTopic");
      if (storedTopic) {
        const session = client.session.get(storedTopic);
        if (session) {
          setSessionTopic(storedTopic);
          setIsConnected(true);
        } else {
          localStorage.removeItem("sessionTopic");
        }
      }

      client.on("session_delete", () => {
        setSessionTopic("");
        setIsConnected(false);
        localStorage.removeItem("sessionTopic");
      });

      client.on("session_expire", () => {
        setSessionTopic("");
        setIsConnected(false);
        localStorage.removeItem("sessionTopic");
      });

      // watch for transport errors (unauthorized origin etc.)
      // @ts-ignore: SignClient types don't include this event, but it is emitted by
      // older versions and useful for debugging origin/authorization issues.
      (client as any).on("transport_error", (err: any) => {
        console.error("WalletConnect transport error:", err);
        toast.error(`WalletConnect transport error: ${err?.message || err}`);
      });
    }).catch((error) => {
      console.error("WalletConnect init failed:", error);
      setInitError(error?.message || "WalletConnect initialization failed");
    });
  }, []);

  const contextValue = useMemo((): WalletConnectContextType => ({
    signClient,
    sessionTopic,
    isConnecting,
    isConnected,
    isReady: !!signClient && !initError,
    initError,
    connect,
    disconnect,
    requestAccounts,
    sendQubic,
    signTransaction,
    signMessage,
  }), [
    signClient,
    sessionTopic,
    isConnecting,
    isConnected,
    initError,
    connect,
    disconnect,
    requestAccounts,
    sendQubic,
    signTransaction,
    signMessage,
  ]);

  return <WalletConnectContext.Provider value={contextValue}>{children}</WalletConnectContext.Provider>;
}

export function useWalletConnect() {
  const context = useContext(WalletConnectContext);
  if (!context) {
    throw new Error("useWalletConnect must be used within a WalletConnectProvider");
  }
  return context;
}
