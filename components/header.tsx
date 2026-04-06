/* eslint-disable @next/next/no-img-element */
'use client';

import { Dock, DockIcon } from '@/components/ui/dock';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { TextAnimate } from '@/components/ui/text-animate';
import { cn } from '@/lib/utils';
import { DiscordLogoIcon } from '@radix-ui/react-icons';
import { Menu, MessageCircle, X, Zap } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

/* ---------------- TYPES ---------------- */

type NavItem =
  | {
      label: string;
      scrollTo: string;
    }
  | {
      label: string;
      href: string;
      external?: boolean;
      isNew?: boolean;
    };

/* ---------------- DATA ---------------- */

const navigationItems: NavItem[] = [
  { label: 'About', scrollTo: '#about' },
  {
    label: 'Kennel Club',
    href: 'https://kennelclub.qdogeonqubic.com/',
    external: true,
  },
  { label: 'Tokenomics', scrollTo: '#tokenomics' },
  { label: 'Airdrop', scrollTo: '#airdrop-mechanisms' },
  { label: 'Roadmap', scrollTo: '#roadmap' },
  { label: 'Faq', scrollTo: '#faq' },
  { label: 'Doge Stats', href: '/doge-stats', isNew: true },
];

/* ---------------- COMPONENT ---------------- */

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (selector: string) => {
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  const joinDiscord = () => {
    window.open('https://discord.gg/rZd5JW4Vjt', '_blank');
  };

  return (
    <>
      {/* HEADER */}
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled
            ? 'bg-black/80 backdrop-blur-xl border-b border-white/10'
            : 'bg-transparent'
        )}
      >
        <div className='max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-14 sm:h-16 md:h-18 lg:h-20'>
            {/* LOGO */}
            <Link href='/' className='flex items-center space-x-2 z-50 group'>
              <div className='relative shrink-0'>
                <div className='p-1 rounded-full border border-cyan-400/30 bg-cyan-400/5'>
                  <img
                    src='/logo.png'
                    alt='QDOGE'
                    className='h-8 w-8 object-contain'
                  />
                </div>
                <div className='absolute inset-0 bg-cyan-400/20 rounded-full blur-lg animate-pulse' />
              </div>

              <TextAnimate
                animation='fadeIn'
                className='text-lg font-bold bg-linear-to-r from-cyan-400 via-purple-400 to-green-400 bg-clip-text text-transparent'
              >
                QDOGE
              </TextAnimate>
            </Link>

            {/* DESKTOP NAV */}
            <nav className='hidden md:flex items-center space-x-6'>
              {navigationItems.map((item) =>
                'scrollTo' in item ? (
                  <button
                    key={item.label}
                    onClick={() => scrollToSection(item.scrollTo)}
                    className='text-gray-300 hover:text-cyan-400 transition-colors text-sm uppercase tracking-wider'
                  >
                    {item.label}
                  </button>
                ) : item.external ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-gray-300 hover:text-cyan-400 transition-colors text-sm uppercase tracking-wider'
                  >
                    {item.label}
                  </Link>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      'text-gray-300 hover:text-cyan-400 transition-colors text-sm uppercase tracking-wider',
                      item.isNew && 'relative mr-2 inline-block pr-[3.25rem]'
                    )}
                  >
                    {item.label}
                    {item.isNew ? (
                      <span
                        className='pointer-events-none absolute -right-0.5 -top-2 flex h-5 min-w-[2.25rem] items-center justify-center rounded-md border border-cyan-400/70 bg-black px-1 text-[8px] font-extrabold leading-none tracking-wide text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.45)] font-mono'
                        title='Beta'
                      >
                        BETA
                      </span>
                    ) : null}
                  </Link>
                )
              )}
            </nav>

            {/* DESKTOP CTA */}
            <div className='hidden md:flex'>
              <ShimmerButton
                className='px-4 py-2 text-sm font-bold uppercase'
                shimmerColor='#00f3ff'
                background='linear-gradient(135deg, #0f172a, #1e293b)'
                onClick={joinDiscord}
              >
                <span className='flex items-center gap-2'>
                  <DiscordLogoIcon />
                  Join Discord
                </span>
              </ShimmerButton>
            </div>

            {/* MOBILE TOGGLE */}
            <button
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              className='md:hidden p-2 text-gray-300 hover:text-cyan-400'
              aria-label='Toggle menu'
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className='fixed inset-0 z-40 md:hidden bg-black/90 backdrop-blur-xl pt-20 px-6'>
          <nav className='space-y-6'>
            {navigationItems.map((item) =>
              'scrollTo' in item ? (
                <button
                  key={item.label}
                  onClick={() => scrollToSection(item.scrollTo)}
                  className='block w-full text-left text-xl text-gray-300 hover:text-cyan-400'
                >
                  {item.label}
                </button>
              ) : item.external ? (
                <a
                  key={item.label}
                  href={item.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='block w-full text-left text-xl text-gray-300 hover:text-cyan-400'
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'block w-full text-left text-xl text-gray-300 hover:text-cyan-400',
                    item.isNew && 'relative w-fit pr-[4.5rem]'
                  )}
                >
                  {item.label}
                  {item.isNew ? (
                    <span
                      className='pointer-events-none absolute -top-0.5 right-0 flex h-7 items-center justify-center rounded-md border border-cyan-400/70 bg-black px-2 text-[10px] font-extrabold leading-none tracking-wide text-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.45)] font-mono'
                      title='Beta'
                    >
                      BETA
                    </span>
                  ) : null}
                </Link>
              )
            )}
          </nav>

          <div className='mt-10'>
            <ShimmerButton
              className='w-full py-3 text-lg font-bold uppercase'
              shimmerColor='#00f3ff'
              background='linear-gradient(135deg, #0f172a, #1e293b)'
              onClick={joinDiscord}
            >
              <MessageCircle className='mr-2' />
              Join Discord
            </ShimmerButton>
          </div>
        </div>
      )}

      {/* FLOATING DOCK */}
      <div className='hidden 2xl:block fixed bottom-8 left-1/2 -translate-x-1/2 z-40'>
        <Dock className='bg-black/30 backdrop-blur-md border-white/10'>
          <DockIcon>
            <button onClick={joinDiscord} className='text-cyan-400'>
              <MessageCircle />
            </button>
          </DockIcon>
          <DockIcon>
            <button onClick={() => scrollToSection('#about')} className='text-cyan-400'>
              <Zap />
            </button>
          </DockIcon>
        </Dock>
      </div>
    </>
  );
}