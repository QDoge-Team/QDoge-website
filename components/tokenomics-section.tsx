/* eslint-disable @next/next/no-img-element */
'use client';

import { MagicCard } from '@/components/ui/magic-card';
import {
  Activity,
  Coins,
  Database,
  Gamepad2,
  Gift,
  Lock,
  Trophy,
  Users,
} from 'lucide-react';
import React, { useLayoutEffect, useRef, useState } from 'react';
// import { NumberTicker } from '@/components/ui/number-ticker'; // eslint unused var fix
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const CHART_CENTER = 100;
const CHART_RADIUS = 90;

const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  // Round coordinates to avoid tiny floating point differences between
  // server and client that can cause React hydration warnings.
  const round = (value: number) => Number(value.toFixed(6));

  return {
    x: round(centerX + radius * Math.cos(angleInRadians)),
    y: round(centerY + radius * Math.sin(angleInRadians)),
  };
};

const describeArc = (
  startAngle: number,
  endAngle: number,
  radius: number = CHART_RADIUS,
  center: number = CHART_CENTER
) => {
  const start = polarToCartesian(center, center, radius, endAngle);
  const end = polarToCartesian(center, center, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    `M ${center} ${center}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
};

type PieSlice = {
  title: string;
  percentage: number;
  color: string;
  startAngle: number;
  endAngle: number;
  path: string;
};

const TokenomicsSection: React.FC = () => {
  // Setup refs for each animation target
  const headerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [hoveredSlice, setHoveredSlice] = useState<PieSlice | null>(null);

  // Use custom scroll animation hook
  const headerAnimation = useScrollAnimation({
    animationType: 'mainAnim1',
    threshold: 0.2,
  });
  const tableAnimation = useScrollAnimation({
    animationType: 'mainAnim2',
    threshold: 0.3,
  });
  const chartAnimation = useScrollAnimation({
    animationType: 'mainAnim1',
    threshold: 0.4,
  });

  // Attach DOM refs to animation hook before first paint (like in AboutSection)
  // Remove setState from effect, synchronize refs only
  useLayoutEffect(() => {
    if (headerRef.current) headerAnimation.elementRef(headerRef.current);
  }, [headerAnimation]);
  useLayoutEffect(() => {
    if (tableRef.current) tableAnimation.elementRef(tableRef.current);
  }, [tableAnimation]);
  useLayoutEffect(() => {
    if (chartRef.current) chartAnimation.elementRef(chartRef.current);
  }, [chartAnimation]);

  // Read animation class directly from hook (no setState)
  const headerAnimClass = headerAnimation.animationClass;
  const tableAnimClass = tableAnimation.animationClass;
  const chartAnimClass = chartAnimation.animationClass;

  const tokenomicsData = [
    {
      title: 'TEAM',
      percentage: 15,
      amount: '3.15B',
      description: '12 months vested',
      icon: Users,
      color: 'from-blue-400 to-cyan-500',
      delay: 0.1,
      sliceColor: '#22d3ee',
  },
    {
      title: 'AIRDROP',
      percentage: 15,
      amount: '3.15B',
      description: '3 Parts Distribution',
      icon: Gift,
      color: 'from-green-400 to-emerald-500',
      delay: 0.2,
      sliceColor: '#34d399',
  },
    {
      title: 'LIQUIDITY POOLS',
      percentage: 20,
      amount: '4.2B',
      description: 'DEX Liquidity',
      icon: Coins,
      color: 'from-purple-400 to-pink-500',
      delay: 0.3,
      sliceColor: '#a855f7',
  },
    {
      title: 'EPOCH DROPS',
      percentage: 20,
      amount: '4.2B',
      description: 'Kennel Club Training',
      icon: Trophy,
      color: 'from-orange-400 to-red-500',
      delay: 0.4,
      sliceColor: '#fb923c',
  },
    {
      title: 'MARKETING',
      percentage: 5,
      amount: '1.575B',
      description: 'Giveaways & Promotion',
      icon: Gamepad2,
      color: 'from-teal-400 to-blue-500',
      delay: 0.5,
      sliceColor: '#0ea5e9',
  },
    {
      title: 'MINING REWARDS',
      percentage: 7.5,
      amount: '1.575B',
      description: 'Future Mining Incentives',
      icon: Lock,
      color: 'from-indigo-400 to-purple-500',
      delay: 0.6,
      sliceColor: '#6366f1',
  },
    {
      title: 'NFT REWARDS',
      percentage: 6,
      amount: '1.575B',
      description: 'Future Mining Incentives',
      icon: Lock,
      color: 'from-indigo-400 to-purple-500',
      delay: 0.6,
      sliceColor: '#8b5cf6',
  },
    {
      title: 'RESERVES',
      percentage: 8.5,
      amount: '1.575B',
      description: 'Future Mining Incentives',
      icon: Lock,
      color: 'from-indigo-400 to-purple-500',
      delay: 0.6,
      sliceColor: '#4ade80',
  },
    {
      title: 'GAME REWARDS',
      percentage: 3,
      amount: '1.575B',
      description: 'Future Mining Incentives',
      icon: Lock,
      color: 'from-indigo-400 to-purple-500',
      delay: 0.6,
      sliceColor: '#f97316',
  },
  ];

  const totalPercentage = tokenomicsData.reduce(
    (sum, item) => sum + item.percentage,
    0
  );
  const pieChartData = tokenomicsData.reduce(
    (acc, item) => {
      const start = acc.currentAngle;
      const angle = (item.percentage / totalPercentage) * 360;
      const end = start + angle;
      acc.segments.push(`${item.sliceColor} ${start}deg ${end}deg`);
      acc.slices.push({
        title: item.title,
        percentage: item.percentage,
        color: item.sliceColor,
        startAngle: start,
        endAngle: end,
        path: describeArc(start, end),
      });
      acc.currentAngle = end;
      return acc;
    },
    { segments: [] as string[], slices: [] as PieSlice[], currentAngle: 0 }
  );
  const pieChartGradient = pieChartData.segments.length
    ? `conic-gradient(${pieChartData.segments.join(', ')})`
    : 'conic-gradient(#22d3ee 0deg 360deg)';
  const activeSlice = hoveredSlice ?? {
    title: 'TOTAL',
    percentage: 100,
    color: '#22d3ee',
    startAngle: 0,
    endAngle: 360,
    path: '',
  };

  return (
    <section
      id='tokenomics'
      className='relative py-20 lg:py-32 overflow-hidden'
    >
      {/* Grid Pattern Overlay (REMOVED) */}
      {/* <div className='absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.03)_1px,transparent_1px)] bg-size-[50px_50px]' /> */}

      <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Cyberpunk Terminal Header */}
        <div ref={headerRef} className={`mb-16 lg:mb-24 ${headerAnimClass}`}>
          <div className='mx-auto'>
            <MagicCard className='border-2 border-cyan-400/60 bg-surface/90 backdrop-blur-sm'>
              {/* Terminal Header Bar */}
              <div className='border-b border-cyan-400/40 p-4 bg-cyan-400/10'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-3'>
                    <div className='flex space-x-2'>
                      <div className='w-3 h-3 bg-red-400 rounded-full'></div>
                      <div className='w-3 h-3 bg-yellow-400 rounded-full'></div>
                      <div className='w-3 h-3 bg-green-400 rounded-full'></div>
                    </div>
                    <span className='text-cyan-400 font-mono text-sm'>
                      QDOGE TOKENOMICS
                    </span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Activity className='w-4 h-4 text-green-400 animate-pulse' />
                    <span className='text-green-400 font-mono text-xs'>
                      ONLINE
                    </span>
                  </div>
                </div>
              </div>

              {/* Terminal Content */}
              <div className='p-6 lg:p-8'>
                <div className='flex flex-col lg:flex-row items-center gap-10'>
                  <div className='flex-1 text-center lg:text-left'>
                    <h2 className='text-4xl lg:text-5xl font-black text-cyan-400 mb-4 font-mono tracking-wider'>
                      QDOGE TOKENOMICS
                    </h2>
                    <div className='flex items-center justify-center lg:justify-start space-x-2 mb-6'>
                      <span className='text-cyan-400 font-mono text-2xl font-black'>
                        Built for Training and Sustained Rewards
                      </span>
                    </div>
                    <p className='text-sm text-muted-text font-mono leading-relaxed max-w-xl lg:max-w-none mx-auto lg:mx-0'>
                    Qdoge tokens will be held in MSVAULT wallet. Two trusted Qubic Community Members will be signers to provide more trust and accountability for QDoge.<br />
                      21,000,000,000 total supply, precision‑allocated to reward discipline, deepen liquidity, and fuel long‑term Doge mining.
                    </p>
                  </div>
                  <div className='flex flex-col items-center gap-4'>
                    <div
                      className='relative flex items-center justify-center w-44 h-44 lg:w-52 lg:h-52 rounded-full ring-2 ring-cyan-400/40 shadow-[0_0_30px_rgba(45,212,191,0.35)]'
                      style={{ background: pieChartGradient }}
                    >
                      <svg
                        viewBox='0 0 200 200'
                        className='w-full h-full'
                        role='img'
                        aria-label='Token distribution pie chart'
                        onMouseLeave={() => setHoveredSlice(null)}
                      >
                        {pieChartData.slices.map((slice) => (
                          <path
                            key={slice.title}
                            d={slice.path}
                            fill={slice.color}
                            className='cursor-pointer transition-opacity duration-200'
                            style={{
                              opacity:
                                hoveredSlice &&
                                hoveredSlice.title !== slice.title
                                  ? 0.4
                                  : 1,
                            }}
                            onMouseEnter={() => setHoveredSlice(slice)}
                          />
                        ))}
                      </svg>
                      <div className='absolute inset-8 rounded-full bg-surface/90 border border-cyan-400/30 flex flex-col items-center justify-center text-center px-3'>
                        <span className='text-[10px] uppercase text-muted-text font-mono tracking-[0.3em]'>
                          {activeSlice.title}
                        </span>
                        <span
                          className='text-xl font-black font-mono'
                          style={{ color: activeSlice.color }}
                        >
                          {activeSlice.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className='grid grid-cols-2 gap-3 text-xs font-mono text-muted-text'>
                      {tokenomicsData.map((item) => (
                        <div key={item.title} className='flex items-center gap-2'>
                          <span
                            className='w-3 h-3 rounded-sm border border-cyan-400/40'
                            style={{ backgroundColor: item.sliceColor }}
                          />
                          <span className='uppercase tracking-wide'>
                            {item.title}
                          </span>
                          <span className='text-muted-text'>[{item.percentage}%]</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </MagicCard>
          </div>
        </div>

        {/* Terminal-Style Tokenomics Table */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20'>
          {/* Left Panel - Allocation Table */}
          <div ref={tableRef} className={`${tableAnimClass}`}>
            <MagicCard className='border-2 border-cyan-400/60 bg-surface/90 backdrop-blur-sm h-full'>
              {/* Table Header */}
              <div className='border-b border-cyan-400/40 p-4 bg-cyan-400/10'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-3'>
                    <Database className='w-5 h-5 text-cyan-400' />
                    <span className='text-cyan-400 font-mono text-sm uppercase tracking-wider'>
                      Allocation_Table
                    </span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <div className='w-2 h-2 bg-cyan-400 rounded-full animate-pulse' />
                    <span className='text-cyan-400 font-mono text-xs'>
                      ACTIVE
                    </span>
                  </div>
                </div>
              </div>

              {/* Table Content */}
              <div className='p-6 font-mono text-sm'>
                {tokenomicsData.map((item) => (
                  <div
                    key={item.title}
                    className='flex justify-between items-center py-3 border-b border-cyan-400/20 hover:bg-cyan-400/5 transition-colors duration-300'
                  >
                    <div className='flex items-center space-x-3'>
                      <item.icon className='w-4 h-4 text-cyan-400' />
                      <span className='text-muted-text lowercase'>
                        {item.title.toLowerCase().replace(' ', '_')}:
                      </span>
                    </div>
                    <div className='flex items-center space-x-4'>
                      <span className='text-cyan-400 font-black'>
                        [ {item.percentage}% ]
                      </span>
                    </div>
                  </div>
                ))}
                
                {/* Total Supply Display */}
                <div className='mt-6 pt-4 border-t border-cyan-400/40 bg-cyan-400/5 -mx-6 px-6 py-4'>
                  <div className='flex justify-between items-center'>
                    <span className='text-cyan-400 font-black'>
                      total_supply:
                    </span>
                    <span className='text-cyan-400 font-black text-lg'>
                      [ 21,000,000,000 qdoge ]
                    </span>
                  </div>
                </div>
              </div>
            </MagicCard>
          </div>

          {/* Right Panel - Visual Chart Placeholder */}
          <div ref={chartRef} className={`${chartAnimClass}`}>
            <MagicCard className='border-2 border-cyan-400/60 bg-surface/80 backdrop-blur-sm h-full min-h-[500px] lg:min-h-[600px] flex items-center justify-center'>
              <img
                src='/tokenomics.png'
                alt='QDOGE AI Portrait'
                className='w-full h-full object-contain'
              />
            </MagicCard>
          </div>
        </div>

        {/* Airdrop Breakdown Terminal */}
        <div className='mb-20'>
          <MagicCard className='border-2 border-cyan-400/60 bg-surface/90 backdrop-blur-sm'>
            {/* Terminal Header */}
            <div className='border-b border-cyan-400/40 p-4 bg-cyan-400/10'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  <Gift className='w-5 h-5 text-cyan-400' />
                  <span className='text-cyan-400 font-mono text-sm uppercase tracking-wider'>
                    Rewards_Protocol
                  </span>
                </div>
                <div className='flex items-center space-x-2'>
                  <div className='w-2 h-2 bg-cyan-400 rounded-full animate-pulse' />
                  <span className='text-cyan-400 font-mono text-xs'>
                    ACTIVE
                  </span>
                </div>
              </div>
            </div>

            {/* Airdrop Details */}
            <div className='p-6 lg:p-8'>
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 font-mono'>
                <div className='text-center border border-cyan-400/30 p-6 bg-cyan-400/5'>
                  <div className='text-cyan-400 font-black text-lg mb-2 uppercase tracking-wider'>
                    QDoge Mining Rewards
                  </div>
                  <div className='text-4xl font-black text-cyan-400 mb-3'>
                    7.5%
                  </div>
                  <div className='text-muted-text text-sm leading-relaxed'>
                    QDoge allocates 7.5% of supply to mining‑aligned airdrops. 2.5% is streamed monthly starting Sept &apos;26 to the most obedient trainees on the Top Kennel List.
                  </div>
                </div>

                <div className='text-center border border-orange-400/30 p-6 bg-orange-400/5'>
                  <div className='text-orange-400 font-black text-lg mb-2 uppercase tracking-wider'>
                    NFT Reward Engine
                  </div>
                  <div className='text-4xl font-black text-orange-400 mb-3'>
                    6%
                  </div>
                  <div className='text-muted-text text-sm leading-relaxed'>
                    Three NFT collections (2% each) turn art into multipliers on QDoge rewards. Holding higher rarity means your treats scale with your discipline.
                  </div>
                </div>

                <div className='text-center border border-green-400/30 p-6 bg-green-400/5'>
                  <div className='text-green-400 font-black text-lg mb-2 uppercase tracking-wider'>
                    P2E Games
                  </div>
                  <div className='text-4xl font-black text-green-400 mb-3'>
                    3%
                  </div>
                  <div className='text-muted-text text-sm leading-relaxed'>
                    P2E titles like QDoge Rocket and future games create an always‑on loop of skill, fun, and token flow. Game rewards come from a dedicated 3% allocation so the kennel can play without draining core reserves.
                  </div>
                </div>
              </div>

              {/* Command Line */}
              <div className='mt-8 pt-6 border-t border-cyan-400/30'>
                <div className='text-center'>
                  <div className='flex justify-center space-x-4'>
                    <a
                      href='https://zealy.io/cw/qdoge'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='px-6 py-2 bg-cyan-400/20 border border-cyan-400/50 text-cyan-400 font-mono text-sm hover:bg-cyan-400/30 transition-all duration-300 inline-block'
                    >
                      [Y] CHECK_ELIGIBILITY
                    </a>
                    <a
                      href='https://docs.google.com/document/d/1q4hWqr29iD8u0UVOJKb2gSEtNa-SNeRz7EV2L1uCotQ/edit?tab=t.0'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='px-6 py-2 border border-orange-400/50 text-orange-400 font-mono text-sm hover:bg-orange-400/10 transition-all duration-300 inline-block'
                    >
                      [N] VIEW_WHITEPAPER
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </MagicCard>
        </div>
      </div>
    </section>
  );
};

export default TokenomicsSection;
