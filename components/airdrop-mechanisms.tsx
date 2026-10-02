'use client';

import { MagicCard } from '@/components/ui/magic-card';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';
import {
  Calendar,
  CheckCircle,
  Check,
  Clipboard,
  Coins,
  Gift,
  Users,
  Trophy,
  Wallet,
  Flame,
} from 'lucide-react';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

const AirdropMechanismsSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const copyResetRef = useRef<NodeJS.Timeout | null>(null);

  const sectionAnimation = useScrollAnimation({
    animationType: 'mainAnim1',
    threshold: 0.2,
  });

  const contentAnimation = useScrollAnimation({
    animationType: 'mainAnim2',
    threshold: 0.3,
  });

  useLayoutEffect(() => {
    if (sectionRef.current) sectionAnimation.elementRef(sectionRef.current);
  }, [sectionAnimation]);

  useLayoutEffect(() => {
    if (contentRef.current) contentAnimation.elementRef(contentRef.current);
  }, [contentAnimation]);

  useEffect(() => {
    return () => {
      if (copyResetRef.current) {
        clearTimeout(copyResetRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    const address = 'QDOGEEESKYPAICECHEAHOXPULEOADTKGEJHAVYPFKHLEWGXXZQUGIGMBUTZE';
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      if (copyResetRef.current) clearTimeout(copyResetRef.current);
      copyResetRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address', error);
    }
  };

  const distributionData = [
    {
      title: 'Community',
      percentage: '7.5%',
      icon: Users,
      color: 'text-cyan-400',
    },
    {
      title: 'Power Players',
      percentage: '4%',
      icon: Trophy,
      color: 'text-purple-400',
      link: '#power-players',
    },
    {
      title: 'QXMR trade-in/burn',
      percentage: '2.5%',
      icon: Flame,
      color: 'text-orange-400',
    },
    {
      title: 'Portal Token Holders',
      percentage: '1%',
      icon: Coins,
      color: 'text-emerald-400',
    },
  ];

  return (
    <section
      id='airdrop-mechanisms'
      ref={sectionRef}
      className={`relative py-20 lg:py-32 overflow-hidden ${sectionAnimation.animationClass}`}
    >
      <div className='absolute inset-0 bg-linear-to-br from-gray-900 via-black to-gray-900' />
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,243,255,0.1),transparent_70%)]' />

      <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <motion.div
          initial='hidden'
          whileInView='visible'
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.3 }}
          variants={{
            visible: { opacity: 1 },
            hidden: { opacity: 0 },
          }}
        >
          <MagicCard className='border-2 border-cyan-400/60 bg-surface/80 backdrop-blur-sm'>
            {/* Terminal Header */}
            <div className='border-b border-cyan-400/40 p-4 bg-cyan-400/10'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  <div className='flex space-x-2'>
                    <div className='w-3 h-3 bg-red-400 rounded-full'></div>
                    <div className='w-3 h-3 bg-yellow-400 rounded-full'></div>
                    <div className='w-3 h-3 bg-green-400 rounded-full'></div>
                  </div>
                  <span className='text-cyan-400 font-mono text-sm uppercase tracking-wider'>
                    AIRDROP MECHANISMS
                  </span>
                </div>
                <div className='flex items-center space-x-2'>
                  <Gift className='w-4 h-4 text-green-400 animate-pulse' />
                  <span className='text-green-400 font-mono text-xs'>ACTIVE</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div ref={contentRef} className={`p-6 lg:p-8 space-y-8 ${contentAnimation.animationClass}`}>
              {/* Title */}
              <motion.h2
                className='text-4xl lg:text-5xl font-black text-cyan-400 mb-8 tracking-wider font-mono text-center'
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                AIRDROP MECHANISMS
              </motion.h2>

              {/* Eligibility Requirements */}
              <motion.div
                className='border border-cyan-400/30 bg-cyan-400/5 rounded-lg p-6 space-y-4'
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <div className='flex items-center gap-3 mb-4'>
                  <CheckCircle className='w-6 h-6 text-cyan-400' />
                  <h3 className='text-2xl font-black text-cyan-300 font-mono'>Eligibility Requirements</h3>
                </div>
                <p className='text-muted-text font-mono text-sm lg:text-base leading-relaxed'>
                  Register your Qubic wallet and X account with{' '}
                  <a
                    href='https://zealy.io/cw/qdoge'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-cyan-400 hover:text-cyan-300 underline font-black transition-colors'
                  >
                    Zealy
                  </a>{' '}
                  to enter the Kennel.
                  <br />
                  The X account must be created before <span className='text-cyan-400 font-black'>Dec 1</span> to be eligible.
                </p>
              </motion.div>

              {/* Participation Instructions */}
              {/* <motion.div
                className='border border-purple-400/30 bg-purple-400/5 rounded-lg p-6 space-y-4'
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div className='flex items-center gap-3 mb-4'>
                  <Wallet className='w-6 h-6 text-purple-400' />
                  <h3 className='text-2xl font-black text-purple-300 font-mono'>How to Participate</h3>
                </div>
                <div className='space-y-3'>
                  <p className='text-purple-200 font-mono text-sm lg:text-base'>
                    By <span className='text-purple-400 font-black'>Jan 5 12 UTC</span>
                  </p>
                  <p className='text-purple-200 font-mono text-sm lg:text-base'>
                    Send <span className='text-purple-400 font-black'>1m Qubic</span> to:
                  </p>
                  <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-black/60 border border-purple-400/40 rounded p-4 font-mono text-xs lg:text-sm text-purple-300'>
                    <span className='break-all sm:pr-4'>
                      QDOGEEESKYPAICECHEAHOXPULEOADTKGEJHAVYPFKHLEWGXXZQUGIGMBUTZE
                    </span>
                    <button
                      type='button'
                      onClick={handleCopy}
                      className={`inline-flex items-center gap-2 self-start sm:self-auto px-3 py-2 rounded-md border text-[11px] uppercase tracking-[0.15em] transition-all ${
                        copied
                          ? 'border-emerald-400 text-emerald-300 bg-emerald-400/10'
                          : 'border-purple-400/70 text-purple-200 hover:border-purple-300 hover:text-purple-100 hover:bg-purple-400/10'
                      }`}
                      aria-label='Copy Qubic address'
                    >
                      {copied ? (
                        <>
                          <Check className='w-4 h-4' />
                          Copied
                        </>
                      ) : (
                        <>
                          <Clipboard className='w-4 h-4' />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className='text-purple-200 font-mono text-sm lg:text-base'>
                    <span className='text-purple-400 font-black'>999k</span> will go in Reserve Fund for project development
                  </p>
                </div>
              </motion.div> */}

              {/* Airdrop Timeline */}
              <motion.div
                className='border border-emerald-400/30 bg-emerald-400/5 rounded-lg p-6 space-y-4'
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <div className='flex items-center gap-3 mb-4'>
                  <Calendar className='w-6 h-6 text-emerald-400' />
                  <h3 className='text-2xl font-black text-emerald-300 font-mono'>Airdrop Timeline</h3>
                </div>
                <p className='text-muted-text font-mono text-sm lg:text-base leading-relaxed'>
                  AirDrop to start <span className='text-emerald-400 font-black'>January 21 12 UTC</span>
                </p>
              </motion.div>

              {/* Distribution Breakdown */}
              <motion.div
                className='border border-cyan-400/30 bg-cyan-400/5 rounded-lg p-6 space-y-6'
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <div className='flex items-center gap-3 mb-6'>
                  <Gift className='w-6 h-6 text-cyan-400' />
                  <h3 className='text-2xl font-black text-cyan-300 font-mono'>Distribution Breakdown</h3>
                </div>
                <div className='mb-4'>
                  <p className='text-surface-foreground font-mono text-lg lg:text-xl font-black mb-4'>
                    Total Airdrop: <span className='text-cyan-400'>15%</span>
                  </p>
                </div>
                <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-4'>
                  {distributionData.map((item, index) => {
                    const Icon = item.icon;
                    const content = (
                      <motion.div
                        className='border border-cyan-400/30 bg-surface/60 rounded-lg p-5 hover:border-cyan-400/60 transition-all'
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                      >
                        <div className='flex items-center gap-3 mb-3'>
                          <Icon className={`w-5 h-5 ${item.color}`} />
                          <span className={`font-mono text-sm font-black ${item.color}`}>
                            {item.percentage}
                          </span>
                        </div>
                        <h4 className='text-muted-text font-mono text-sm font-semibold'>
                          {item.title}
                        </h4>
                      </motion.div>
                    );
                    return item.link ? (
                      <a key={item.title} href={item.link} className='block'>
                        {content}
                      </a>
                    ) : (
                      <div key={item.title}>{content}</div>
                    );
                  })}
                </div>
                <div className='mt-4 p-4 bg-orange-400/5 border border-orange-400/30 rounded-lg'>
                  <p className='text-muted-text font-mono text-sm lg:text-base leading-relaxed'>
                    Beginning January 22, send QXMR to [SPECIAL_WALLET] and receive QDoge (100:1)
                  </p>
                </div>
              </motion.div>
            </div>
          </MagicCard>
        </motion.div>
      </div>
    </section>
  );
};

export default AirdropMechanismsSection;

