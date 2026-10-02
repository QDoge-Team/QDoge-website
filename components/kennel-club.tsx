'use client';

import { MagicCard } from '@/components/ui/magic-card';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import Image from 'next/image';
import React, { useLayoutEffect, useRef, useState } from 'react';
import { Trophy, Gift, Users, Bot, Award } from 'lucide-react';

const stepData = [
  {
    id: 1,
    title: 'Register',
    description: 'Register wallet Zealy',
    image: '/qdoge_stand_pose.webp',
  },
  {
    id: 2,
    title: 'Fetch',
    description: 'Go buy required amount of Qdoge',
    image: '/qdoge_run.webp',
  },
  {
    id: 3,
    title: 'Sit',
    description: 'Maintain positive balance',
    image: '/qdoge_sit.webp',
  },
  {
    id: 4,
    title: 'Bark',
    description: 'Post on X',
    image: '/qdoge_bark.webp',
  },
];

const KennelClubSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [selectedStep, setSelectedStep] = useState(stepData[0]);

  const animation = useScrollAnimation({
    animationType: 'mainAnim2',
    threshold: 0.2,
  });

  useLayoutEffect(() => {
    if (sectionRef.current) animation.elementRef(sectionRef.current);
  }, [animation]);

  return (
    <section
      id='kennel-club'
      ref={sectionRef}
      className={`relative py-20 lg:py-28 overflow-hidden ${animation.animationClass}`}
    >
      <div
        className='absolute inset-0 bg-center bg-cover opacity-40'
        style={{ backgroundImage: "url('/kennel_club.jpeg')" }}
        aria-hidden='true'
      />
      <div className='absolute inset-0 bg-linear-to-tr from-black via-black/70 to-cyan-900/40' />

      <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <MagicCard className='border-2 border-cyan-400/60 bg-surface/70 backdrop-blur-md shadow-[0_0_60px_rgba(6,182,212,0.3)]'>
          <div className='border-b border-cyan-400/40 p-4 bg-cyan-400/10'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <span className='text-cyan-400 font-mono text-sm uppercase tracking-wider'>
                  Epoch Drops
                </span>
              </div>
            </div>
          </div>

          <div className='p-8 lg:p-12 space-y-12'>
            {/* Title */}
            <div className='text-center'>
              <h2 className='text-3xl lg:text-4xl font-black text-cyan-400 font-mono mb-4'>
                EPOCH DROPS
              </h2>
            </div>

            <div className='grid lg:grid-cols-2 gap-8 lg:gap-12'>
              {/* Kennel Club List Section */}
              <div className='space-y-6'>
                <div className='border border-cyan-400/30 bg-cyan-400/5 rounded-lg p-6'>
                  <div className='flex items-center gap-3 mb-4'>
                    <Trophy className='w-6 h-6 text-cyan-400' />
                    <h3 className='text-2xl font-black text-surface-foreground font-mono'>
                      Kennel Club List
                    </h3>
                    <span className='text-cyan-400 font-mono font-black text-xl'>
                      -15%
                    </span>
                  </div>

                  <div className='space-y-4'>
                    <div className='border-l-2 border-cyan-400/50 pl-4'>
                      <p className='text-muted-text font-mono text-sm font-semibold mb-2'>
                        Top 100 Trainees
                      </p>
                      <p className='text-muted-text font-mono text-sm font-semibold mb-4'>
                        52 Week Training Program
                      </p>

                      {/* Training Steps */}
                      <div className='grid grid-cols-4 gap-2 mb-4'>
                        {stepData.map((step) => (
                          <button
                            key={step.id}
                            type='button'
                            className={`py-2 rounded-lg border text-xs font-mono font-black transition-all ${
                              step.id === selectedStep.id
                                ? 'border-cyan-400 bg-cyan-400/20 text-surface-foreground shadow-[0_0_15px_rgba(34,211,238,0.5)]'
                                : 'border-cyan-400/30 text-muted-text hover:border-cyan-400/70 hover:bg-cyan-400/10'
                            }`}
                            onClick={() => setSelectedStep(step)}
                          >
                            {step.title}
                          </button>
                        ))}
                      </div>

                      {/* Selected Step Display */}
                      <div className='relative border border-cyan-400/40 bg-surface/80 rounded-lg overflow-hidden'>
                        <div className='p-4 space-y-2'>
                          <p className='text-muted-text font-mono text-xs tracking-[0.3em] uppercase'>
                            {selectedStep.title}
                          </p>
                          <p className='text-muted-text font-mono text-sm'>
                            {selectedStep.description}
                          </p>
                        </div>
                        <div className='relative w-full min-h-[300px] h-[400px]'>
                          <Image
                            src={selectedStep.image}
                            alt={`${selectedStep.title} illustration`}
                            fill
                            sizes='(max-width: 1024px) 100vw, 50vw'
                            className='object-contain'
                            priority={selectedStep.id === 1}
                          />
                          <div className='absolute inset-0 bg-linear-to-tr from-black/60 via-black/20 to-transparent' />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rewards/Treats Section */}
              <div className='space-y-6'>
                <div className='border border-purple-400/30 bg-purple-400/5 rounded-lg p-6'>
                  <div className='flex items-center gap-3 mb-4'>
                    <Gift className='w-6 h-6 text-purple-400' />
                    <h3 className='text-2xl font-black text-surface-foreground font-mono'>
                      Rewards/Treats
                    </h3>
                    <span className='text-purple-400 font-mono font-black text-xl'>
                      -5%
                    </span>
                  </div>

                  <div className='space-y-4'>
                    {/* Epoch Bark Treat */}
                    <div className='border border-purple-400/30 bg-surface/60 rounded-lg p-4'>
                      <div className='flex items-start gap-3 mb-2'>
                        <Award className='w-5 h-5 text-purple-400 mt-0.5' />
                        <div className='flex-1'>
                          <h4 className='text-muted-text font-mono font-semibold mb-1'>
                            Epoch Bark Treat
                          </h4>
                          <p className='text-purple-400 font-mono font-black text-lg mb-1'>
                            1,000,000 Qdoge
                          </p>
                          <p className='text-muted-text font-mono text-xs'>
                            Voted best bark by community
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Monthly Stay Treat */}
                    <div className='border border-emerald-400/30 bg-surface/60 rounded-lg p-4'>
                      <div className='flex items-start gap-3 mb-2'>
                        <Users className='w-5 h-5 text-emerald-400 mt-0.5' />
                        <div className='flex-1'>
                          <h4 className='text-muted-text font-mono font-semibold mb-1'>
                            Monthly Stay Treat
                          </h4>
                          <p className='text-emerald-400 font-mono font-black text-lg mb-1'>
                            25,000,000 Qdoge
                          </p>
                          <p className='text-muted-text font-mono text-xs'>
                            Shared by those who have kept 100%, not sold any
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Epoch Engage Bot */}
                    <div className='border border-orange-400/30 bg-surface/60 rounded-lg p-4'>
                      <div className='flex items-start gap-3 mb-2'>
                        <Bot className='w-5 h-5 text-orange-400 mt-0.5' />
                        <div className='flex-1'>
                          <h4 className='text-muted-text font-mono font-semibold mb-1'>
                            Epoch Engage Bot
                          </h4>
                          <p className='text-orange-400 font-mono font-black text-lg mb-1'>
                            3%
                          </p>
                          <p className='text-muted-text font-mono text-xs'>
                            Buy Qdoge tokens with Engage points
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </MagicCard>
      </div>
    </section>
  );
};

export default KennelClubSection;


