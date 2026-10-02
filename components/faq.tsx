'use client';

import { MagicCard } from '@/components/ui/magic-card';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { ChevronDown, HelpCircle } from 'lucide-react';
import React, { useLayoutEffect, useRef, useState } from 'react';

const faqs = [
  {
    question: 'How do I join the QDoge Kennel Club?',
    answer:
      'Register your wallet on Zealy, then follow weekly instructions: fetch the required amount of QDOGE, keep a positive balance (stay), and post your bark on X.',
  },
  {
    question: 'What happens if I miss a week?',
    answer:
      'You may fall behind on the Kennel List and lose access to certain treats. The system is designed to reward consistent, long-term obedience.',
  },
  {
    question: 'How does the QXMR trade-in work?',
    answer:
      'Send QXMR to the designated trade-in address at a 100:1 ratio. QDOGE is sent back, and a share of the airdrop allocation is reserved for these power players.',
  },
  {
    question: 'When do QDoge mining rewards start?',
    answer:
      "Mining-linked rewards and the 2.5% monthly airdrop are scheduled to begin in Sept '26, once Doge mining parameters are locked in.",
  },
  {
    question: 'WHAT HAPPENS IF I MISS A WEEK?',
    answer:
      'You may fall behind on the Kennel List and lose access to certain treats. The system is designed to reward consistent, long-term obedience. But if you fall behind, follow weekly instructions to get back on the list!',
  },
];

const FAQSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const sectionAnimation = useScrollAnimation({
    animationType: 'mainAnim1',
    threshold: 0.15,
  });

  useLayoutEffect(() => {
    if (sectionRef.current) sectionAnimation.elementRef(sectionRef.current);
  }, [sectionAnimation]);

  const sectionAnimClass = sectionAnimation.animationClass;

  return (
    <section
      id='faq'
      ref={sectionRef}
      className={`relative py-20 lg:py-28 overflow-hidden ${sectionAnimClass}`}
    >
      <div className='absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,var(--color-border)_10%,transparent_60%)] opacity-70' />

      <div className='relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-12 lg:mb-16'>
          <p className='inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-400/40 bg-cyan-400/5 text-cyan-300 font-mono text-xs tracking-[0.3em] uppercase'>
            <HelpCircle className='w-4 h-4 text-cyan-300' />
            FAQ
          </p>
          <h2 className='mt-6 text-3xl lg:text-5xl font-black font-mono text-foreground'>
            Answers from the Cyber Kennel
          </h2>
          <p className='mt-4 text-muted-text font-mono text-sm max-w-2xl mx-auto'>
            Tap into the kennel console to decode how training, trade-ins, and
            mining rewards sync up across the QDOGE ecosystem.
          </p>
        </div>

        <MagicCard className='border-2 border-cyan-400/60 bg-surface/80 backdrop-blur-sm'>
          <div className='divide-y divide-cyan-400/20'>
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;

              return (
                <div key={faq.question}>
                  <button
                    type='button'
                    className='w-full flex items-center justify-between px-6 py-5 text-left text-surface-foreground font-mono uppercase tracking-wide hover:bg-cyan-400/5 transition-colors'
                    onClick={() =>
                      setOpenIndex((prev) => (prev === index ? null : index))
                    }
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${index}`}
                  >
                    <span className='text-base lg:text-lg'>{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-cyan-300 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : 'rotate-0'
                      }`}
                    />
                  </button>
                  <div
                    id={`faq-panel-${index}`}
                    className={`overflow-hidden transition-all duration-300 ${
                      isOpen ? 'max-h-96' : 'max-h-0'
                    }`}
                  >
                    <p className='px-6 pb-6 text-sm lg:text-base text-muted-text font-mono leading-relaxed'>
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </MagicCard>
      </div>
    </section>
  );
};

export default FAQSection;


