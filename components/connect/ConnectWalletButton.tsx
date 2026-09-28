'use client';

import { useState } from 'react';
import { LogOut, Wallet } from 'lucide-react';
import { useQubicConnect } from './QubicConnectContext';
import { ConnectModal } from './ConnectModal';

function truncate(id: string) {
  return `${id.slice(0, 6)}...${id.slice(-6)}`;
}

export function ConnectWalletButton() {
  const { connected, wallet, disconnect } = useQubicConnect();
  const [open, setOpen] = useState(false);

  if (connected && wallet) {
    return (
      <>
        <button
          onClick={disconnect}
          className="inline-flex items-center gap-2 rounded-xl border border-green-400/40 bg-green-400/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-green-300 hover:bg-green-400/20 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          {truncate(wallet.publicKey)}
        </button>
        <ConnectModal open={open} onClose={() => setOpen(false)} />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-cyan-300 hover:bg-cyan-400/20 transition-colors"
      >
        <Wallet className="h-3.5 w-3.5" />
        Connect Wallet
      </button>
      <ConnectModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
