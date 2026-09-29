// Shared logic for the Discord price ticker, used by both the standalone
// long-running script (scripts/discord-price-ticker.mjs) and the Netlify
// scheduled function (netlify/functions/discord-price-ticker.mjs).

export const QDOGE_ISSUER_ID = 'QDOGEEESKYPAICECHEAHOXPULEOADTKGEJHAVYPFKHLEWGXXZQUGIGMBUTZE';
export const QPAY_ISSUER_ID = 'QPAYNOWSWZMGHFEAEVJXGZAVSHABAZDDBDIHTEBOPCOGHRGBCYCUZOHCVLXG';
export const QPAYHUB_ISSUER_ID = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB';

// Fill in each `channelId` with the target voice channel's ID (or an env var).
export const TICKERS = [
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

export async function fetchAveragePriceQu(issuer, asset) {
  const url = `https://api.quhub.app/service/v1/qx/issuer/${issuer}/asset/${asset}/chart/average-price`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Price feed returned ${res.status}`);
  const days = await res.json();
  const today = days.at(-1);
  if (!today) throw new Error('Price feed returned no data');
  return Math.round(today.averagePrice);
}

export function formatChannelName(ticker, priceQu) {
  return `${ticker.emoji} ${ticker.label} Price: ${priceQu.toLocaleString('en-US')} qu`;
}

export async function renameChannel(botToken, channelId, name) {
  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bot ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });

  if (res.status === 429) {
    const { retry_after: retryAfter } = await res.json();
    console.warn(`[${channelId}] Rate limited by Discord, retrying after ${retryAfter}s`);
    await new Promise((r) => setTimeout(r, retryAfter * 1000 + 500));
    return renameChannel(botToken, channelId, name);
  }

  if (!res.ok) {
    throw new Error(`Discord API returned ${res.status}: ${await res.text()}`);
  }
}

/** Fetches a ticker's price and renames its channel. Skips (doesn't throw) if channelId is unset. */
export async function tickOne(botToken, ticker, { onSkipUnchanged } = {}) {
  if (!ticker.channelId) {
    console.warn(`[${ticker.label}] No channel ID configured, skipping.`);
    return;
  }
  const priceQu = await fetchAveragePriceQu(ticker.issuer, ticker.asset);
  const name = formatChannelName(ticker, priceQu);
  if (onSkipUnchanged?.(ticker, name)) {
    console.log(`[${new Date().toISOString()}] ${ticker.label} unchanged (${name}), skipping.`);
    return;
  }
  await renameChannel(botToken, ticker.channelId, name);
  console.log(`[${new Date().toISOString()}] ${ticker.label} channel renamed to "${name}"`);
  return name;
}
