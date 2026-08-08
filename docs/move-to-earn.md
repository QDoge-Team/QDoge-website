# QDOGE Move to Earn — Architecture

A move-to-earn program for the Qubic community: users earn QUBIC by moving,
funded by real mining income from a QDOGE-operated rig. This document is the
source of truth for the program's design. The reward math lives in
`lib/move-to-earn/engine.ts` and is shared between the website simulator and
the future settlement backend.

## Core principle

**Payouts are a share of actual income, never a fixed rate per activity.**

The rig earns a pool of QUBIC each epoch; participants split the community
share of that pool proportionally to verified activity. More users means
thinner slices — countered by adding rig capacity — but the program can never
pay out more than it earned. This is the single rule that keeps the model
solvent regardless of user growth or mining-yield swings.

Phones never mine. On-device mining is prohibited by both app stores,
thermally hopeless, and economically pointless. The phone contributes *proof
of activity*; dedicated hardware contributes the value.

## System overview

```
mining rig ──► Qubic pool ──► payout wallet (epoch income)
                                    │
mobile app ──► telemetry ──► backend validation ──► activity ledger
                                    │
                     epoch settlement (engine.ts math)
                                    │
                      Qubic transfers to user wallet IDs
```

1. **Rig → wallet.** The rig mines through a Qubic pool (qubic.li / Apool /
   MinerLab); the pool pays QUBIC to a program-controlled wallet each epoch.
   Adding rigs, or third-party miners contributing for a revenue share,
   requires no app changes — everything keys off the wallet.
2. **App → backend.** The app records steps/GPS/motion via HealthKit and
   Health Connect and uploads signed session telemetry. The client never
   submits a bare step total.
3. **Validation.** The backend applies the session checks below and credits
   steps into a per-day, per-account ledger.
4. **Settlement.** At each epoch boundary the backend reads the wallet's
   income, runs `computeEpochDistribution`, holds a fraud-review window, then
   sends transfers to participants' Qubic wallet IDs.

## Reward engine (implemented in `engine.ts`)

- **Community share:** 60% of epoch rig income is distributed; 40% retained
  for infrastructure and margin.
- **Daily credit curve:** full credit to 10,000 steps/day, half credit from
  10,000–20,000, nothing beyond. Caps every account's daily earning power.
- **Indoor rate:** no-GPS sessions (treadmills) earn 50% — real users aren't
  punished, phone-in-a-sock pays poorly.
- **Holder boost:** holding QDOGE in the linked wallet multiplies share
  weight — 1M+ → 1.10x, 10M+ → 1.25x, 100M+ → 1.50x (cap). The qualifying
  balance is the *minimum* held across the whole epoch, verified on-chain,
  so flash-buying before settlement earns nothing. The boost redistributes
  within the fixed pool; it never inflates total payouts.
- **Distribution:** shares proportional to trust-weighted effective steps;
  integer qus with largest-remainder rounding so payouts sum exactly to the
  pool; payouts under 1,000 qus roll into the next epoch.

## Anti-cheat layers

| Layer | Mechanism |
| --- | --- |
| Device attestation | Play Integrity / App Attest: no emulators, root, or tampered builds |
| Trusted sources | Health API entries filtered by origin; manual/third-party entries discarded |
| Physics checks | Cadence 1.3–2.5 Hz, ≤15 km/h sustained, stride 0.5–1.2 m, no GPS teleports |
| Gait realism | Inter-step variance floor rejects metronome-perfect shaker rigs |
| Sybil resistance | One account per attested device, one wallet per verified identity, new-account probation |
| Economic containment | Daily caps + diminishing returns + epoch-delayed settlement with forfeiture of pending balances |
| Cohort monitoring | Offline jobs flag 24/7 activity, cloned movement fingerprints, inhuman earning patterns → trust score |

Cheating is made unprofitable, not impossible: attestation and server-side
authority kill the industrial attacks; caps bound whatever slips through.

## Build phases

1. **Website (this repo, done):** program page at `/move-to-earn` with the
   live payout simulator running the real engine; community onboarding via
   Discord.
2. **Backend (scaffolded in this repo):** activity API, validation
   pipeline, and epoch settlement are implemented as Next.js routes over a
   swappable Store interface (`lib/move-to-earn/store.ts`):
   - `POST /api/move-to-earn/register` — create an account for a Qubic
     wallet ID (probation trust score)
   - `POST /api/move-to-earn/activity` — submit session telemetry; the
     server validates and credits steps (never a bare step count)
   - `GET /api/move-to-earn/account/{id}` — today's credit, trust,
     pending payouts
   - `POST /api/move-to-earn/epoch/settle` — admin-only (M2E_ADMIN_TOKEN
     bearer), idempotent epoch settlement into pending payouts
   - `GET /api/move-to-earn/epoch/{n}` — public settlement summary
   Before launch: swap the in-memory Store for a real database, gate
   registration/activity behind device attestation + request signing, read
   rig income from the payout wallet on-chain, and add the release step
   that sends the actual Qubic transfers after fraud review.
3. **Mobile app (separate repo):** React Native + HealthKit/Health Connect,
   wallet-ID linking, attestation. No miner code in the client, ever.
4. **Scale:** more rig capacity, third-party miner revenue-share, sponsored
   challenges.
