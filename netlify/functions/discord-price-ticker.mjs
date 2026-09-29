// Netlify Scheduled Function: runs on the cron below (no server to keep
// alive, unlike scripts/discord-price-ticker.mjs's long-running version).
//
// Each invocation is a fresh, stateless run, so unlike the standalone script
// there's no in-memory "skip if price unchanged" -- it renames every
// configured channel on every run. At a 10-minute schedule that's 1 of
// Discord's 2-renames-per-10-minutes-per-channel budget, so there's no rate
// limit risk from always renaming.
//
// Setup:
//   1. Deploy this file (Netlify auto-detects anything under netlify/functions).
//   2. In the Netlify dashboard: Site configuration -> Environment variables,
//      add DISCORD_BOT_TOKEN and the DISCORD_CHANNEL_ID_* vars (see
//      .env.example for the full list). These are separate from your local
//      .env -- Netlify doesn't read that file.
//   3. Redeploy (or trigger a deploy) so the function picks up the env vars.
// The schedule below is UTC cron syntax; adjust if you want a different cadence.

import { TICKERS, tickOne } from '../../scripts/lib/discord-ticker-core.mjs';

export default async () => {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    console.error('Missing DISCORD_BOT_TOKEN env var.');
    return new Response('Missing DISCORD_BOT_TOKEN', { status: 500 });
  }

  const results = await Promise.allSettled(TICKERS.map((ticker) => tickOne(botToken, ticker)));

  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(`[${new Date().toISOString()}] ${TICKERS[i].label} tick failed:`, result.reason?.message);
    }
  });

  return new Response('ok');
};

export const config = {
  schedule: '*/10 * * * *',
};
