// Keeps Discord voice channels updated as live price tickers, one per asset
// listed in TICKERS below.
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
//   3. Fill in the channel IDs in TICKERS below.
//   4. Run:
//        DISCORD_BOT_TOKEN=... node scripts/discord-price-ticker.mjs
//      Keep it running (pm2, a systemd service, screen/tmux, etc.) -- it's a
//      long-lived process, not a one-shot script.

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const UPDATE_INTERVAL_MS = Number(process.env.UPDATE_INTERVAL_MS) || 10 * 60 * 1000;

if (!DISCORD_BOT_TOKEN) {
  console.error('Missing DISCORD_BOT_TOKEN env var.');
  process.exit(1);
}

const QDOGE_ISSUER_ID = 'QDOGEEESKYPAICECHEAHOXPULEOADTKGEJHAVYPFKHLEWGXXZQUGIGMBUTZE';
const QPAY_ISSUER_ID = 'QPAYNOWSWZMGHFEAEVJXGZAVSHABAZDDBDIHTEBOPCOGHRGBCYCUZOHCVLXG';
const QPAYHUB_ISSUER_ID = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB';

// Fill in each `channelId` with the target voice channel's ID (or an env var).
const TICKERS = [
  {
    label: 'QDOGE',
    issuer: QDOGE_ISSUER_ID,
    asset: 'QDOGE',
    emoji: '🤑',
    channelId: process.env.DISCORD_CHANNEL_ID_QDOGE,
  },
  {
    label: 'QTREAT',
    issuer: QDOGE_ISSUER_ID,
    asset: 'QTREAT',
    emoji: '🍬',
    channelId: process.env.DISCORD_CHANNEL_ID_QTREAT,
  },
  {
    label: 'QPAY',
    issuer: QPAY_ISSUER_ID,
    asset: 'QPAY',
    emoji: '💳',
    channelId: process.env.DISCORD_CHANNEL_ID_QPAY,
  },
  {
    label: 'QPAYHUB',
    issuer: QPAYHUB_ISSUER_ID,
    asset: 'QPAYHUB',
    emoji: '🏦',
    channelId: process.env.DISCORD_CHANNEL_ID_QPAYHUB,
  },
];

async function fetchAveragePriceQu(issuer, asset) {
  const url = `https://api.quhub.app/service/v1/qx/issuer/${issuer}/asset/${asset}/chart/average-price`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Price feed returned ${res.status}`);
  const days = await res.json();
  const today = days.at(-1);
  if (!today) throw new Error('Price feed returned no data');
  return Math.round(today.averagePrice);
}

function formatChannelName(ticker, priceQu) {
  return `${ticker.emoji} ${ticker.label} Price: ${priceQu.toLocaleString('en-US')} qu`;
}

async function renameChannel(channelId, name) {
  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });

  if (res.status === 429) {
    const { retry_after: retryAfter } = await res.json();
    console.warn(`[${channelId}] Rate limited by Discord, retrying after ${retryAfter}s`);
    await new Promise((r) => setTimeout(r, retryAfter * 1000 + 500));
    return renameChannel(channelId, name);
  }

  if (!res.ok) {
    throw new Error(`Discord API returned ${res.status}: ${await res.text()}`);
  }
}

const lastNames = new Map();

async function tickOne(ticker) {
  if (!ticker.channelId) {
    console.warn(`[${ticker.label}] No channel ID configured, skipping.`);
    return;
  }
  try {
    const priceQu = await fetchAveragePriceQu(ticker.issuer, ticker.asset);
    const name = formatChannelName(ticker, priceQu);
    if (lastNames.get(ticker.label) === name) {
      console.log(`[${new Date().toISOString()}] ${ticker.label} unchanged (${name}), skipping.`);
      return;
    }
    await renameChannel(ticker.channelId, name);
    lastNames.set(ticker.label, name);
    console.log(`[${new Date().toISOString()}] ${ticker.label} channel renamed to "${name}"`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ${ticker.label} tick failed:`, err.message);
  }
}

async function tick() {
  // Sequential, not parallel: each channel is its own rate-limit bucket, but
  // there's no need to hammer Discord with N simultaneous requests either.
  for (const ticker of TICKERS) {
    await tickOne(ticker);
  }
}

tick();
setInterval(tick, UPDATE_INTERVAL_MS);
