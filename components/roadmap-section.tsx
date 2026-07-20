'use client';

import React, { useRef } from 'react';
import { Rocket, Trophy, Gamepad2, Palette, Gift } from 'lucide-react';
import { MagicCard } from '@/components/ui/magic-card';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const RoadmapSection: React.FC = () => {
  const headerAnimation = useScrollAnimation({
    animationType: 'mainAnim1',
    threshold: 0.2,
  });
  const timelineAnimation = useScrollAnimation({
    animationType: 'mainAnim2',
    threshold: 0.3,
  });
  const ctaAnimation = useScrollAnimation({
    animationType: 'mainAnim1',
    threshold: 0.4,
  });

  const headerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const roadmapData = [
    {
      quarter: 'Q4 2025',
      items: [
        { icon: Rocket, text: 'Launch', epoch: '192', status: 'completed' },
        { icon: Gift, text: 'Airdrop', epoch: '197', status: 'active' },
        {
          icon: Gamepad2,
          text: 'P2E Game "QDoge Rocket"',
          epoch: '200',
          status: 'upcoming',
        },
      ],
      highlight: false,
    },
    {
      quarter: 'Q1 2026',
      items: [
        {
          icon: Palette,
          text: 'NFT Collection #1',
          epoch: '204',
          status: 'upcoming',
        },
        {
          icon: Trophy,
          text: 'Qswap Listing',
          epoch: '205',
          status: 'upcoming',
        },
      ],
      highlight: false,
    },
    {
      quarter: 'Q2 2026',
      items: [
        {
          icon: Gamepad2,
          text: 'P2E Game #2',
          epoch: '224',
          status: 'upcoming',
        },
        {
          icon: Trophy,
          text: 'P2P Listing',
          epoch: '224',
          status: 'upcoming',
        },
        {
          icon: Palette,
          text: 'NFT Collection #2',
          epoch: '229',
          status: 'upcoming',
        },
      ],
      highlight: false,
    },
    {
      quarter: 'Q3 2026',
      items: [
        {
          icon: Palette,
          text: 'NFT Collection #3',
          epoch: '240',
          status: 'upcoming',
        },
        {
          icon: Gift,
          text: 'Kennel List Airdrop #1',
          epoch: '246',
          status: 'upcoming',
        },
      ],
      highlight: false,
    },
    {
      quarter: 'Q4 2026',
      subtitle: '(the real treats begin)',
      items: [
        {
          icon: Gift,
          text: 'Kennel Airdrop #2',
          epoch: '251',
          status: 'upcoming',
        },
        {
          icon: Gift,
          text: 'Kennel Airdrop #3',
          epoch: '256',
          status: 'upcoming',
        },
        {
          icon: Gift,
          text: 'Kennel Airdrop #4',
          epoch: '261',
          status: 'upcoming',
        },
      ],
      highlight: true,
    },
  ];

  return (
    <section
      id='roadmap'
      className='relative py-20 lg:py-32 overflow-hidden'
      style={{
        backgroundImage: 'url(/roadmap-bg.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Cyberpunk Overlay */}
      <div className='absolute inset-0 bg-black/80' />
      <div className='absolute inset-0 bg-[linear-gradient(45deg,rgba(0,243,255,0.1)_0%,transparent_50%,rgba(188,19,254,0.1)_100%)]' />

      <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Cyberpunk Header */}
        <div
          ref={headerRef}
          className={`mb-20 text-center ${headerAnimation.animationClass}`}
        >
          <div className='relative inline-block'>
            {/* Glitch Effect Background */}
            <div className='absolute inset-0 bg-cyan-400/20 blur-xl animate-pulse' />

            <div className='relative'>
              <h2 className='text-5xl lg:text-7xl font-black text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-purple-400 to-cyan-400 mb-4 font-mono tracking-wider drop-shadow-2xl'>
                ROADMAP
              </h2>

              <div className='flex items-center justify-center space-x-4 text-cyan-400 font-mono text-lg'>
                <span>&gt;</span>
                <span className='animate-pulse'>TO_THE_MOON.PROTOCOL</span>
                <span>&lt;</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cyberpunk Timeline */}
        <div
          ref={timelineRef}
          className={`${timelineAnimation.animationClass}`}
        >
          <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8'>
            {roadmapData.map((phase, index) => (
              <div key={phase.quarter} className='relative group'>
                {/* Connection Line */}
                {index < roadmapData.length - 1 && (
                  <div className='hidden xl:block absolute top-1/2 -right-4 w-8 h-0.5 bg-linear-to-r from-cyan-400/50 to-transparent z-0' />
                )}

                <MagicCard
                  className={`relative h-full border-2 backdrop-blur-md transition-all duration-500 ${
                    phase.highlight
                      ? 'border-yellow-400/60 bg-yellow-400/5 shadow-yellow-400/20'
                      : 'border-cyan-400/60 bg-cyan-400/5 shadow-cyan-400/20'
                  } hover:shadow-2xl`}
                >
                  {/* Terminal Header */}
                  <div
                    className={`relative p-4 border-b-2 ${
                      phase.highlight
                        ? 'border-yellow-400/40 bg-yellow-400/10'
                        : 'border-cyan-400/40 bg-cyan-400/10'
                    }`}
                  >
                    {/* Scan Lines */}
                    <div className='absolute inset-0 bg-[linear-gradient(transparent_48%,rgba(255,255,255,0.03)_49%,rgba(255,255,255,0.03)_52%,transparent_53%)] bg-[length:100%_4px] pointer-events-none' />

                    <div className='relative flex items-center justify-between'>
                      <div className='flex items-center space-x-3'>
                        <div
                          className={`w-8 h-8 border-2 flex items-center justify-center font-mono text-sm font-bold ${
                            phase.highlight
                              ? 'border-yellow-400/60 text-yellow-400 bg-yellow-400/20'
                              : 'border-cyan-400/60 text-cyan-400 bg-cyan-400/20'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <h3
                            className={`text-2xl font-black font-mono ${
                              phase.highlight
                                ? 'text-yellow-400'
                                : 'text-cyan-400'
                            }`}
                          >
                            {phase.quarter}
                          </h3>
                          {phase.subtitle && (
                            <p
                              className={`text-xs font-mono mt-1 ${
                                phase.highlight
                                  ? 'text-yellow-300/80'
                                  : 'text-cyan-300/80'
                              }`}
                            >
                              {phase.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <div
                        className={`px-3 py-1 border font-mono text-xs uppercase tracking-wider ${
                          phase.highlight
                            ? 'border-yellow-400/50 text-yellow-400 bg-yellow-400/20'
                            : 'border-cyan-400/50 text-cyan-400 bg-cyan-400/20'
                        }`}
                      >
                        {phase.highlight ? 'PRIORITY' : 'ACTIVE'}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className='p-6'>
                    <div className='space-y-4'>
                      {phase.items.map((item) => (
                        <div
                          key={item.text}
                          className='group/item relative overflow-hidden border border-gray-700/50 bg-black/40 hover:border-cyan-400/50 transition-all duration-300'
                        >
                          {/* Hover Glow */}
                          <div className='absolute inset-0 bg-cyan-400/5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300' />

                          <div className='relative p-4 flex items-center space-x-4'>
                            <div
                              className={`p-2 border ${
                                phase.highlight
                                  ? 'border-yellow-400/50 bg-yellow-400/20'
                                  : 'border-cyan-400/50 bg-cyan-400/20'
                              } transition-all duration-300`}
                            >
                              <item.icon
                                className={`w-5 h-5 ${
                                  phase.highlight
                                    ? 'text-yellow-400'
                                    : 'text-cyan-400'
                                }`}
                              />
                            </div>

                            <div className='flex-1 min-w-0'>
                              <h4 className='text-white font-mono text-sm font-bold mb-1 group-hover/item:text-cyan-400 transition-colors duration-300'>
                                {item.text}
                              </h4>
                              <p className='text-gray-400 font-mono text-xs'>
                                EPOCH_{item.epoch}
                              </p>
                            </div>
                          </div>

                          {/* Corner Brackets */}
                          <div className='absolute top-1 left-1 w-2 h-2 border-l border-t border-cyan-400/30' />
                          <div className='absolute top-1 right-1 w-2 h-2 border-r border-t border-cyan-400/30' />
                          <div className='absolute bottom-1 left-1 w-2 h-2 border-l border-b border-cyan-400/30' />
                          <div className='absolute bottom-1 right-1 w-2 h-2 border-r border-b border-cyan-400/30' />
                        </div>
                      ))}
                    </div>
                  </div>
                </MagicCard>
              </div>
            ))}
          </div>
        </div>

        {/* Cyberpunk CTA */}
        <div ref={ctaRef} className={`mt-20 ${ctaAnimation.animationClass}`}>
          <MagicCard className='relative border-2 border-cyan-400/60 bg-black/60 backdrop-blur-md overflow-hidden'>
            {/* Animated Background */}
            <div className='absolute inset-0 bg-linear-to-r from-cyan-400/10 via-purple-400/10 to-cyan-400/10 animate-pulse' />

            {/* Scan Lines */}
            <div className='absolute inset-0 bg-[linear-gradient(transparent_48%,rgba(0,243,255,0.03)_49%,rgba(0,243,255,0.03)_52%,transparent_53%)] bg-[length:100%_4px] pointer-events-none animate-pulse' />

            <div className='relative p-8 lg:p-12 text-center'>
              <div className='mb-8'>
                <h3 className='text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-purple-400 to-cyan-400 mb-4 font-mono'>
                  READY_TO_JOIN?
                </h3>

                <p className='text-cyan-300 font-mono text-lg mb-2'>
                  &gt; KENNEL_CLUB.INIT --TRAINING=52WEEKS --REWARDS=ENABLED
                </p>
                <p className='text-gray-400 font-mono text-sm'>
                  Train with the elite • Earn rewards • Prepare for DOGE mining
                </p>
              </div>

              <div className='flex flex-col sm:flex-row gap-6 justify-center'>
                <a
                  href='https://zealy.io/cw/qdoge'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='group relative px-8 py-4 border-2 border-cyan-400/50 bg-cyan-400/10 text-cyan-400 font-mono font-bold uppercase tracking-wider hover:bg-cyan-400/20 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-400/25 transition-all duration-300 inline-block'
                >
                  <span className='relative z-10'>[Y] JOIN_KENNEL_CLUB</span>
                  <div className='absolute inset-0 bg-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
                </a>

                <a
                  href='https://docs.google.com/document/d/1q4hWqr29iD8u0UVOJKb2gSEtNa-SNeRz7EV2L1uCotQ/edit?tab=t.0'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='group relative px-8 py-4 border-2 border-orange-400/50 bg-orange-400/10 text-orange-400 font-mono font-bold uppercase tracking-wider hover:bg-orange-400/20 hover:border-orange-400 transition-all duration-300 inline-block'
                >
                  <span className='relative z-10'>[N] VIEW_WHITEPAPER</span>
                  <div className='absolute inset-0 bg-orange-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
                </a>
              </div>
            </div>

            {/* Corner Brackets */}
            <div className='absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-cyan-400/60' />
            <div className='absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-cyan-400/60' />
            <div className='absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-cyan-400/60' />
            <div className='absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-cyan-400/60' />
          </MagicCard>
        </div>
      </div>
    </section>
  );
};

export default RoadmapSection;
