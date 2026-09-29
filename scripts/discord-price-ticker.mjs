// Keeps Discord voice channels updated as live price tickers, one per asset
// listed in scripts/lib/discord-ticker-core.mjs's TICKERS.
//
// This is the standalone, long-running version -- for running it as a
// Netlify scheduled function instead (recommended if the site is already on
// Netlify: no server to keep alive), see netlify/functions/discord-price-ticker.mjs.
//
// Price source: quhub.app's public QX average-price chart, per asset. Its
// most recent entry is a rolling average of today's trades on QX (updates as
// trades happen), not a single last-trade tick -- a steadier number for a
// ticker than the raw order book, and it needs no wallet/signing setup.
//
// One bot token can manage any number of channels, in the same server or
// across several servers -- you don't need a bot per channel. The only
// per-channel constraint is Discord's rename rate limit: 2 name/topic
// changes per channel per 10 minutes (undocumented but well-known; a 429
// with a `retry_after` is the enforcement mechanism). That limit is tracked
// independently per channel, so adding more tickers to this same bot doesn't
// make it worse. UPDATE_INTERVAL_MS defaults to 10 minutes to stay
// comfortably under it, and a channel is skipped whenever its price hasn't
// changed since the last update.
//
// Setup:
//   1. Create a bot at https://discord.com/developers/applications, add it
//      to your server(s) with the "Manage Channels" permission.
//   2. Right-click each voice channel -> Copy Channel ID (enable Developer
//      Mode in Discord settings if you don't see this).
//   3. Copy .env.example to .env and fill in the token + channel IDs.
//   4. Run: npm run discord:price-ticker
//      Keep it running (pm2, a systemd service, screen/tmux, etc.) -- it's a
//      long-lived process, not a one-shot script.

import { TICKERS, tickOne } from './lib/discord-ticker-core.mjs';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const UPDATE_INTERVAL_MS = Number(process.env.UPDATE_INTERVAL_MS) || 10 * 60 * 1000;

if (!DISCORD_BOT_TOKEN) {
  console.error('Missing DISCORD_BOT_TOKEN env var.');
  process.exit(1);
}

const lastNames = new Map();

async function tick() {
  // Sequential, not parallel: each channel is its own rate-limit bucket, but
  // there's no need to hammer Discord with N simultaneous requests either.
  for (const ticker of TICKERS) {
    try {
      const name = await tickOne(DISCORD_BOT_TOKEN, ticker, {
        onSkipUnchanged: (t, name) => lastNames.get(t.label) === name,
      });
      if (name) lastNames.set(ticker.label, name);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] ${ticker.label} tick failed:`, err.message);
    }
  }
}

tick();
setInterval(tick, UPDATE_INTERVAL_MS);
