'use client';

import { MagicCard } from '@/components/ui/magic-card';
import {
  DAILY_FULL_CREDIT_STEPS,
  DAILY_HARD_CAP_STEPS,
  DEFAULT_COMMUNITY_SHARE,
  HOLDER_BOOST_TIERS,
  INDOOR_RATE,
  estimateEpochPayoutQus,
  holderBoostMultiplier,
} from '@/lib/move-to-earn/engine';
import { formatCompact } from '@/lib/mining/format';
import {
  Activity,
  ArrowLeft,
  Bone,
  Coins,
  Cpu,
  Dog,
  Fingerprint,
  Footprints,
  Gauge,
  HeartPulse,
  Hourglass,
  PiggyBank,
  Rocket,
  Users,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

/* ---------------- SHARED UI ---------------- */

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  gradientFrom,
}: {
  label: string;
  value: string;
  sub?: ReactNode;
  icon: typeof Coins;
  gradientFrom: string;
}) {
  return (
    <div className='flex h-full min-h-[120px] flex-col rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_24px_rgba(0,243,255,0.06)]'>
      <MagicCard
        className='h-full min-h-[120px] flex-1 flex flex-col rounded-2xl p-5 md:p-6'
        gradientFrom={gradientFrom}
        gradientTo='rgba(10, 10, 10, 0.95)'
        gradientColor='rgba(0, 243, 255, 0.12)'
        gradientOpacity={0.3}
      >
        <div className='flex items-center justify-between gap-2 mb-3'>
          <span className='text-[10px] uppercase tracking-[0.18em] text-gray-400 font-mono'>
            {label}
          </span>
          <Icon className='h-4 w-4 text-cyan-400/85 shrink-0' />
        </div>
        <div className='text-2xl md:text-3xl font-bold font-mono text-white'>
          {value}
        </div>
        {sub ? (
          <div className='mt-2 text-xs text-cyan-100/60 font-mono'>{sub}</div>
        ) : null}
      </MagicCard>
    </div>
  );
}

function SectionHeading({
  label,
  title,
  subtitle,
}: {
  label: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className='mb-8'>
      <h2 className='font-mono text-xs uppercase tracking-[0.2em] text-gray-400'>
        {label}
      </h2>
      <div className='mt-2 text-2xl md:text-3xl font-bold font-mono text-white tracking-tight'>
        {title}
      </div>
      {subtitle ? (
        <p className='mt-3 max-w-3xl text-sm leading-relaxed text-cyan-100/70 font-mono'>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Coins;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className='rounded-2xl border border-white/10 bg-black/60 backdrop-blur-sm p-5 md:p-6'>
      <div className='flex items-center gap-3 mb-3'>
        <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 border border-cyan-400/20'>
          <Icon className='h-4.5 w-4.5 text-cyan-400' />
        </div>
        <h3 className='font-semibold font-mono text-white'>{title}</h3>
      </div>
      <p className='text-sm leading-relaxed text-cyan-100/60 font-mono'>
        {children}
      </p>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (n: number) => string;
  onChange: (n: number) => void;
}) {
  return (
    <label className='block'>
      <div className='flex items-center justify-between gap-3 mb-2'>
        <span className='text-[10px] uppercase tracking-[0.18em] text-gray-400 font-mono'>
          {label}
        </span>
        <span className='text-sm font-semibold text-cyan-300 font-mono'>
          {format(value)}
        </span>
      </div>
      <input
        type='range'
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className='w-full accent-cyan-400'
      />
    </label>
  );
}

/* ---------------- SIMULATOR ---------------- */

function PayoutSimulator() {
  const [rigIncome, setRigIncome] = useState(500_000_000);
  const [yourSteps, setYourSteps] = useState(8_000);
  const [yourQdoge, setYourQdoge] = useState(0);
  const [participants, setParticipants] = useState(250);
  const [crowdSteps, setCrowdSteps] = useState(6_000);

  const payout = useMemo(
    () =>
      estimateEpochPayoutQus({
        rigIncomeQus: rigIncome,
        yourDailySteps: yourSteps,
        yourQdogeBalance: yourQdoge,
        otherParticipants: participants,
        othersAvgDailySteps: crowdSteps,
      }),
    [rigIncome, yourSteps, yourQdoge, participants, crowdSteps]
  );

  const communityPool = Math.floor(rigIncome * DEFAULT_COMMUNITY_SHARE);
  const boost = holderBoostMultiplier(yourQdoge);

  return (
    <div className='rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_24px_rgba(0,243,255,0.06)]'>
      <MagicCard
        className='rounded-2xl p-6 md:p-8'
        gradientFrom='rgba(34, 211, 238, 0.25)'
        gradientTo='rgba(10, 10, 10, 0.95)'
        gradientColor='rgba(0, 243, 255, 0.12)'
        gradientOpacity={0.3}
      >
        <div className='grid gap-8 lg:grid-cols-[1fr_260px]'>
          <div className='space-y-6'>
            <Slider
              label='Rig income per epoch (QUBIC)'
              value={rigIncome}
              min={50_000_000}
              max={2_000_000_000}
              step={50_000_000}
              format={formatCompact}
              onChange={setRigIncome}
            />
            <Slider
              label='Your average daily steps'
              value={yourSteps}
              min={1_000}
              max={20_000}
              step={500}
              format={(n) => n.toLocaleString('en-US')}
              onChange={setYourSteps}
            />
            <Slider
              label='Your QDOGE holdings'
              value={yourQdoge}
              min={0}
              max={150_000_000}
              step={1_000_000}
              format={formatCompact}
              onChange={setYourQdoge}
            />
            <Slider
              label='Other trainees in the kennel'
              value={participants}
              min={10}
              max={5_000}
              step={10}
              format={(n) => n.toLocaleString('en-US')}
              onChange={setParticipants}
            />
            <Slider
              label='Their average daily steps'
              value={crowdSteps}
              min={1_000}
              max={20_000}
              step={500}
              format={(n) => n.toLocaleString('en-US')}
              onChange={setCrowdSteps}
            />
          </div>
          <div className='flex flex-col justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-6 text-center'>
            <span className='text-[10px] uppercase tracking-[0.18em] text-gray-400 font-mono'>
              Your treats per epoch
            </span>
            <div className='mt-3 text-3xl md:text-4xl font-bold font-mono text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.45)]'>
              {formatCompact(payout)}
            </div>
            <span className='mt-1 text-xs text-gray-400 font-mono'>QUBIC</span>
            <div
              className={
                boost > 1
                  ? 'mt-3 inline-flex items-center justify-center gap-1.5 self-center rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold font-mono text-amber-300'
                  : 'mt-3 text-xs text-gray-500 font-mono'
              }
            >
              <Rocket className='inline h-3.5 w-3.5' />
              {boost > 1
                ? `Holder boost active: ${boost.toFixed(2)}x`
                : 'No holder boost'}
            </div>
            <div className='mt-4 border-t border-white/10 pt-4 text-xs text-gray-400 font-mono'>
              Community pool this epoch:{' '}
              <span className='text-gray-200 font-semibold'>
                {formatCompact(communityPool)}
              </span>{' '}
              QUBIC ({Math.round(DEFAULT_COMMUNITY_SHARE * 100)}% of rig
              income)
            </div>
          </div>
        </div>
        <p className='mt-6 text-xs leading-relaxed text-gray-500 font-mono'>
          Estimates only. Real payouts are computed per Qubic epoch from the
          rig&apos;s actual income and every trainee&apos;s verified activity —
          the pool is a share of real mining income, so the program can never
          promise more than the rig earns.
        </p>
      </MagicCard>
    </div>
  );
}

/* ---------------- PAGE ---------------- */

const HOW_IT_WORKS = [
  {
    icon: Footprints,
    title: '1 · Walkies',
    body: 'Walk or run with the QDOGE app. Your phone records steps, GPS and motion through the OS health APIs — it never mines and never drains your battery.',
  },
  {
    icon: Dog,
    title: '2 · Sniff check',
    body: 'Every session gets sniffed server-side: device attestation, gait and speed plausibility checks, and daily caps decide how many steps actually count.',
  },
  {
    icon: Cpu,
    title: '3 · The rig digs',
    body: "A dedicated QDOGE mining rig does the real digging, earning QUBIC every epoch. Value comes from hardware built for it — not from your phone's battery.",
  },
  {
    icon: Bone,
    title: '4 · Treats',
    body: 'Each epoch, the community share of rig income is split proportionally to verified walkies and paid straight to your Qubic wallet ID.',
  },
];

const KENNEL_RULES = [
  {
    icon: Fingerprint,
    title: 'No robo-dogs',
    body: 'Play Integrity and App Attest block emulators, rooted devices and tampered builds before they can earn a single step.',
  },
  {
    icon: HeartPulse,
    title: 'Real trots only',
    body: 'Cadence must sit in the natural band with organic variance. Metronome-perfect phone shakers and swing rigs earn nothing.',
  },
  {
    icon: Gauge,
    title: 'Physics checks',
    body: 'Steps, GPS distance and motion data must agree: plausible stride length, no vehicle speeds, no GPS teleports.',
  },
  {
    icon: Users,
    title: 'One dog, one bowl',
    body: 'One earning account per attested device and one payout wallet per verified identity, with probation for new trainees.',
  },
  {
    icon: Hourglass,
    title: 'Epoch settlement',
    body: 'Treats accrue as pending and settle per Qubic epoch — flagged accounts forfeit pending balances before funds ever move.',
  },
  {
    icon: PiggyBank,
    title: 'Bounded rewards',
    body: `Daily caps and diminishing returns past ${formatCompact(DAILY_FULL_CREDIT_STEPS)} steps mean even an undetected cheat can only take one small, capped slice.`,
  },
];

export function MoveToEarnPageContent() {
  return (
    <div className='relative min-h-screen'>
      {/* Background layers, matching site sub-pages */}
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

        {/* Hero */}
        <div className='max-w-4xl mb-14'>
          <p className='inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-black/70 px-4 py-1 text-[11px] tracking-[0.28em] uppercase text-cyan-300 font-mono mb-5'>
            <span className='h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse' />
            Walkies protocol · Coming soon
          </p>
          <h1 className='text-4xl sm:text-5xl md:text-6xl font-bold font-mono text-white tracking-tight mb-3'>
            <span className='bg-linear-to-r from-cyan-400 via-purple-400 to-amber-300 bg-clip-text text-transparent'>
              Move to Earn
            </span>
          </h1>
          <p className='text-cyan-100/70 text-sm font-mono max-w-2xl leading-relaxed'>
            The QDOGE rig digs for QUBIC every epoch. You go for walkies. Good
            dogs split the treats. Your phone only tracks verified movement —
            the mining happens on real hardware, so there&apos;s no battery
            drain and no empty promises.
          </p>
        </div>

        {/* Program parameters */}
        <div className='mb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <StatCard
            label='Community share'
            value={`${Math.round(DEFAULT_COMMUNITY_SHARE * 100)}%`}
            sub='of rig income distributed each epoch'
            icon={PiggyBank}
            gradientFrom='rgba(34, 211, 238, 0.25)'
          />
          <StatCard
            label='Full credit'
            value={`${formatCompact(DAILY_FULL_CREDIT_STEPS)} steps`}
            sub={`half credit to ${formatCompact(DAILY_HARD_CAP_STEPS)}, capped beyond`}
            icon={Footprints}
            gradientFrom='rgba(52, 211, 153, 0.25)'
          />
          <StatCard
            label='Payout cycle'
            value='Every epoch'
            sub='settled weekly with Qubic epochs'
            icon={Hourglass}
            gradientFrom='rgba(168, 85, 247, 0.25)'
          />
          <StatCard
            label='Indoor rate'
            value={`${Math.round(INDOOR_RATE * 100)}%`}
            sub='treadmill & no-GPS walkies still count'
            icon={Activity}
            gradientFrom='rgba(251, 191, 36, 0.25)'
          />
        </div>

        {/* How it works */}
        <section className='mb-16'>
          <SectionHeading
            label='The loop'
            title='How walkies work'
            subtitle='Move-to-earn done honestly: your movement is the distribution mechanism, the mining rig is the production mechanism.'
          />
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {HOW_IT_WORKS.map((item) => (
              <InfoCard key={item.title} icon={item.icon} title={item.title}>
                {item.body}
              </InfoCard>
            ))}
          </div>
        </section>

        {/* Simulator */}
        <section className='mb-16'>
          <SectionHeading
            label='Treat calculator'
            title='Simulate your epoch payout'
            subtitle='The exact reward engine that will settle real payouts, running live in your browser. Drag the sliders to see how rig income, your walkies and the size of the kennel shape your share.'
          />
          <PayoutSimulator />
        </section>

        {/* Holder boost */}
        <section className='mb-16'>
          <SectionHeading
            label='Loyalty pays'
            title='Hold QDOGE, earn more'
            subtitle='Holding QDOGE in your linked wallet multiplies your share of every epoch pool. The boost applies to the minimum balance you held across the whole epoch — flash-buying before a payout earns nothing.'
          />
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <div className='rounded-2xl border border-white/10 bg-black/60 backdrop-blur-sm p-5 md:p-6 text-center'>
              <div className='text-[10px] uppercase tracking-[0.18em] text-gray-400 font-mono'>
                Base
              </div>
              <div className='mt-3 text-3xl font-bold font-mono text-white'>
                1.00x
              </div>
              <div className='mt-2 text-xs text-cyan-100/60 font-mono'>
                no QDOGE required
              </div>
            </div>
            {HOLDER_BOOST_TIERS.map((tier) => (
              <div
                key={tier.minQdoge}
                className='rounded-2xl border border-amber-400/25 bg-amber-400/[0.04] p-5 md:p-6 text-center'
              >
                <div className='text-[10px] uppercase tracking-[0.18em] text-amber-300/90 font-mono'>
                  {formatCompact(tier.minQdoge)}+ QDOGE
                </div>
                <div className='mt-3 text-3xl font-bold font-mono text-amber-300'>
                  {tier.multiplier.toFixed(2)}x
                </div>
                <div className='mt-2 text-xs text-cyan-100/60 font-mono'>
                  held for the full epoch
                </div>
              </div>
            ))}
          </div>
          <p className='mt-4 text-xs leading-relaxed text-gray-500 font-mono'>
            The boost multiplies your share weight inside the fixed pool, so it
            never inflates total payouts — and it&apos;s capped at{' '}
            {HOLDER_BOOST_TIERS[HOLDER_BOOST_TIERS.length - 1].multiplier.toFixed(2)}
            x so walkies stay the primary way to earn.
          </p>
        </section>

        {/* Anti-cheat */}
        <section className='mb-16'>
          <SectionHeading
            label='Kennel rules'
            title='Fair by design'
            subtitle='Real treats attract cheaters, so the program assumes them from day one. Layered defenses make cheating cost more than the capped reward it could ever fetch.'
          />
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {KENNEL_RULES.map((item) => (
              <InfoCard key={item.title} icon={item.icon} title={item.title}>
                {item.body}
              </InfoCard>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className='rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_24px_rgba(0,243,255,0.06)]'>
          <MagicCard
            className='rounded-2xl p-8 md:p-10 text-center'
            gradientFrom='rgba(34, 211, 238, 0.25)'
            gradientTo='rgba(10, 10, 10, 0.95)'
            gradientColor='rgba(0, 243, 255, 0.12)'
            gradientOpacity={0.3}
          >
            <h2 className='text-2xl md:text-3xl font-bold font-mono text-white'>
              Want in on the first epoch?
            </h2>
            <p className='mx-auto mt-3 max-w-2xl text-sm text-cyan-100/70 font-mono'>
              The mobile app is in training. Join the Kennel Club on Discord to
              follow progress, help test the beta, and be first in line when
              the rig starts paying out treats.
            </p>
            <a
              href='https://discord.gg/rZd5JW4Vjt'
              target='_blank'
              rel='noopener noreferrer'
              className='mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-6 py-3 text-sm font-semibold font-mono text-cyan-300 transition-colors hover:bg-cyan-400/20'
            >
              <Wallet className='h-4 w-4' />
              Join the Kennel Club
            </a>
          </MagicCard>
        </section>
      </div>
    </div>
  );
}
