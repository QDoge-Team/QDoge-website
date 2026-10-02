/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';
import { TextAnimate } from '@/components/ui/text-animate';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import {
  TwitterLogoIcon,
  DiscordLogoIcon,
} from '@radix-ui/react-icons';

const FooterSection: React.FC = () => {
  const headerAnimation = useScrollAnimation({
    animationType: 'mainAnim1',
    threshold: 0.2,
  });
  const linksAnimation = useScrollAnimation({
    animationType: 'mainAnim2',
    threshold: 0.3,
  });
  const statsAnimation = useScrollAnimation({
    animationType: 'mainAnim1',
    threshold: 0.4,
  });

  const socialLinks = [
    {
      name: 'Twitter / X',
      href: 'https://x.com/QDogeOnQubic',
      icon: TwitterLogoIcon,
      color: 'hover:text-cyan-400',
    },
    {
      name: 'Discord',
      href: 'https://discord.gg/2VvEuzzUSM',
      icon: DiscordLogoIcon,
      color: 'hover:text-blue-400',
    },
    {
      name: 'Zealy',
      href: 'https://zealy.io/cw/qdoge',
      image: '/zealy_icon.png',
      color: 'hover:text-purple-400',
    },
  ];

  const quickLinks = [
    { name: 'About', href: '#about' },
    { name: 'Kennel Club', href: 'https://kennelclub.qdogeonqubic.com/',
      external: true,
    },
    { name: 'Tokenomics', href: '#tokenomics' },
    { name: 'Airdrop', href: '#airdrop-mechanisms' },
    { name: 'Roadmap', href: '#roadmap' },
    { name: 'faq', href: '#faq' },
  ];

  return (
    <footer className='relative bg-surface border-t border-border overflow-hidden'>
      {/* Cyberpunk Background Effects */}
      <div className='absolute inset-0 bg-linear-to-br from-surface via-background to-surface' />
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(0,243,255,0.15),transparent_50%)]' />
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(188,19,254,0.15),transparent_50%)]' />

      <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20'>
        {/* Main Footer Content */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 mb-12'>
          {/* Brand Section */}
          <div
            ref={headerAnimation.elementRef}
            className={`${headerAnimation.animationClass}`}
          >
            <div className='flex items-center space-x-3 mb-6'>
              <div className='relative'>
                <div className='relative p-1 rounded-full border border-cyan-400/30 bg-cyan-400/5 backdrop-blur-sm'>
                  <img
                    src='/logo.png'
                    alt='QDOGE'
                    className='h-10 w-10 object-contain relative z-10'
                    onError={(e) => {
                      e.currentTarget.src = '/logo.png';
                    }}
                  />
                </div>
                <div className='absolute inset-0 bg-cyan-400/20 rounded-full blur-lg animate-pulse' />
              </div>
              <TextAnimate
                animation='fadeIn'
                className='text-2xl lg:text-3xl font-black bg-linear-to-r from-cyan-400 via-purple-400 to-green-400 bg-clip-text text-transparent font-mono'
              >
                QDOGE
              </TextAnimate>
            </div>

            <p className='text-muted-text leading-relaxed mb-6 max-w-md font-mono text-sm'>
              Sent from the future by Anna, QDoge is the AI robotic Shiba Inu that scouts Dogecoin, trains Qubic miners, and rewards the most obedient with generational treats.
            </p>

            <div className='flex items-center space-x-4'>
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={`p-3 bg-surface/50 border border-border hover:border-cyan-400/50 transition-all duration-300 ${social.color} hover:scale-110 backdrop-blur-sm`}
                  aria-label={social.name}
                >
                  {social.image ? (
                    <img
                      src={social.image}
                      alt={social.name}
                      className='w-5 h-5 object-contain dark:brightness-0 dark:invert'
                    />
                  ) : social.icon ? (
                    <social.icon className='w-5 h-5' />
                  ) : null}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div
            ref={linksAnimation.elementRef}
            className={`${linksAnimation.animationClass}`}
          >
            <h3 className='text-xl font-bold text-cyan-400 mb-6 font-mono'>
              navigation
            </h3>
            <ul className='space-y-3'>
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className='text-muted-text hover:text-cyan-400 transition-colors duration-200 flex items-center group font-mono text-sm'
                  >
                    <span>&gt; {link.name.toLowerCase()}</span>
                    <ExternalLink className='w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200' />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Mission Stats */}
          <div
            ref={statsAnimation.elementRef}
            className={`${statsAnimation.animationClass}`}
          >
            <h3 className='text-xl font-bold text-purple-400 mb-6 font-mono'>
              mission_stats
            </h3>
            <div className='space-y-4'>
              <div className='p-4 bg-surface/50 border border-cyan-400/30 hover:border-cyan-400/50 transition-colors duration-300'>
                <div className='text-2xl font-bold text-cyan-400 font-mono'>
                  21B
                </div>
                <div className='text-muted-text text-sm font-mono'>
                  total_supply
                </div>
              </div>
              <div className='p-4 bg-surface/50 border border-purple-400/30 hover:border-purple-400/50 transition-colors duration-300'>
                <div className='text-2xl font-bold text-purple-400 font-mono'>
                  100
                </div>
                <div className='text-muted-text text-sm font-mono'>
                  kennel_members
                </div>
              </div>
              <div className='p-4 bg-surface/50 border border-green-400/30 hover:border-green-400/50 transition-colors duration-300'>
                <div className='text-2xl font-bold text-green-400 font-mono'>
                  52
                </div>
                <div className='text-muted-text text-sm font-mono'>
                  training_weeks
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terminal Divider */}
        <div className='w-full h-px bg-linear-to-r from-transparent via-cyan-400/50 to-transparent mb-8' />

        {/* Bottom Copyright Section */}
        <div className='text-center'>
          <p className='text-muted-text font-mono text-sm'>
            © 2025 QDOGE. All rights reserved.
          </p>
          <p className='text-cyan-400 font-mono text-xs mt-2'>
            Built with 💙 for the Qubic community
          </p>
        </div>
      </div>

      {/* Cyberpunk Bottom Border */}
      <div className='absolute bottom-0 left-0 w-full h-1 bg-linear-to-r from-cyan-400 to-purple-400 opacity-60' />
    </footer>
  );
};

export default FooterSection;
