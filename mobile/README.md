# QDOGE Move to Earn — mobile app

Expo/React Native client for the walkies protocol. Records walk sessions
from the device pedometer and GPS, submits telemetry to the backend
(`/api/move-to-earn` in this repo), and shows credited steps and pending
treats. The app never mines and never computes its own rewards — the
server validates every session.

## Run it

```bash
cd mobile
npm install
npm start          # Expo dev server; scan the QR with Expo Go
```

Set `API_BASE` in `src/config.ts` to your dev machine's LAN address
(e.g. `http://192.168.1.20:3000/api/move-to-earn`) while the website runs
`npm run dev` in the repo root.

## Status

Working MVP loop: link wallet → walk (pedometer + GPS recording) →
submit telemetry → see credited steps and payouts.

Before launch:

- Device attestation (Play Integrity / App Attest) on register + submit
- Request signing so telemetry can't be replayed or forged in transit
- Health Connect / HealthKit as the step source (requires a dev build,
  not Expo Go) with background session recording
- Split into its own repository once org repo creation is available
