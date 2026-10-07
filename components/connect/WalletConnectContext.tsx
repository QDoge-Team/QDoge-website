'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import SignClient from '@walletconnect/sign-client';

type WalletConnectAccount = { address: string; name?: string };

interface WalletConnectContextType {
  isConnecting: boolean;
  isConnected: boolean;
  connect: () => Promise<{ uri: string; approve: () => Promise<void> }>;
  disconnect: () => Promise<void>;
  requestAccounts: () => Promise<WalletConnectAccount[]>;
  signTransaction: (params: {
    from: string;
    to: string;
    amount: number;
    tick: number;
    inputType: number;
    payload: string | null;
  }) => Promise<{ signedTransaction: string }>;
}

const WalletConnectContext = createContext<WalletConnectContextType | undefined>(undefined);

/**
 * WalletConnect Cloud project ID. Ported from Qraffle's own module as a
 * working placeholder -- get a free project ID for this site's own domain at
 * cloud.walletconnect.com and swap it in before relying on this in production,
 * since Qraffle's ID is registered to their app identity/domain, not ours.
 */
const WALLETCONNECT_PROJECT_ID = '5e3a92826e48cede45276c0cb1a1be79';

const CLIENT_READY_TIMEOUT_MS = 20_000;

/**
 * Mobile browsers freeze a backgrounded tab's websocket (e.g. while the user
 * is in the wallet app approving). Restart the relay transport if it didn't
 * survive, otherwise approvals and signatures never arrive.
 */
async function ensureRelayConnected(client: SignClient) {
  if (client.core.relayer.connected) return;
  try {
    await client.core.relayer.restartTransport();
  } catch (err) {
    console.error('WalletConnect relay reconnect failed:', err);
  }
}

export function WalletConnectProvider({ children }: { children: ReactNode }) {
  const [signClient, setSignClient] = useState<SignClient | null>(null);
  const [sessionTopic, setSessionTopic] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const clientPromiseRef = useRef<Promise<SignClient> | null>(null);

  useEffect(() => {
    const initPromise = SignClient.init({
      projectId: WALLETCONNECT_PROJECT_ID,
      metadata: {
        name: 'QDOGE',
        description: 'QDoge QTREAT Staking',
        url: 'https://qdogeonqubic.com',
        icons: ['https://qdogeonqubic.com/logo.png'],
      },
    });
    clientPromiseRef.current = initPromise;
    initPromise.then((client) => {
      setSignClient(client);
      const storedTopic = localStorage.getItem('qtreatStakingSessionTopic');
      if (storedTopic) {
        try {
          client.session.get(storedTopic);
          setSessionTopic(storedTopic);
          setIsConnected(true);
        } catch {
          localStorage.removeItem('qtreatStakingSessionTopic');
        }
      }
      client.on('session_delete', () => {
        setSessionTopic('');
        setIsConnected(false);
        localStorage.removeItem('qtreatStakingSessionTopic');
      });
      client.on('session_expire', () => {
        setSessionTopic('');
        setIsConnected(false);
        localStorage.removeItem('qtreatStakingSessionTopic');
      });
    }).catch((err) => {
      console.error('WalletConnect failed to initialize:', err);
    });
  }, []);

  useEffect(() => {
    if (!signClient) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') void ensureRelayConnected(signClient);
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onVisible);
    };
  }, [signClient]);

  const getActiveSession = () => {
    const effectiveTopic = sessionTopic || localStorage.getItem('qtreatStakingSessionTopic') || '';
    if (!signClient || !effectiveTopic) {
      throw new Error('WalletConnect not connected. Please reconnect your wallet.');
    }
    try {
      signClient.session.get(effectiveTopic);
    } catch {
      localStorage.removeItem('qtreatStakingSessionTopic');
      setSessionTopic('');
      setIsConnected(false);
      throw new Error('WalletConnect session expired. Please reconnect your wallet.');
    }
    return { client: signClient, topic: effectiveTopic };
  };

  const connect = async (): Promise<{ uri: string; approve: () => Promise<void> }> => {
    setIsConnecting(true);
    try {
      // A tap on "WalletConnect" can land before init finishes (slow mobile
      // network) -- wait for it rather than handing back an empty link.
      const client =
        signClient ??
        (await Promise.race([
          clientPromiseRef.current,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), CLIENT_READY_TIMEOUT_MS)),
        ]));
      if (!client) throw new Error('WalletConnect is not ready yet. Check your connection and try again.');
      await ensureRelayConnected(client);
      const { uri, approval } = await client.connect({
        requiredNamespaces: {
          qubic: {
            chains: ['qubic:mainnet'],
            methods: ['qubic_requestAccounts', 'qubic_signTransaction', 'qubic_sign'],
            events: ['accountsChanged'],
          },
        },
      });
      const approve = async () => {
        const session = await approval();
        setSessionTopic(session.topic);
        setIsConnected(true);
        localStorage.setItem('qtreatStakingSessionTopic', session.topic);
      };
      return { uri: uri ?? '', approve };
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    if (!signClient || !sessionTopic) return;
    try {
      await signClient.disconnect({ topic: sessionTopic, reason: { code: 6000, message: 'User disconnected' } });
    } finally {
      setSessionTopic('');
      setIsConnected(false);
      localStorage.removeItem('qtreatStakingSessionTopic');
    }
  };

  const requestAccounts = async (): Promise<WalletConnectAccount[]> => {
    const { client, topic } = getActiveSession();
    await ensureRelayConnected(client);
    return client.request({
      topic,
      chainId: 'qubic:mainnet',
      request: { method: 'qubic_requestAccounts', params: { nonce: Date.now().toString() } },
    }) as Promise<WalletConnectAccount[]>;
  };

  const signTransaction: WalletConnectContextType['signTransaction'] = async (params) => {
    const { client, topic } = getActiveSession();
    await ensureRelayConnected(client);
    return client.request({
      topic,
      chainId: 'qubic:mainnet',
      request: {
        method: 'qubic_signTransaction',
        params: { ...params, nonce: Date.now().toString() },
      },
    }) as Promise<{ signedTransaction: string }>;
  };

  return (
    <WalletConnectContext.Provider
      value={{ isConnecting, isConnected, connect, disconnect, requestAccounts, signTransaction }}
    >
      {children}
    </WalletConnectContext.Provider>
  );
}

export function useWalletConnect() {
  const ctx = useContext(WalletConnectContext);
  if (!ctx) throw new Error('useWalletConnect must be used within a WalletConnectProvider');
  return ctx;
}
