// Keeps a Discord voice channel's name updated as a live QDOGE price ticker.
//
// Price source: quhub.app's public QX average-price chart for QDOGE. Its
// most recent entry is a rolling average of today's trades on QX (updates as
// trades happen), not a single last-trade tick -- a steadier number for a
// ticker than the raw order book, and it needs no wallet/signing setup.
//
// Discord only allows 2 name/topic changes per channel per 10 minutes
// (undocumented but well-known limit; a 429 with a `retry_after` is the
// enforcement mechanism). UPDATE_INTERVAL_MS defaults to 10 minutes to stay
// comfortably under that, and a run is skipped entirely if the price hasn't
// changed since the last update.
//
// Setup:
//   1. Create a bot at https://discord.com/developers/applications, add it
//      to your server with the "Manage Channels" permission.
//   2. Right-click the voice channel -> Copy Channel ID (enable Developer
//      Mode in Discord settings if you don't see this).
//   3. Run:
//        DISCORD_BOT_TOKEN=... DISCORD_VOICE_CHANNEL_ID=... node scripts/discord-price-ticker.mjs
//      Keep it running (pm2, a systemd service, screen/tmux, etc.) -- it's a
//      long-lived process, not a one-shot script.

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_VOICE_CHANNEL_ID = process.env.DISCORD_VOICE_CHANNEL_ID;
const UPDATE_INTERVAL_MS = Number(process.env.UPDATE_INTERVAL_MS) || 10 * 60 * 1000;

if (!DISCORD_BOT_TOKEN || !DISCORD_VOICE_CHANNEL_ID) {
  console.error('Missing DISCORD_BOT_TOKEN or DISCORD_VOICE_CHANNEL_ID env vars.');
  process.exit(1);
}

const QDOGE_ISSUER_ID = 'QDOGEEESKYPAICECHEAHOXPULEOADTKGEJHAVYPFKHLEWGXXZQUGIGMBUTZE';
const PRICE_FEED_URL = `https://api.quhub.app/service/v1/qx/issuer/${QDOGE_ISSUER_ID}/asset/QDOGE/chart/average-price`;
const DISCORD_CHANNEL_URL = `https://discord.com/api/v10/channels/${DISCORD_VOICE_CHANNEL_ID}`;

async function fetchQdogePriceQu() {
  const res = await fetch(PRICE_FEED_URL);
  if (!res.ok) throw new Error(`Price feed returned ${res.status}`);
  const days = await res.json();
  const today = days.at(-1);
  if (!today) throw new Error('Price feed returned no data');
  return Math.round(today.averagePrice);
}

function formatChannelName(priceQu) {
  return `🤑 QDoge Price: ${priceQu} qu`;
}

async function renameChannel(name) {
  const res = await fetch(DISCORD_CHANNEL_URL, {
    method: 'PATCH',
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });

  if (res.status === 429) {
    const { retry_after: retryAfter } = await res.json();
    console.warn(`Rate limited by Discord, retrying after ${retryAfter}s`);
    await new Promise((r) => setTimeout(r, retryAfter * 1000 + 500));
    return renameChannel(name);
  }

  if (!res.ok) {
    throw new Error(`Discord API returned ${res.status}: ${await res.text()}`);
  }
}

let lastName = null;

async function tick() {
  try {
    const priceQu = await fetchQdogePriceQu();
    const name = formatChannelName(priceQu);
    if (name === lastName) {
      console.log(`[${new Date().toISOString()}] Price unchanged (${name}), skipping update.`);
      return;
    }
    await renameChannel(name);
    lastName = name;
    console.log(`[${new Date().toISOString()}] Channel renamed to "${name}"`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Tick failed:`, err.message);
  }
}

tick();
setInterval(tick, UPDATE_INTERVAL_MS);
