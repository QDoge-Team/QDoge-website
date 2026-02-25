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

  // Pages that actually need the crash socket
  const needsSocket = ['/crash', '/mine', '/slide', '/videopoker', '/landing'].some(
    (p) => pathname?.startsWith(p)
  );

  // ✅ Create socket ONCE inside useEffect, only on game pages
  useEffect(() => {
    if (!needsSocket) {
      // Disconnect if navigating away from game pages
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
        setCrashSocket(null);
      }
      return;
    }

    if (socketRef.current) return;

    const socketUrl = `${API_URL}/crashx`;
    let errorCount = 0;
    
    const s = io(socketUrl, {
      transports: ['polling', 'websocket'],
      upgrade: true,
      rememberUpgrade: false,
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 30000,   // Cap backoff at 30s
      reconnectionAttempts: Infinity, // Keep trying but with backoff
      timeout: 20000,
      autoConnect: true,
    });

    // Throttled error logging — only log first error and then every 10th
    s.on('connect_error', (error) => {
      errorCount++;
      if (errorCount === 1) {
        console.warn('[Socket] Connection error (will retry silently):', error.message);
      } else if (errorCount % 10 === 0) {
        console.warn(`[Socket] Still unable to connect after ${errorCount} attempts:`, error.message);
      }
    });

    s.on('connect', () => {
      if (errorCount > 0) {
        console.log(`[Socket] Connected after ${errorCount} failed attempt(s)`);
      } else {
        console.log('[Socket] Connected');
      }
      errorCount = 0;
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
  }, [needsSocket]); // Reconnect when navigating to/from game pages

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