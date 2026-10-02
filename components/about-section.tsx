/* eslint-disable @next/next/no-img-element */
'use client';

import { MagicCard } from '@/components/ui/magic-card';
import { motion } from 'framer-motion';
import React from 'react';

const AboutSection: React.FC = () => {

  return (
    <section id='about' className='relative py-20 lg:py-32 overflow-hidden'>
      <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Cyberpunk Terminal Layout */}
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
          <div className=''>
            {/* Left Panel - Terminal Interface */}
            <motion.div
              className='relative'
              initial='hidden'
              whileInView='visible'
              viewport={{ once: true, amount: 0.2 }}
              variants={{
                hidden: { opacity: 0, x: -60, filter: 'blur(10px)' },
                visible: {
                  opacity: 1,
                  x: 0,
                  filter: 'blur(0px)',
                  transition: {
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                    duration: 0.4,
                  },
                },
              }}
            >
              <MagicCard className='border-2 border-cyan-400/60 bg-surface/80 backdrop-blur-sm relative h-full'>
                {/* Terminal Header */}
                <motion.div
                  className='border-b border-cyan-400/40 p-3 bg-cyan-400/10'
                  initial={{ opacity: 0, y: -15, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 20,
                    duration: 0.3,
                    delay: 0.05,
                  }}
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                      {['red', 'yellow', 'green'].map((color, index) => (
                        <motion.div
                          key={color}
                          className={`w-3 h-3 bg-${color}-400 rounded-full`}
                          initial={{ scale: 0, rotate: -180 }}
                          whileInView={{ scale: 1, rotate: 0 }}
                          viewport={{ once: true }}
                          transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 15,
                            delay: 0.1 + index * 0.05,
                          }}
                        />
                      ))}
                    </div>
                    <motion.div
                      className='text-cyan-400 font-mono text-xs tracking-wider'
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.2, delay: 0.2 }}
                    >
                      ▲ QUBIC DIVISION UNIT ▲
                    </motion.div>
                  </div>
                </motion.div>

                {/* Terminal Content */}
                <div className='p-6 lg:p-8'>
                  <motion.h2
                    className='text-4xl lg:text-5xl font-black text-cyan-400 mb-6 tracking-wider font-mono text-center'
                    initial={{ opacity: 0, y: 15, scale: 0.9 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 20,
                      duration: 0.35,
                      delay: 0.1,
                    }}
                  >
                    ABOUT QDOGE
                  </motion.h2>
                  <div className='flex justify-center mb-4'>
                    <video
                      src='https://cb9j9fxetpmnxx5v.public.blob.vercel-storage.com/qdoge-promo.mp4'
                      controls
                      playsInline
                      className='object-cover'
                      width={500}
                      height={300}
                    />
                  </div>
                  <div className='space-y-4 text-muted-text font-mono text-sm lg:text-base leading-relaxed pt-4'>
                    {[
                      "a futuristic ai robotic shiba inu, sent from the future by anna's consciousness. born from qubic's overclocked mining rigs in aigarth's yard. mission: prepare the qubic community for the ultimate dogecoin mining conquest.",
                      "after monero, qubic's eyes turned toward dogecoin. doge is a giant defended by massive hashpower and entrenched asic miners. success requires more than brute force: preparation, unity, and strategy.",
                      'join the kennel club. train for 52 weeks. fetch, stay, bark. earn treats and rewards. prepare for the 2026 doge mining revolution.',
                    ].map((text, index) => (
                      <motion.p
                        key={index}
                        initial={{ opacity: 0, x: -40, filter: 'blur(5px)' }}
                        whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                        viewport={{ once: true }}
                        transition={{
                          type: 'spring',
                          stiffness: 250,
                          damping: 22,
                          duration: 0.35,
                          delay: 0.15 + index * 0.08,
                        }}
                      >
                        {text}
                      </motion.p>
                    ))}
                  </div>
                </div>
              </MagicCard>
            </motion.div>

            {/* Right Panel - Holographic Portrait */}

            
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
