'use client';

import { ViaBtcMinerSection } from '@/components/viabtc-miner-section';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function DogeStatsPageContent() {
  return (
    <div className='relative'>
      <div className='absolute inset-0 bg-linear-to-br from-gray-900 via-black to-gray-900 pointer-events-none' />
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(0,243,255,0.12),transparent_55%)] pointer-events-none' />
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(188,19,254,0.12),transparent_55%)] pointer-events-none' />

      <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 md:pt-32 md:pb-24'>
        <Link
          href='/'
          className='inline-flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors font-mono uppercase tracking-wider mb-8'
        >
          <ArrowLeft className='h-4 w-4' />
          Back to home
        </Link>

        <div className='max-w-4xl mb-10'>
          <p className='inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-black/70 px-4 py-1 text-[11px] tracking-[0.28em] uppercase text-cyan-300 font-mono mb-5'>
            <span className='h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse' />
            Live mining
          </p>
          <h1 className='text-4xl sm:text-5xl md:text-6xl font-bold font-mono text-white tracking-tight mb-3'>
            <span className='bg-linear-to-r from-cyan-400 via-purple-400 to-amber-300 bg-clip-text text-transparent'>
              Qubic × DOGE
            </span>
          </h1>
          <p className='text-cyan-100/70 text-sm font-mono max-w-2xl'>
            Live hashrate, workers, and merged-mining earnings for the QDoge ASIC miner
            on ViaBTC.
          </p>
        </div>

        <ViaBtcMinerSection />
      </div>
    </div>
  );
}
