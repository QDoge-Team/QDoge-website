'use client';

import { MagicCard } from '@/components/ui/magic-card';
import {
  DAILY_FULL_CREDIT_STEPS,
  DAILY_HARD_CAP_STEPS,
  DEFAULT_COMMUNITY_SHARE,
  INDOOR_RATE,
  estimateEpochPayoutQus,
} from '@/lib/move-to-earn/engine';
import { formatCompact } from '@/lib/mining/format';
import {
  Activity,
  ArrowLeft,
  Calculator,
  Coins,
  Cpu,
  Fingerprint,
  Footprints,
  Gauge,
  HeartPulse,
  Hourglass,
  PiggyBank,
  ShieldCheck,
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
        <div className='text-2xl md:text-3xl font-bold text-white'>{value}</div>
        {sub ? <div className='mt-2 text-xs text-gray-400'>{sub}</div> : null}
      </MagicCard>
    </div>
  );
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className='mb-8'>
      <h2 className='text-2xl md:text-3xl font-bold text-white'>{title}</h2>
      {subtitle ? (
        <p className='mt-2 max-w-3xl text-sm md:text-base text-gray-400'>
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
    <div className='rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6'>
      <div className='flex items-center gap-3 mb-3'>
        <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 border border-cyan-400/20'>
          <Icon className='h-4.5 w-4.5 text-cyan-400' />
        </div>
        <h3 className='font-semibold text-white'>{title}</h3>
      </div>
      <p className='text-sm leading-relaxed text-gray-400'>{children}</p>
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
  const [participants, setParticipants] = useState(250);
  const [crowdSteps, setCrowdSteps] = useState(6_000);

  const payout = useMemo(
    () =>
      estimateEpochPayoutQus({
        rigIncomeQus: rigIncome,
        yourDailySteps: yourSteps,
        otherParticipants: participants,
        othersAvgDailySteps: crowdSteps,
      }),
    [rigIncome, yourSteps, participants, crowdSteps]
  );

  const communityPool = Math.floor(rigIncome * DEFAULT_COMMUNITY_SHARE);

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
              label='Other participants'
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
              Your estimated payout / epoch
            </span>
            <div className='mt-3 text-3xl md:text-4xl font-bold text-cyan-300'>
              {formatCompact(payout)}
            </div>
            <span className='mt-1 text-xs text-gray-400'>QUBIC</span>
            <div className='mt-4 border-t border-white/10 pt-4 text-xs text-gray-400'>
              Community pool this epoch:{' '}
              <span className='text-gray-200 font-semibold'>
                {formatCompact(communityPool)}
              </span>{' '}
              QUBIC ({Math.round(DEFAULT_COMMUNITY_SHARE * 100)}% of rig
              income)
            </div>
          </div>
        </div>
        <p className='mt-6 text-xs leading-relaxed text-gray-500'>
          Estimates only. Real payouts are computed per Qubic epoch from the
          rig&apos;s actual income and every participant&apos;s verified
          activity — the pool is a share of real mining income, so the program
          can never promise more than the rig earns.
        </p>
      </MagicCard>
    </div>
  );
}

/* ---------------- PAGE ---------------- */

const HOW_IT_WORKS = [
  {
    icon: Footprints,
    title: '1 · Move',
    body: 'Walk or run with the QDOGE app. Your phone records steps, GPS and motion data through the OS health APIs — it never mines and never drains your battery.',
  },
  {
    icon: ShieldCheck,
    title: '2 · Verify',
    body: 'Sessions are validated server-side: device attestation, gait and speed plausibility checks, and per-day caps decide how many steps actually count.',
  },
  {
    icon: Cpu,
    title: '3 · Mine',
    body: 'A dedicated QDOGE mining rig does the real work, earning QUBIC every epoch. Value comes from hardware built for it — not from your pocket.',
  },
  {
    icon: Wallet,
    title: '4 · Earn',
    body: 'Each epoch, the community share of rig income is split proportionally to verified activity and paid straight to your Qubic wallet ID.',
  },
];

const ANTI_CHEAT = [
  {
    icon: Fingerprint,
    title: 'Device attestation',
    body: 'Play Integrity and App Attest block emulators, rooted devices and tampered builds before they can earn a single step.',
  },
  {
    icon: HeartPulse,
    title: 'Real gait only',
    body: 'Cadence must sit in the human band with natural variance. Metronome-perfect phone shakers and swing rigs earn nothing.',
  },
  {
    icon: Gauge,
    title: 'Physics checks',
    body: 'Steps, GPS distance and motion data must agree: plausible stride length, no vehicle speeds, no GPS teleports.',
  },
  {
    icon: Users,
    title: 'Sybil resistance',
    body: 'One earning account per attested device and one payout wallet per verified identity, with probation for new accounts.',
  },
  {
    icon: Hourglass,
    title: 'Epoch settlement',
    body: 'Rewards accrue as pending and settle per Qubic epoch — flagged accounts forfeit pending balances before funds ever move.',
  },
  {
    icon: PiggyBank,
    title: 'Bounded rewards',
    body: `Daily caps and diminishing returns past ${formatCompact(DAILY_FULL_CREDIT_STEPS)} steps mean even an undetected cheat can only take one small, capped slice.`,
  },
];

export function MoveToEarnPageContent() {
  return (
    <div className='mx-auto max-w-6xl px-4 pb-24 pt-28 md:pt-32'>
      <Link
        href='/'
        className='inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-cyan-300'
      >
        <ArrowLeft className='h-4 w-4' />
        Back to home
      </Link>

      {/* Hero */}
      <div className='mt-8 mb-14'>
        <span className='inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/[0.06] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-300 font-mono'>
          <Activity className='h-3.5 w-3.5' />
          Coming soon · giving back to the Qubic community
        </span>
        <h1 className='mt-5 text-4xl md:text-6xl font-bold text-white'>
          Move to <span className='text-cyan-400'>Earn</span>
        </h1>
        <p className='mt-5 max-w-3xl text-base md:text-lg leading-relaxed text-gray-400'>
          A QDOGE mining rig earns real QUBIC every epoch. You earn a slice of
          it by simply moving — verified steps decide your share of the pool.
          Your phone tracks activity; dedicated hardware does the mining. No
          battery drain, no on-device mining, no empty promises.
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
          sub='treadmill & no-GPS sessions still count'
          icon={Activity}
          gradientFrom='rgba(251, 191, 36, 0.25)'
        />
      </div>

      {/* How it works */}
      <section className='mb-16'>
        <SectionHeading
          title='How it works'
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
          title='Payout simulator'
          subtitle='The exact reward engine that will settle real payouts, running live in your browser. Drag the sliders to see how rig income, your activity and the size of the crowd shape your epoch payout.'
        />
        <div className='flex items-center gap-2 mb-4 text-xs text-gray-500'>
          <Calculator className='h-4 w-4' />
          Proportional share · trust-weighted · dust carried over between
          epochs
        </div>
        <PayoutSimulator />
      </section>

      {/* Anti-cheat */}
      <section className='mb-16'>
        <SectionHeading
          title='Fair by design'
          subtitle='Real money attracts cheaters, so the program assumes them from day one. Layered defenses make cheating cost more than the capped reward it could ever take.'
        />
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {ANTI_CHEAT.map((item) => (
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
          <h2 className='text-2xl md:text-3xl font-bold text-white'>
            Want in on the first epoch?
          </h2>
          <p className='mx-auto mt-3 max-w-2xl text-sm md:text-base text-gray-400'>
            The mobile app is in development. Join the QDOGE Discord to follow
            progress, help test the beta, and be first in line when the rig
            starts paying out.
          </p>
          <a
            href='https://discord.gg/rZd5JW4Vjt'
            target='_blank'
            rel='noopener noreferrer'
            className='mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-6 py-3 text-sm font-semibold text-cyan-300 transition-colors hover:bg-cyan-400/20'
          >
            Join the Discord
          </a>
        </MagicCard>
      </section>
    </div>
  );
}
