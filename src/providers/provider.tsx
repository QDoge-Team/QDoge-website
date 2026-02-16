'use client'

import { API_URL } from '@/config';
import { SocketContext } from '@/context/socketcontext'
import { HeroUIProvider } from '@heroui/react'
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import io, { Socket } from "socket.io-client";
import { MetaMaskProvider } from '@/components/CONNECT/MetamaskContext';
import { WalletConnectProvider } from '@/components/CONNECT/WalletConnectContext';
import { QubicConnectProvider } from '@/components/CONNECT/QubicConnectContext';
import { Toaster } from 'react-hot-toast';
import ConnectLink from '@/components/CONNECT/ConnectLink';

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // ✅ Keep socket stable and created once
  const socketRef = useRef<Socket | null>(null);
  const [crashSocket, setCrashSocket] = useState<Socket | null>(null);

  // ✅ Keep toastOptions stable
  const toastOptions = useMemo(() => ({
    duration: 4000,
    style: {
      background: '#1a1a1a',
      color: '#fff',
    },
  }), []);

  // ✅ Create socket ONCE inside useEffect (not at module scope)
  useEffect(() => {
    if (socketRef.current) return;

    // Force secure transports when page is served over HTTPS
    const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
    const socketUrl = `${API_URL}/crashx`;
    
    const s = io(socketUrl, {
      transports: ['polling', 'websocket'], // Try polling first, then websocket (better fallback)
      upgrade: true, // Allow transport upgrades
      rememberUpgrade: false,
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 20000, // Increase timeout for connection attempts
    });

    // Add error handling
    s.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
    });

    s.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socketRef.current = s;
    setCrashSocket(s);

    return () => {
      s.removeAllListeners();
      s.disconnect();
      socketRef.current = null;
      setCrashSocket(null);
    };
  }, []); // ✅ Empty dependency array - only run once on mount

  return (
    <HeroUIProvider>
      <Toaster position="top-right" toastOptions={toastOptions} />

      {/* Provide socket (can be null initially) */}
      <SocketContext.Provider value={crashSocket}>
        <MetaMaskProvider>
          <WalletConnectProvider>
            <QubicConnectProvider>
              {/* ✅ Show quick connect only on landing */}
              {pathname === "/landing" && (
                <div className="fixed top-4 right-4 z-[9999]">
                  <ConnectLink />
                </div>
              )}

              {children}
            </QubicConnectProvider>
          </WalletConnectProvider>
        </MetaMaskProvider>
      </SocketContext.Provider>
    </HeroUIProvider>
  )
}