'use client';

import { MagicCard } from '@/components/ui/magic-card';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';
import {
  Crown,
  Code,
  Server,
  MessageSquare,
  Shield,
  Users,
} from 'lucide-react';
import React, { useLayoutEffect, useRef } from 'react';

const teamMembers = [
  {
    name: 'Profitphil',
    role: 'Team Lead',
    icon: Crown,
    color: 'text-yellow-400',
    borderColor: 'border-yellow-400/30',
    bgColor: 'bg-yellow-400/5',
    hoverBorder: 'hover:border-yellow-400/60',
  },
  {
    name: 'KupTTera',
    role: 'Frontend & Web3 Integration Dev',
    icon: Code,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-400/30',
    bgColor: 'bg-cyan-400/5',
    hoverBorder: 'hover:border-cyan-400/60',
  },
  {
    name: 'CozyBeard',
    role: 'CasinoGame Dev',
    icon: Code,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-400/30',
    bgColor: 'bg-cyan-400/5',
    hoverBorder: 'hover:border-cyan-400/60',
  },
  {
    name: 'DoubleK',
    role: 'Backend Dev',
    icon: Server,
    color: 'text-purple-400',
    borderColor: 'border-purple-400/30',
    bgColor: 'bg-purple-400/5',
    hoverBorder: 'hover:border-purple-400/60',
  },
  {
    name: 'Rayyan',
    role: 'Discord Moderator',
    icon: MessageSquare,
    color: 'text-blue-400',
    borderColor: 'border-blue-400/30',
    bgColor: 'bg-blue-400/5',
    hoverBorder: 'hover:border-blue-400/60',
  },
  {
    name: 'Mr. Rose',
    role: 'MSVAULT Signer',
    icon: Shield,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-400/30',
    bgColor: 'bg-emerald-400/5',
    hoverBorder: 'hover:border-emerald-400/60',
  },
  {
    name: 'Salar',
    role: 'MSVAULT Signer',
    icon: Shield,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-400/30',
    bgColor: 'bg-emerald-400/5',
    hoverBorder: 'hover:border-emerald-400/60',
  },
];

const TeamSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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

  return (
    <section
      id='team'
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
          <MagicCard className='border-2 border-cyan-400/60 bg-black/80 backdrop-blur-sm'>
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
                    TEAM
                  </span>
                </div>
                <div className='flex items-center space-x-2'>
                  <Users className='w-4 h-4 text-green-400 animate-pulse' />
                  <span className='text-green-400 font-mono text-xs'>ACTIVE</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div ref={contentRef} className={`p-6 lg:p-8 ${contentAnimation.animationClass}`}>
              {/* Title */}
              <motion.h2
                className='text-4xl lg:text-5xl font-black text-cyan-400 mb-12 tracking-wider font-mono text-center'
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                TEAM
              </motion.h2>

              {/* Team Grid */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {teamMembers.map((member, index) => {
                  const Icon = member.icon;
                  return (
                    <motion.div
                      key={member.name}
                      className={`relative border ${member.borderColor} ${member.bgColor} ${member.hoverBorder} rounded-lg p-6 transition-all duration-300 hover:shadow-lg`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      {/* Icon */}
                      <div className='flex justify-center mb-4'>
                        <div
                          className={`p-4 border ${member.borderColor} ${member.bgColor} rounded-full`}
                        >
                          <Icon className={`w-8 h-8 ${member.color}`} />
                        </div>
                      </div>

                      {/* Name */}
                      <h3
                        className={`text-xl font-black font-mono text-center mb-2 ${member.color}`}
                      >
                        {member.name}
                      </h3>

                      {/* Role */}
                      <p className='text-gray-400 font-mono text-sm text-center'>
                        {member.role}
                      </p>

                      {/* Corner Brackets */}
                      <div className={`absolute top-2 left-2 w-3 h-3 border-l border-t ${member.borderColor}`} />
                      <div className={`absolute top-2 right-2 w-3 h-3 border-r border-t ${member.borderColor}`} />
                      <div className={`absolute bottom-2 left-2 w-3 h-3 border-l border-b ${member.borderColor}`} />
                      <div className={`absolute bottom-2 right-2 w-3 h-3 border-r border-b ${member.borderColor}`} />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </MagicCard>
        </motion.div>
      </div>
    </section>
  );
};

export default TeamSection;

